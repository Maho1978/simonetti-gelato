import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Public: Jeder kann Feature-Status sehen
    try {
      const { data, error } = await supabase
        .from('feature_toggles')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      res.status(200).json({ features: data })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch features' })
    }
  } else if (req.method === 'PUT') {
    // Admin only: Feature toggle ändern
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const isAdmin = user.email === process.env.ADMIN_EMAIL || 
                    user.user_metadata?.role === 'admin'

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' })
    }

    try {
      const { id, enabled, config } = req.body

      const updateData: any = {}
      if (typeof enabled !== 'undefined') updateData.enabled = enabled
      if (config) updateData.config = config

      const { data, error } = await supabaseAdmin
        .from('feature_toggles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      res.status(200).json({ feature: data })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update feature' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
