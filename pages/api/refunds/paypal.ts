import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal Token-Fehler (${res.status})`)
  const data = await res.json()
  if (!data.access_token) throw new Error('PayPal Token leer')
  return data.access_token as string
}

async function lookupCaptureId(orderToken: string, accessToken: string): Promise<string | null> {
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderToken}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0]
  return capture?.id ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { orderId, amount } = req.body as { orderId?: string; amount?: string }

  if (!orderId) return res.status(400).json({ error: 'orderId fehlt' })
  if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount)) {
    return res.status(400).json({ error: 'amount (Euro-String, z.B. "3.50") erforderlich' })
  }
  const amountNum = parseFloat(amount)
  if (amountNum <= 0) return res.status(400).json({ error: 'amount muss > 0 sein' })

  const { data: order, error: dbErr } = await supabaseAdmin
    .from('orders')
    .select('id, payment_intent_id, paypal_capture_id, payment_method, total, refund_amount')
    .eq('id', orderId)
    .single()

  if (dbErr || !order) return res.status(404).json({ error: 'Bestellung nicht gefunden' })

  let accessToken: string
  try {
    accessToken = await getPayPalToken()
  } catch (err: any) {
    return res.status(502).json({ error: err.message || 'PayPal Auth fehlgeschlagen' })
  }

  // Capture-ID ermitteln
  let captureId = order.paypal_capture_id as string | null

  if (!captureId) {
    const token = order.payment_intent_id as string | null
    if (!token) {
      return res.status(422).json({
        error: 'Keine PayPal-Referenz auf dieser Bestellung. Manuell im PayPal-Backend erstatten.',
      })
    }
    captureId = await lookupCaptureId(token, accessToken)
    if (!captureId) {
      return res.status(422).json({
        error: 'PayPal Capture nicht auffindbar (Token evtl. abgelaufen). Bitte manuell im PayPal-Backend erstatten.',
      })
    }
    // Capture-ID für künftige Refunds nachträglich speichern
    await supabaseAdmin.from('orders').update({ paypal_capture_id: captureId }).eq('id', orderId)
  }

  // Refund auslösen
  try {
    const refundRes = await fetch(`${PAYPAL_BASE}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: { value: amountNum.toFixed(2), currency_code: 'EUR' },
      }),
    })
    const refundData = await refundRes.json()

    if (!refundRes.ok || refundData.status === 'FAILED') {
      console.error('PayPal refund error:', refundData)
      return res.status(502).json({
        error: refundData?.details?.[0]?.description || refundData?.message || 'PayPal Refund fehlgeschlagen',
      })
    }

    const previous = Number(order.refund_amount) || 0
    const newTotal = +(previous + amountNum).toFixed(2)

    await supabaseAdmin
      .from('orders')
      .update({
        refund_amount: newTotal,
        refund_date: new Date().toISOString(),
      })
      .eq('id', orderId)

    return res.status(200).json({
      ok: true,
      refundId: refundData.id,
      status: refundData.status,
      amountRefunded: amountNum,
      totalRefunded: newTotal,
    })
  } catch (err: any) {
    console.error('PayPal refund fetch error:', err)
    return res.status(502).json({ error: err?.message || 'PayPal Refund Request fehlgeschlagen' })
  }
}
