// pages/api/reviews/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { customer_name, customer_email, rating, comment, order_id } = req.body

  if (!customer_name || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Name und Bewertung (1-5) sind erforderlich' })
  }

  // Prüfen ob Feature aktiv
  const { data: toggle } = await supabase
    .from('feature_toggles')
    .select('enabled')
    .eq('id', 'reviews')
    .single()

  if (!toggle?.enabled) {
    return res.status(403).json({ error: 'Bewertungssystem ist deaktiviert' })
  }

  // Doppelte Bewertung verhindern (gleiche Email + Order)
  if (customer_email && order_id) {
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('customer_email', customer_email)
      .eq('order_id', order_id)
      .single()
    if (existing) return res.status(409).json({ error: 'Du hast diese Bestellung bereits bewertet' })
  }

  const { error } = await supabase.from('reviews').insert({
    customer_name: customer_name.trim(),
    customer_email: customer_email || null,
    rating,
    comment: comment?.trim() || null,
    order_id: order_id || null,
    is_approved: false,
  })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ success: true })
}