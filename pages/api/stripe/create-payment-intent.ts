import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getActivePaymentMethods(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('feature_toggles')
      .select('id, enabled')
      .in('id', ['payment_paypal', 'payment_klarna'])

    const methods: string[] = ['card'] // Karte immer aktiv

    data?.forEach((f: any) => {
      if (f.enabled) {
        if (f.id === 'payment_paypal')  methods.push('paypal')
        if (f.id === 'payment_klarna')  methods.push('klarna')
      }
    })

    return methods
  } catch {
    return ['card']
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount, metadata } = req.body

    if (!amount || amount < 0.5) {
      return res.status(400).json({ error: 'Ungültiger Betrag: ' + amount })
    }

    const paymentMethods = await getActivePaymentMethods()

    const paymentIntent = await stripe.paymentIntents.create({
      amount:               Math.round(amount * 100),
      currency:             'eur',
      payment_method_types: paymentMethods,
      metadata:             metadata || {},
    })

    res.status(200).json({ clientSecret: paymentIntent.client_secret })

  } catch (error: any) {
    console.error('PaymentIntent Error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to create payment intent' })
  }
}