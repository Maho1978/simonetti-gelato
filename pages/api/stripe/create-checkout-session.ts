import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount, orderData } = req.body

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Ungültiger Betrag' })
    }

    // 1. Bestellung in Supabase anlegen (Status: AUSSTEHEND)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        items: orderData.items,
        subtotal: orderData.subtotal,
        delivery_fee: orderData.delivery_fee,
        tip: orderData.tip,
        total: orderData.total,
        order_type: orderData.order_type,
        payment_method: 'card',
        payment_status: 'pending',
        status: 'AUSSTEHEND',
        delivery_address: orderData.delivery_address,
        notes: orderData.notes,
        user_id: orderData.user_id || null,
        guest_email: orderData.guest_email || null,
        guest_phone: orderData.guest_phone || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order insert error:', orderError)
      return res.status(500).json({ error: 'Bestellung konnte nicht angelegt werden' })
    }

    // 2. Stripe Checkout Session erstellen
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eiscafe-simonetti.de'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Simonetti Bestellung',
              description: `${orderData.items.length} Artikel · ${orderData.order_type === 'delivery' ? 'Lieferung' : 'Abholung'}`,
              images: [`${appUrl}/logo.png`],
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      customer_email: orderData.guest_email || undefined,
      metadata: {
        order_id: order.id,
        order_type: orderData.order_type,
      },
      success_url: `${appUrl}/order-success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/order-cancelled?orderId=${order.id}`,
    })

    // 3. Session ID in Bestellung speichern
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return res.status(200).json({
      url: session.url,
      orderId: order.id,
      sessionId: session.id,
    })

  } catch (error: any) {
    console.error('Checkout Session Error:', error.message)
    return res.status(500).json({ error: error.message || 'Checkout Session fehlgeschlagen' })
  }
}