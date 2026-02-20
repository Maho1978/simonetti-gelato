import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code, orderValue } = req.body

    if (!code || !orderValue) {
      return res.status(400).json({ error: 'Code and orderValue required' })
    }

    // Gutschein validieren mit Supabase Function
    const { data, error } = await supabase.rpc('validate_voucher', {
      p_code: code.toUpperCase(),
      p_order_value: orderValue
    })

    if (error) {
      console.error('Voucher validation error:', error)
      return res.status(500).json({ error: 'Validation failed' })
    }

    const result = data[0]

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        message: result.message
      })
    }

    res.status(200).json({
      valid: true,
      discountAmount: result.discount_amount,
      message: result.message
    })

  } catch (error: any) {
    console.error('Voucher API error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}