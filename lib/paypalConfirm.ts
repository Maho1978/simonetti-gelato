// lib/paypalConfirm.ts
// Gemeinsame Bestätigungslogik für PayPal-Zahlungen — wird sowohl vom
// Client-Callback (/api/paypal/confirm-capture, sofortiges UX-Feedback)
// als auch vom PayPal-Webhook (/api/webhooks/paypal, server-seitiges
// Sicherheitsnetz) aufgerufen. Beide Wege verifizieren die Capture
// unabhängig direkt bei PayPal — nichts wird ungeprüft übernommen.
import { supabaseAdmin } from './supabaseAdmin'
import { sendNewOrderTelegram } from './telegramNotify'

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalToken(): Promise<string | null> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token || null
}

// Warnt das Team per Telegram, wenn eine Zahlung auf einer bereits abgelehnten/
// stornierten Bestellung eintrifft — das passiert, wenn Personal ablehnt, während
// die Zahlung noch unterwegs war (echter Fall 31.07.2026, Order SIM-2026-3944).
// Ohne diese Warnung fällt so ein Fall nur durch Zufall auf.
async function alertPaidAfterRejection(order: any): Promise<void> {
  try {
    const [toggleRes, settingsRes] = await Promise.all([
      supabaseAdmin.from('feature_toggles').select('enabled').eq('id', 'telegram_notify').single(),
      supabaseAdmin.from('shop_settings').select('notify_settings').eq('id', 'main').single(),
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

async function sendEmail(type: string, order: any, recipientEmail: string) {
  if (!recipientEmail || !order) return
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eiscafe-simonetti.de'
    await fetch(`${baseUrl}/api/emails/send-order-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
      body: JSON.stringify({ type, order, recipientEmail }),
    })
  } catch (err) {
    console.error(`Email-Fehler (${type}):`, err)
  }
}

export interface ConfirmResult {
  ok: boolean
  reason?: string
  alreadyPaid?: boolean
  order?: any
}

// Holt die Capture unabhängig bei PayPal ab (nicht dem Aufrufer vertrauen),
// prüft custom_id + Betrag gegen die Order und markiert sie erst dann bezahlt.
export async function confirmPaypalCapture(orderId: string, captureId: string): Promise<ConfirmResult> {
  if (!orderId || !captureId) return { ok: false, reason: 'orderId/captureId fehlt' }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()
  if (orderErr || !order) return { ok: false, reason: 'Order nicht gefunden' }

  if (order.payment_status === 'paid') return { ok: true, alreadyPaid: true }

  const token = await getPayPalToken()
  if (!token) return { ok: false, reason: 'PayPal Token nicht verfügbar' }

  const capRes = await fetch(`${PAYPAL_BASE}/v2/payments/captures/${captureId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  const capture = await capRes.json()
  if (!capRes.ok) return { ok: false, reason: `PayPal-Abfrage fehlgeschlagen: ${JSON.stringify(capture)}` }

  if (capture.status !== 'COMPLETED') return { ok: false, reason: `Capture-Status ist ${capture.status}, nicht COMPLETED` }
  if (capture.custom_id !== orderId) return { ok: false, reason: `custom_id-Mismatch: ${capture.custom_id} != ${orderId}` }

  const expected = Number(order.total || 0).toFixed(2)
  const paid = Number(capture.amount?.value || 0).toFixed(2)
  if (expected !== paid) {
    console.error(`🚨 PayPal Betrags-Mismatch Bestellung ${orderId}: bezahlt ${paid}, erwartet ${expected} — NICHT als bezahlt markiert`)
    await supabaseAdmin.from('orders').update({ payment_status: 'amount_mismatch' }).eq('id', orderId)
    return { ok: false, reason: 'Betrags-Mismatch' }
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({
      status: order.status === 'AUSSTEHEND' ? 'OFFEN' : order.status,
      payment_status: 'paid',
      paypal_capture_id: captureId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (updateErr) return { ok: false, reason: updateErr.message }

  const wasRejectedOrCancelled = order.status === 'ABGELEHNT' || order.status === 'STORNIERT'

  await Promise.allSettled([
    // Keine automatische "Bestellung bestätigt"-Mail, wenn die Order bereits abgelehnt/
    // storniert war - das könnte eine bewusste Ablehnung gewesen sein (z.B. Artikel
    // nicht verfügbar), nur die Zahlung kam zufällig trotzdem noch rein. Team entscheidet
    // nach der Telegram-Warnung, ob beliefert oder erstattet wird.
    !wasRejectedOrCancelled && updated?.customer_email && sendEmail('order_confirmed', updated, updated.customer_email),
    sendEmail('new_order_admin', updated, process.env.ADMIN_EMAIL || 'info@eiscafe-simonetti.de'),
    !wasRejectedOrCancelled && sendNewOrderTelegram(updated),
    wasRejectedOrCancelled && alertPaidAfterRejection(updated),
  ])

  return { ok: true, alreadyPaid: false, order: updated }
}
