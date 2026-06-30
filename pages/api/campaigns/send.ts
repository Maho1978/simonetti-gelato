import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function verifyAdmin(req: NextApiRequest): Promise<boolean> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return false
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth.slice(7))
  if (error || !user) return false
  return user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === 'admin'
}

async function sendBrevoEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender:    { name: 'Eiscafé Simonetti', email: 'bestellung@eiscafe-simonetti.de' },
        to:        [{ email: to }],
        replyTo:   { email: 'bestellung@eiscafe-simonetti.de' },
        subject,
        htmlContent: html,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!await verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' })

  const { subject, html, recipients } = req.body
  if (!subject || !html || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ ok: false, error: 'Missing fields' })
  }

  // Sende sequenziell mit kleiner Pause (Brevo Rate Limit: 300/min)
  let sent = 0; let failed = 0
  for (const email of recipients) {
    const ok = await sendBrevoEmail(email, subject, html)
    ok ? sent++ : failed++
    // 200ms Pause zwischen Mails
    await new Promise(r => setTimeout(r, 200))
  }

  return res.status(200).json({ ok: true, sent, failed })
}