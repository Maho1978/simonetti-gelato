import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

// Hilfsfunktion: Bestellnummer generieren z.B. "SIM-2024-0042"
function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `SIM-${year}-${rand}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── POST: Neue Bestellung ──────────────────────────────────
  if (req.method === 'POST') {
    try {
      const {
        user_id,
        guest_email,
        customer_name,
        customer_email,
        customer_phone,
        items,
        subtotal,
        discount,
        voucher_code,
        voucher_id,
        delivery_fee,
        tip,
        total,
        delivery_address,
        notes,
        payment_intent_id,
        status,
      } = req.body

      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number:      generateOrderNumber(),
          user_id:           user_id           || null,
          guest_email:       guest_email       || null,
          customer_name:     customer_name     || null,
          customer_email:    customer_email    || null,
          customer_phone:    customer_phone    || null,
          items,
          subtotal:          subtotal          ?? total,
          discount:          discount          ?? 0,
          voucher_code:      voucher_code      || null,
          voucher_id:        voucher_id        || null,
          delivery_fee:      delivery_fee      ?? 3.00,
          tip:               tip               ?? 0,
          total,
          delivery_address,
          notes:             notes             || null,
          payment_intent_id: payment_intent_id || null,
          status:            status            || 'OFFEN',
        })
        .select()
        .single()

      if (error) throw error

      res.status(200).json({ order: data })
    } catch (error: any) {
      console.error('Error creating order:', error)
      res.status(500).json({ error: error.message || 'Failed to create order' })
    }

  // ── GET: Bestellungen laden ────────────────────────────────
  } else if (req.method === 'GET') {
    try {
      const { user_id } = req.query

      let query = supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (user_id) query = query.eq('user_id', user_id as string)

      const { data, error } = await query
      if (error) throw error

      res.status(200).json({ orders: data })
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      res.status(500).json({ error: error.message || 'Failed to fetch orders' })
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}