import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatAddress(addr: any): string {
  if (!addr) return '–'
  if (typeof addr === 'string') return addr
  return [addr.street, addr.zip && addr.city ? `${addr.zip} ${addr.city}` : addr.city].filter(Boolean).join(', ')
}

function buildMessage(order: any): string {
  const orderNr   = order.order_number || order.id?.slice(-6).toUpperCase()
  const time      = new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
  const type      = order.order_type === 'pickup' ? '🏪 Abholung' : '🚗 Lieferung'
  const payment   = order.payment_method === 'cash' ? '💵 Bar' : order.payment_method === 'paypal' ? '🅿️ PayPal' : '💳 Karte'
  const total     = (order.total || 0).toFixed(2)
  const tip       = order.tip > 0 ? `\n💝 Trinkgeld: ${order.tip.toFixed(2)} €` : ''

  const items = (order.items || []).map((i: any) => {
    const flavors = (i.flavors || i.selectedFlavors || []).join(', ')
    return `  • ${i.quantity}x ${i.name}${flavors ? ` (${flavors})` : ''} – ${((i.totalPrice || i.price * i.quantity) || 0).toFixed(2)} €`
  }).join('\n')

  const notes = order.notes ? `\n💬 Anmerkung: ${order.notes}` : ''
  const addr  = order.order_type !== 'pickup' ? `\n📍 ${formatAddress(order.delivery_address)}` : ''

  return `🔔 *NEUE BESTELLUNG #${orderNr}*

⏰ ${time} Uhr · ${type} · ${payment}
👤 *${order.customer_name || 'Gast'}*${order.customer_phone ? ` · 📞 ${order.customer_phone}` : ''}${addr}

🛒 *Bestellte Artikel:*
${items}${notes}

💰 *Gesamt: ${total} €*${tip}

👉 [Zum Kanban](https://www.eiscafe-simonetti.de/admin/kanban)`
}

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

    const text = buildMessage(order)

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