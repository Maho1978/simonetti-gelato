import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('id', 'main')
        .single()

      if (error) throw error

      res.status(200).json({
        deliveryTime: data.delivery_time,
        minOrderValue: data.min_order_value,
        deliveryFee: data.delivery_fee,
        isOpen: data.is_open,
        openFrom: data.open_from || '14:00',
        openUntil: data.open_until || '22:00',
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }

  } else if (req.method === 'POST') {
    try {
      const { deliveryTime, minOrderValue, deliveryFee, isOpen, openFrom, openUntil } = req.body

      const { data, error } = await supabase
        .from('shop_settings')
        .update({
          delivery_time: deliveryTime,
          min_order_value: minOrderValue,
          delivery_fee: deliveryFee,
          is_open: isOpen,
          open_from: openFrom,
          open_until: openUntil,
        })
        .eq('id', 'main')
        .select()
        .single()

      if (error) throw error
      res.status(200).json(data)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}