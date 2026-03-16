import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const POINTS_PER_EUR = 10

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query
  const updateData = req.body

  if (!id) return res.status(400).json({ error: 'Missing order id' })

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  if (updateData.status === 'GELIEFERT' && data?.user_id) {
    try {
      const { data: flag } = await supabaseAdmin
        .from('feature_flags')
        .select('enabled')
        .eq('id', 'loyalty_enabled')
        .single()

      if (flag?.enabled) {
        const { data: existing } = await supabaseAdmin
          .from('loyalty_transactions')
          .select('id')
          .eq('order_id', id)
          .eq('reason', 'order')
          .single()

        if (!existing) {
          const baseAmount = data.subtotal || data.total || 0
          const points = Math.floor(baseAmount * POINTS_PER_EUR)

          if (points > 0) {
            await supabaseAdmin
              .from('loyalty_transactions')
              .insert({
                user_id:  data.user_id,
                points:   points,
                reason:   'order',
                order_id: id,
              })
          }
        }
      }
    } catch (e) {
      console.error('Loyalty error:', e)
    }
  }

  return res.status(200).json(data)
}