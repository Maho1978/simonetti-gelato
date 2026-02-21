import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, Passwort und Name sind Pflicht' })
  }

  try {
    // Supabase Auth User erstellen
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Sofort bestätigt - kein Email-Verify nötig
      user_metadata: {
        full_name: name,
        role: 'driver'
      }
    })

    if (authError) throw authError

    return res.status(200).json({ 
      userId: authData.user.id,
      message: 'Fahrer erfolgreich angelegt'
    })

  } catch (error: any) {
    console.error('Create driver error:', error)
    return res.status(500).json({ error: error.message })
  }
}