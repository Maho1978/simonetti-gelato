import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { buildNewOrderMessage } from '@/lib/telegramNotify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin(req: NextApiRequest): Promise<boolean> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return false
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7))
  if (error || !user) return false
  return user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === 'admin'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!await verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' })

  const { order } = req.body
  if (!order) return res.status(400).json({ error: 'Missing order' })

  try {
    // Toggle + Credentials aus shop_settings laden
    const [toggleRes, settingsRes] = await Promise.all([
      supabase.from('feature_toggles').select('enabled').eq('id', 'telegram_notify').single(),
      supabase.from('shop_settings').select('notify_settings').eq('id', 'main').single(),
    ])

    if (!toggleRes.data?.enabled) {
      return res.status(200).json({ success: true, skipped: true, reason: 'disabled' })
    }

    const notify = settingsRes.data?.notify_settings || {}
    const TELEGRAM_BOT_TOKEN = notify.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || ''
    const TELEGRAM_CHAT_ID   = notify.telegram_chat_id   || process.env.TELEGRAM_CHAT_ID   || ''

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ success: false, error: 'Telegram credentials not configured' })
    }

    const text = buildNewOrderMessage(order)

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(JSON.stringify(data))

    return res.status(200).json({ success: true, message_id: data.result?.message_id })
  } catch (err: any) {
    console.error('Telegram error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}