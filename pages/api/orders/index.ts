import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { 
        user_id, 
        guest_email,
        items, 
        total, 
        delivery_address,
        payment_intent_id 
      } = req.body

      // Create order
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: user_id || null,
          guest_email: guest_email || null,
          items,
          total,
          delivery_address,
          payment_intent_id,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      res.status(200).json({ order: data })
    } catch (error: any) {
      console.error('Error creating order:', error)
      res.status(500).json({ 
        error: error.message || 'Failed to create order' 
      })
    }
  } else if (req.method === 'GET') {
    try {
      const { user_id } = req.query

      let query = supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (user_id) {
        query = query.eq('user_id', user_id)
      }

      const { data, error } = await query

      if (error) throw error

      res.status(200).json({ orders: data })
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      res.status(500).json({ 
        error: error.message || 'Failed to fetch orders' 
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
