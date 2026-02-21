import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.body

  if (!userId) return res.status(400).json({ error: 'userId fehlt' })

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error
    return res.status(200).json({ message: 'Fahrer-Zugang gelöscht' })
  } catch (error: any) {
    console.error('Delete driver error:', error)
    return res.status(500).json({ error: error.message })
  }
}