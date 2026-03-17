import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { driver_id, latitude, longitude, accuracy, heading, speed, is_active } = req.body
    if (!driver_id) return res.status(400).json({ error: 'Missing driver_id' })

    const { error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id, lat: latitude, lng: longitude,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'driver_id' })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { driver_id } = req.body
    if (!driver_id) return res.status(400).json({ error: 'Missing driver_id' })
    await supabase.from('driver_locations').delete().eq('driver_id', driver_id)
    return res.status(200).json({ success: true })
  }

  if (req.method === 'GET') {
    const { order_id } = req.query
    const { data } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('order_id', order_id)
      .single()
    return res.status(200).json(data || {})
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
