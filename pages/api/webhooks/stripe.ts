// pages/api/webhooks/stripe.ts
import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ⚠️ PFLICHT: bodyParser aus – Stripe braucht rohen Request-Body zur Signaturprüfung
export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })

// Service-Role-Client – umgeht RLS, darf alles schreiben
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Warnt das Team per Telegram, wenn eine Zahlung auf einer bereits abgelehnten/
// stornierten Bestellung eintrifft (Personal hat abgelehnt, während die Zahlung
// noch unterwegs war). Analoge Absicherung wie in lib/paypalConfirm.ts, 31.07.2026
// nach einem echten Vorfall ergänzt.
async function alertPaidAfterRejection(order: any): Promise<void> {
  try {
    const [toggleRes, settingsRes] = await Promise.all([
      supabase.from('feature_toggles').select('enabled').eq('id', 'telegram_notify').single(),
      supabase.from('shop_settings').select('notify_settings').eq('id', 'main').single(),
    ])
    if (!toggleRes.data?.enabled) return

    const notify = settingsRes.data?.notify_settings || {}
    const token  = notify.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || ''
    const chatId = notify.telegram_chat_id   || process.env.TELEGRAM_CHAT_ID   || ''
    if (!token || !chatId) return

    const orderNr = order.order_number || (order.id || '').slice(-6).toUpperCase()
    const text = `⚠️ *ZAHLUNG NACH ABLEHNUNG/STORNO*\n\n` +
      `Bestellung #${orderNr} war *${order.status}*, jetzt ist die Zahlung eingegangen (${(order.total || 0).toFixed(2)} €).\n` +
      `👤 ${order.customer_name || 'Gast'}${order.customer_phone ? ` · 📞 ${order.customer_phone}` : ''}\n\n` +
      `Bitte prüfen: Kunde beliefern oder Geld erstatten?`

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    })
  } catch (err) {
    console.error('Telegram-Warnung (paid-after-rejection) fehlgeschlagen:', err)
  }
}

// Raw Body lesen (nötig für stripe.webhooks.constructEvent)
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// ── Haupt-Handler ─────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' })

  let event: Stripe.Event
  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Webhook Signatur-Fehler:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  console.log(`📨 Stripe Event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.succeeded':
        await onPaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await onPaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'charge.refunded':
        await onRefund(event.data.object as Stripe.Charge)
        break
      default:
        console.log(`ℹ️  Unhandled event: ${event.type}`)
    }
    return res.status(200).json({ received: true })
  } catch (err: any) {
    // Stripe-Richtlinie: immer 200 antworten nach erfolgreicher Signaturprüfung.
    // 5xx würde Stripe veranlassen, den Webhook bis zu 72h zu wiederholen.
    console.error(`❌ Fehler bei ${event.type}:`, err.message, err)
    return res.status(200).json({ received: true, warning: 'Handler error logged' })
  }
}

// ── Event-Handler ─────────────────────────────────────────────

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id || session.client_reference_id
  if (!orderId) {
    console.warn('⚠️  checkout.session.completed: kein order_id in metadata')
    return
  }

  const { data: existing } = await supabase
    .from('orders')
    .select('payment_status, total, status')
    .eq('id', orderId)
    .single()

  if (existing?.payment_status === 'paid') {
    console.log(`ℹ️  checkout.session.completed: Bestellung ${orderId} bereits bezahlt, skip.`)
    return
  }
  const wasRejectedOrCancelled = existing?.status === 'ABGELEHNT' || existing?.status === 'STORNIERT'

  // Betrags-Verifikation: gezahlter Betrag MUSS der Bestellsumme entsprechen.
  const expectedCents = Math.round(Number(existing?.total || 0) * 100)
  if (expectedCents > 0 && session.amount_total != null && session.amount_total !== expectedCents) {
    console.error(`🚨 Betrags-Mismatch Bestellung ${orderId}: bezahlt ${session.amount_total}, erwartet ${expectedCents} — NICHT als bezahlt markiert`)
    await supabase.from('orders').update({ payment_status: 'amount_mismatch' }).eq('id', orderId)
    return
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status:              wasRejectedOrCancelled ? existing!.status : 'OFFEN',
      payment_status:      'paid',
      stripe_session_id:   session.id,
      payment_intent_id:   paymentIntentId ?? null,
      payment_method:      session.payment_method_types?.[0] || 'card',
      customer_email:      session.customer_details?.email ?? null,
      customer_name:       session.customer_details?.name  ?? null,
      paid_at:             new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) { console.error('DB-Fehler checkout.session.completed:', error); throw error }

  console.log(`✅ Bestellung ${orderId} bezahlt${wasRejectedOrCancelled ? ` (Status ${existing!.status} bewusst NICHT überschrieben)` : ' & auf OFFEN gesetzt'}`)

  await Promise.allSettled([
    !wasRejectedOrCancelled && order?.customer_email && sendEmail('order_confirmed', order, order.customer_email),
    sendEmail('new_order_admin', order, process.env.ADMIN_EMAIL || 'info@eiscafe-simonetti.de'),
    wasRejectedOrCancelled && alertPaidAfterRejection(order),
  ])
}

async function onPaymentSucceeded(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.order_id
  if (!orderId) return

  const { data: existing } = await supabase
    .from('orders')
    .select('payment_status, total, status')
    .eq('id', orderId)
    .single()

  if (existing?.payment_status === 'paid') {
    console.log(`ℹ️  payment_intent.succeeded: Bestellung ${orderId} bereits bezahlt, skip.`)
    return
  }
  const wasRejectedOrCancelled = existing?.status === 'ABGELEHNT' || existing?.status === 'STORNIERT'

  // Betrags-Verifikation: gezahlter Betrag MUSS der Bestellsumme entsprechen.
  // Verhindert Preis-Manipulation (Unterbezahlung wird NICHT als bezahlt markiert).
  const expectedCents = Math.round(Number(existing?.total || 0) * 100)
  const paidCents = pi.amount_received ?? pi.amount
  if (expectedCents > 0 && paidCents !== expectedCents) {
    console.error(`🚨 Betrags-Mismatch Bestellung ${orderId}: bezahlt ${paidCents}, erwartet ${expectedCents} — NICHT als bezahlt markiert`)
    await supabase.from('orders').update({ payment_status: 'amount_mismatch' }).eq('id', orderId)
    return
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status:            wasRejectedOrCancelled ? existing!.status : 'OFFEN',
      payment_status:    'paid',
      payment_intent_id: pi.id,
      payment_method:    pi.payment_method_types?.[0] || 'card',
      paid_at:           new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) { console.error('DB-Fehler payment_intent.succeeded:', error); throw error }
  console.log(`💳 PaymentIntent succeeded für Bestellung ${orderId}${wasRejectedOrCancelled ? ` (Status ${existing!.status} bewusst NICHT überschrieben)` : ''}`)

  if (wasRejectedOrCancelled) {
    await alertPaidAfterRejection(order)
    return
  }

  // E-Mails nur senden wenn kein Stripe Checkout Session (App-Flow nutzt checkout.session.completed)
  if (order && !order.stripe_session_id) {
    await Promise.allSettled([
      order.customer_email && sendEmail('order_confirmed', order, order.customer_email),
      sendEmail('new_order_admin', order, process.env.ADMIN_EMAIL || 'info@eiscafe-simonetti.de'),
    ])
  }
}

async function onPaymentFailed(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.order_id
  if (!orderId) return

  const failMsg = pi.last_payment_error?.message || 'Unbekannter Fehler'

  await supabase
    .from('orders')
    .update({
      payment_status:    'failed',
      payment_intent_id: pi.id,
      notes:             `Zahlung fehlgeschlagen: ${failMsg}`,
    })
    .eq('id', orderId)

  console.log(`❌ Zahlung fehlgeschlagen für Bestellung ${orderId}: ${failMsg}`)
}

async function onRefund(charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id
  if (!piId) return

  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_email')
    .eq('payment_intent_id', piId)
    .single()

  if (!order) return

  await supabase
    .from('orders')
    .update({ payment_status: 'refunded' })
    .eq('id', order.id)

  console.log(`💸 Rückerstattung für Bestellung ${order.id}`)
}

// ── Email-Hilfsfunktion ───────────────────────────────────────

async function sendEmail(type: string, order: any, recipientEmail: string) {
  if (!recipientEmail || !order) return
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eiscafe-simonetti.de'
    await fetch(`${baseUrl}/api/emails/send-order-notification`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body:    JSON.stringify({ type, order, recipientEmail }),
    })
  } catch (err) {
    console.error(`Email-Fehler (${type}):`, err)
  }
}