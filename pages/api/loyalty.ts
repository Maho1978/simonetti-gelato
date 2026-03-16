import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REWARDS: Record<string, { points: number; label: string; type: string; value: number }> = {
  waffle_cup:    { points: 20,  label: 'Gratis Waffelbecher', type: 'free_item',     value: 1.50 },
  free_scoop:    { points: 60,  label: 'Gratis Kugel',         type: 'free_item',     value: 2.50 },
  free_delivery: { points: 100, label: 'Gratis Lieferung',     type: 'free_delivery', value: 0    },
  discount_10:   { points: 250, label: '10% Rabatt',           type: 'discount',      value: 10   },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { user_id } = req.query
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

    const { data: profile } = await supabaseAdmin
      .from('customer_profiles')
      .select('loyalty_points')
      .eq('id', user_id)
      .single()

    const points = profile?.loyalty_points || 0
    const rewards = Object.entries(REWARDS).map(([key, r]) => ({
      key, ...r,
      canRedeem:    points >= r.points,
      pointsNeeded: Math.max(0, r.points - points),
    }))

    return res.status(200).json({ points, rewards })
  }

  if (req.method === 'POST') {
    const { user_id, reward_key } = req.body
    if (!user_id || !reward_key) return res.status(400).json({ error: 'Missing params' })

    const reward = REWARDS[reward_key]
    if (!reward) return res.status(400).json({ error: 'Unknown reward' })

    const { data: profile } = await supabaseAdmin
      .from('customer_profiles')
      .select('loyalty_points')
      .eq('id', user_id)
      .single()

    if (!profile || profile.loyalty_points < reward.points) {
      return res.status(400).json({ error: 'Nicht genug Punkte' })
    }

    const { error } = await supabaseAdmin
      .from('loyalty_transactions')
      .insert({ user_id, points: -reward.points, reason: 'redemption' })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({
      success: true,
      reward:  { key: reward_key, label: reward.label, type: reward.type, value: reward.value },
      pointsUsed:      reward.points,
      pointsRemaining: profile.loyalty_points - reward.points,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}