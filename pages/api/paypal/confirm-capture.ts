// pages/api/paypal/confirm-capture.ts
// Wird vom Checkout direkt nach actions.order.capture() aufgerufen — für
// sofortiges UX-Feedback. Kein Vertrauen in Client-Daten: die Capture wird
// unabhängig bei PayPal verifiziert (siehe lib/paypalConfirm.ts). Fällt
// dieser Request aus (Tab zu, Netz weg), holt der PayPal-Webhook
// (/api/webhooks/paypal) dieselbe Order server-seitig nach.
import type { NextApiRequest, NextApiResponse } from 'next'
import { confirmPaypalCapture } from '@/lib/paypalConfirm'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { orderId, captureId } = req.body || {}
  if (!orderId || !captureId) return res.status(400).json({ error: 'orderId/captureId fehlt' })

  try {
    const result = await confirmPaypalCapture(orderId, captureId)
    if (!result.ok) return res.status(409).json({ error: result.reason })
    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('confirm-capture Fehler:', err)
    return res.status(500).json({ error: err.message || 'Unbekannter Fehler' })
  }
}
