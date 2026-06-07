import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { platform } = req.body as { platform?: string }

  const { error } = await supabaseAdmin
    .from('pwa_installs')
    .insert({ platform: platform ?? 'unknown' })

  if (error) return res.status(500).json({ success: false, error: error.message })

  return res.status(200).json({ success: true })
}
