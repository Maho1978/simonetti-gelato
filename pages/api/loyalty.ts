import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { user_id } = req.query
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

    const { data: profile, error: e1 } = await supabase
      .from('customer_profiles')
      .select('loyalty_points')
      .eq('id', user_id)
      .single()

    const { data: tiers, error: e2 } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .order('sort_order')

    if (e1 || e2) return res.status(200).json({ points: 0, rewards: [], tiers: null, debug: { e1, e2 } })

    const points = profile?.loyalty_points || 0
    const rewards = (tiers || []).map((t: any) => ({
      key:          t.id,
      label:        t.reward_label,
      type:         t.reward_type,
      value:        t.reward_value,
      points:       t.redeem_points ?? t.points_from,
      tierName:     t.name,
      icon:         t.icon,
      canRedeem:    points >= t.points_from,
      pointsNeeded: Math.max(0, t.points_from - points),
    }))

    return res.status(200).json({ points, rewards, tiers })
  }

  if (req.method === 'POST') {
    const { user_id, reward_key } = req.body
    if (!user_id || !reward_key) return res.status(400).json({ error: 'Missing params' })

    const { data: tier } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .eq('id', reward_key)
      .single()

    if (!tier) return res.status(400).json({ error: 'Unknown reward' })

    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('loyalty_points')
      .eq('id', user_id)
      .single()

    if (!profile || profile.loyalty_points < (tier.redeem_points ?? tier.points_from)) {
      return res.status(400).json({ error: 'Nicht genug Punkte' })
    }

    const { error } = await supabase
      .from('loyalty_transactions')
      .insert({ user_id, points: -(tier.redeem_points ?? tier.points_from), reason: 'redemption' })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({
      success:         true,
      reward:          { key: reward_key, label: tier.reward_label, type: tier.reward_type, value: tier.reward_value },
      pointsUsed:      tier.redeem_points ?? tier.points_from,
      pointsRemaining: profile.loyalty_points - (tier.redeem_points ?? tier.points_from),
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}