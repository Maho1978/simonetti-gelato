import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { amount, orderData } = req.body
    if (!amount || amount < 0.5) return res.status(400).json({ error: 'Ungültiger Betrag' })

    const appUrl = 'https://www.eiscafe-simonetti.de'

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        delivery_fee: orderData.delivery_fee || 0,
        tip: orderData.tip || 0,
        total: orderData.total || amount,
        payment_method: 'card',
        payment_status: 'pending',
        status: 'AUSSTEHEND',
        delivery_address: orderData.delivery_address || null,
        notes: orderData.notes || null,
        user_id: orderData.user_id || null,
        customer_email: orderData.guest_email || null,
        guest_email: orderData.guest_email || null,
        customer_phone: orderData.guest_phone || null,
        customer_name: orderData.customer_name || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order insert error:', orderError)
      return res.status(500).json({ error: orderError.message })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Simonetti Bestellung #' + order.id.slice(-6).toUpperCase(),
            description: `${orderData.items?.length || 1} Artikel · ${orderData.order_type === 'delivery' ? 'Lieferung' : 'Abholung'}`,
          },
          unit_amount: Math.round(Number(order.total) * 100),
        },
        quantity: 1,
      }],
      customer_email: orderData.guest_email || undefined,
      metadata: { order_id: order.id },
      success_url: `${appUrl}/order-success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/order-cancelled?orderId=${order.id}`,
    })

    await supabaseAdmin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)

    return res.status(200).json({ url: session.url, orderId: order.id })
  } catch (error: any) {
    console.error('App Checkout Error:', error)
    return res.status(500).json({ error: error.message || 'Checkout fehlgeschlagen' })
  }
}
