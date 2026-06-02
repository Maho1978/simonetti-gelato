import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { paymentIntentId, orderId } = req.body
  if (!paymentIntentId || !orderId) {
    return res.status(400).json({ error: 'paymentIntentId und orderId erforderlich' })
  }

  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { order_id: String(orderId) },
    })
    res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('PaymentIntent metadata update failed:', err.message)
    res.status(500).json({ error: err.message })
  }
}
