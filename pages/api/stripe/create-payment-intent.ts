import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount, metadata } = req.body

    if (!amount || amount < 0.5) {
      return res.status(400).json({ error: 'Ungültiger Betrag: ' + amount })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100),
      currency: 'eur',
      // Stripe zeigt automatisch alle im Dashboard aktivierten Methoden:
      // Kreditkarte, SEPA, PayPal, Klarna, giropay etc.
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {},
    })

    res.status(200).json({ clientSecret: paymentIntent.client_secret })

  } catch (error: any) {
    console.error('PaymentIntent Error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to create payment intent' })
  }
}