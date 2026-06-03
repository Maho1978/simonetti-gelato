import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function verifyAdmin(req: NextApiRequest): Promise<boolean> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return false
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth.slice(7))
  return !error && !!user && user.email === process.env.ADMIN_EMAIL
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  if (!await verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return res.status(500).json({ error: error.message })

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || '') as string,
  })).filter(u => u.email)

  res.status(200).json({ users })
}
