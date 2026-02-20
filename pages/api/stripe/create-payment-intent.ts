import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, metadata, payment_method_types } = req.body

    // ✅ DEBUG LOGGING
    console.log('🔍 Payment Intent Request:', {
      amount,
      payment_method_types,
      hasStripe: !!stripe,
      stripeKey: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING'
    })

    // Validierung
    if (!amount || amount < 0.5) {
      throw new Error('Invalid amount: ' + amount)
    }

    if (!payment_method_types || payment_method_types.length === 0) {
      throw new Error('No payment methods provided')
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      payment_method_types: payment_method_types,
      metadata: metadata || {},
    })

    console.log('✅ PaymentIntent created:', paymentIntent.id)

    res.status(200).json({ 
      clientSecret: paymentIntent.client_secret 
    })
  } catch (error: any) {
    // ✅ BESSERES ERROR LOGGING
    console.error('❌ Payment Intent Error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    })
    
    res.status(500).json({ 
      error: error.message || 'Failed to create payment intent',
      details: error.type || 'unknown_error'
    })
  }
}