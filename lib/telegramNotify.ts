// lib/telegramNotify.ts
// Sofort-Telegram-Alarm bei einer neuen, echten Bestellung — serverseitig,
// unabhängig vom Kanban-Browser-Tab. Vorher hing der einzige "neue Bestellung"-
// Alarm am 15-Sekunden-Polling im offenen Kanban-Tab; schlief das Gerät oder
// wurde die Seite >10 Min nach Bestelleingang neu geladen, blieb die Bestellung
// unbemerkt (Vorfall SIM-2026-2101, 04.08.2026 — Order lag 19 Min unbemerkt in
// OFFEN, kein Popup/Ton). Dieses Modul wird direkt bei Bestelleingang aufgerufen:
// - Barzahlung: bei Anlage der Order (payment_status ist von Anfang an "real")
// - Karte/PayPal: erst wenn die Zahlung serverseitig bestätigt ist (lib/paypalConfirm.ts,
//   pages/api/webhooks/stripe.ts) — nie für unbezahlte AUSSTEHEND-Platzhalter,
//   sonst genau das Phantom-Bestellungs-Problem von vorher (siehe lib/orderVisibility.ts).
//
// Wird NICHT mehr beim manuellen Annehmen im Kanban ausgelöst (das wäre jetzt
// eine Doppel-Benachrichtigung) — dort wurde der sendTelegram()-Aufruf entfernt.
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

export function buildNewOrderMessage(order: any): string {
  const orderNr = order.order_number || order.id?.slice(-6).toUpperCase()
  const time    = new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
  const type    = order.order_type === 'pickup' ? '🏪 Abholung' : '🚗 Lieferung'
  const payment = order.payment_method === 'cash' ? '💵 Bar' : order.payment_method === 'paypal' ? '🅿️ PayPal' : '💳 Karte'
  const total   = (order.total || 0).toFixed(2)
  const tip     = order.tip > 0 ? `\n💝 Trinkgeld: ${order.tip.toFixed(2)} €` : ''

  const items = (order.items || []).map((i: any) => {
    const flavors = (i.flavors || i.selectedFlavors || []).join(', ')
    const itemNote = i.notes ? `\n    💬 ${i.notes}` : ''
    return `  • ${i.quantity}x ${i.name}${flavors ? ` (${flavors})` : ''} – ${((i.totalPrice || i.price * i.quantity) || 0).toFixed(2)} €${itemNote}`
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

/**
 * Sendet den Sofort-Alarm für eine neue, echte Bestellung. Schlägt niemals hörbar
 * fehl — ein Telegram-Problem darf nie den Bestell-/Zahlungsfluss blockieren.
 */
export async function sendNewOrderTelegram(order: any): Promise<void> {
  try {
    const [toggleRes, settingsRes] = await Promise.all([
      supabase.from('feature_toggles').select('enabled').eq('id', 'telegram_notify').single(),
      supabase.from('shop_settings').select('notify_settings').eq('id', 'main').single(),
    ])
    if (!toggleRes.data?.enabled) return

    const notify = settingsRes.data?.notify_settings || {}
    const token  = notify.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || ''
    const chatId = notify.telegram_chat_id   || process.env.TELEGRAM_CHAT_ID   || ''
    if (!token || !chatId) return

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildNewOrderMessage(order),
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) console.error('Telegram sendNewOrderTelegram fehlgeschlagen:', await res.text())
  } catch (err) {
    console.error('Telegram sendNewOrderTelegram Fehler:', err)
  }
}
