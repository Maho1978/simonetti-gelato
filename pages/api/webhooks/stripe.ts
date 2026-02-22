// pages/api/webhooks/stripe.ts
import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ⚠️ PFLICHT: bodyParser aus – Stripe braucht rohen Request-Body zur Signaturprüfung
export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

// Service-Role-Client – umgeht RLS, darf alles schreiben
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    console.error(`❌ Fehler bei ${event.type}:`, err.message)
    return res.status(500).json({ error: 'Internal webhook error' })
  }
}

// ── Event-Handler ─────────────────────────────────────────────

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id || session.client_reference_id
  if (!orderId) {
    console.warn('⚠️  checkout.session.completed: kein order_id in metadata')
    return
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status:              'OFFEN',
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

  console.log(`✅ Bestellung ${orderId} bezahlt & auf OFFEN gesetzt`)

  await Promise.allSettled([
    order?.customer_email && sendEmail('order_confirmed',  order, order.customer_email),
    sendEmail('new_order_admin', order, process.env.ADMIN_EMAIL || 'info@eiscafe-simonetti.de'),
  ])
}

async function onPaymentSucceeded(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.order_id
  if (!orderId) return

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status:    'paid',
      payment_intent_id: pi.id,
      payment_method:    pi.payment_method_types?.[0] || 'card',
      paid_at:           new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) { console.error('DB-Fehler payment_intent.succeeded:', error); throw error }
  console.log(`💳 PaymentIntent succeeded für Bestellung ${orderId}`)
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
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, order, recipientEmail }),
    })
  } catch (err) {
    console.error(`Email-Fehler (${type}):`, err)
  }
}