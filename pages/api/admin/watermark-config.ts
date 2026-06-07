import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: publicly readable (config is non-sensitive)
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('watermark_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // PUT: admin-only
  if (req.method === 'PUT') {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

    const isAdmin =
      user.email === process.env.ADMIN_EMAIL ||
      user.user_metadata?.role === 'admin'
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

    const {
      text, font_size_percent, opacity, position,
      rotation, color, shadow_enabled, shadow_color, font_weight,
    } = req.body

    const { data, error } = await supabaseAdmin
      .from('watermark_config')
      .update({
        text, font_size_percent, opacity, position,
        rotation, color, shadow_enabled, shadow_color, font_weight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).end()
}
