import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { metadata, customerEmail } = req.body

    // Betrag NIE vom Client übernehmen — autoritativ aus der gespeicherten
    // Bestellung lesen (verhindert Preis-Manipulation: 0,50 € für 50 €-Order).
    const orderId = metadata?.order_id
    if (!orderId) return res.status(400).json({ error: 'order_id fehlt' })

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('id', orderId)
      .single()

    if (!order) return res.status(404).json({ error: 'Bestellung nicht gefunden' })

    const chargeEur = Number(order.total)
    if (!chargeEur || chargeEur < 0.5) {
      return res.status(400).json({ error: 'Ungültiger Bestellbetrag' })
    }

    const safeMetadata: Record<string, string> = {}
    if (metadata) {
      const allowed = ['voucher_code', 'voucher_id', 'discount', 'tip', 'order_id']
      for (const key of allowed) {
        if (metadata[key] != null) {
          safeMetadata[key] = String(metadata[key]).slice(0, 500)
        }
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(chargeEur * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail || undefined,
      metadata: safeMetadata,
    })

    res.status(200).json({ clientSecret: paymentIntent.client_secret })

  } catch (error: any) {
    console.error('PaymentIntent Error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to create payment intent' })
  }
}
