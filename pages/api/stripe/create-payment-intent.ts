import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { amount, metadata, payment_method_types } = req.body

      // Create payment intent with multiple payment methods
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'eur',
        payment_method_types: payment_method_types || [
          'card',
          'sepa_debit',
          'giropay',
          'sofort',
        ],
        metadata: metadata || {},
      })

      res.status(200).json({ 
        clientSecret: paymentIntent.client_secret 
      })
    } catch (error: any) {
      console.error('Error creating payment intent:', error)
      res.status(500).json({ 
        error: error.message || 'Failed to create payment intent' 
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
