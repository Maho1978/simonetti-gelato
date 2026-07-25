// pages/api/webhooks/paypal.ts
// Server-seitiges Sicherheitsnetz für PayPal-Zahlungen. Der Checkout läuft
// client-seitig (PayPal Smart Buttons) — bricht der Browser nach erfolgter
// Zahlung ab (Tab zu, Netz weg), bekommt unser Server das sonst nie mit und
// die Bestellung bleibt für immer AUSSTEHEND, obwohl das Geld schon weg ist.
// Dieser Webhook (PAYMENT.CAPTURE.COMPLETED) läuft unabhängig vom Browser
// direkt zwischen PayPal und unserem Server und holt genau diesen Fall nach.
//
// Setup (einmalig, PayPal Developer Dashboard → App → Webhooks):
//   URL:    https://eiscafe-simonetti.de/api/webhooks/paypal
//   Event:  Payment capture completed (PAYMENT.CAPTURE.COMPLETED)
//   Danach die angezeigte Webhook-ID als PAYPAL_WEBHOOK_ID in .env.local /
//   Vercel Env eintragen.
import type { NextApiRequest, NextApiResponse } from 'next'
import { confirmPaypalCapture } from '@/lib/paypalConfirm'

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

async function verifySignature(req: NextApiRequest, webhookEvent: any): Promise<boolean> {
  if (!process.env.PAYPAL_WEBHOOK_ID) {
    console.error('❌ PAYPAL_WEBHOOK_ID fehlt — Webhook kann nicht verifiziert werden')
    return false
  }
  const token = await getPayPalToken()
  if (!token) return false

  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      auth_algo: req.headers['paypal-auth-algo'],
      cert_url: req.headers['paypal-cert-url'],
      transmission_id: req.headers['paypal-transmission-id'],
      transmission_sig: req.headers['paypal-transmission-sig'],
      transmission_time: req.headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: webhookEvent,
    }),
  })
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const event = req.body

  try {
    const valid = await verifySignature(req, event)
    if (!valid) {
      console.error('❌ PayPal Webhook Signatur ungültig')
      return res.status(400).json({ error: 'Invalid signature' })
    }
  } catch (err: any) {
    console.error('❌ PayPal Webhook Signaturprüfung fehlgeschlagen:', err.message)
    return res.status(400).json({ error: 'Signature verification failed' })
  }

  console.log(`📨 PayPal Event: ${event?.event_type}`)

  try {
    if (event?.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = event.resource?.id
      const orderId = event.resource?.custom_id
      if (!captureId || !orderId) {
        console.warn('⚠️  PAYMENT.CAPTURE.COMPLETED ohne custom_id/capture id')
      } else {
        const result = await confirmPaypalCapture(orderId, captureId)
        if (!result.ok) console.error(`❌ confirmPaypalCapture (Webhook) fehlgeschlagen für ${orderId}: ${result.reason}`)
        else console.log(`✅ Bestellung ${orderId} via Webhook bestätigt`)
      }
    } else {
      console.log(`ℹ️  Unhandled event: ${event?.event_type}`)
    }
    return res.status(200).json({ received: true })
  } catch (err: any) {
    // Analog Stripe: nach erfolgreicher Signaturprüfung immer 200, sonst
    // wiederholt PayPal den Webhook unnötig oft.
    console.error(`❌ Fehler bei ${event?.event_type}:`, err.message, err)
    return res.status(200).json({ received: true, warning: 'Handler error logged' })
  }
}
