import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount, metadata, customerName, customerEmail } = req.body

    if (!amount || amount < 0.5) {
      return res.status(400).json({ error: 'Ungültiger Betrag: ' + amount })
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

    // Klarna braucht customer name + email
    const paymentIntentData: any = {
      amount:   Math.round(amount * 100),
      currency: 'eur',
      // automatic_payment_methods zeigt alle in Stripe aktivierten Methoden an
      // inkl. Karte, Apple Pay, Google Pay, Klarna, Link usw.
      automatic_payment_methods: { enabled: true },
      metadata: safeMetadata,
    }

    // Klarna benötigt Kundendaten
    if (customerName || customerEmail) {
      paymentIntentData.receipt_email = customerEmail || undefined
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    res.status(200).json({ clientSecret: paymentIntent.client_secret })

  } catch (error: any) {
    console.error('PaymentIntent Error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to create payment intent' })
  }
}