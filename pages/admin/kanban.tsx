import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import {
  ChevronLeft, ChevronRight, User, MapPin, Clock,
  Bell, BellOff, Check, Phone, Package, XCircle, Printer,
  TrendingUp, CreditCard, Banknote, ShoppingBag
} from 'lucide-react'

const COLUMNS = [
  { id: 'IN_BEARBEITUNG', title: 'In Bearbeitung', color: 'bg-blue-50',   border: 'border-blue-200',   icon: '👨‍🍳' },
  { id: 'AN_FAHRER',      title: 'An Fahrer',      color: 'bg-orange-50', border: 'border-orange-200', icon: '🚗' },
  { id: 'GELIEFERT',      title: 'Geliefert',      color: 'bg-green-50',  border: 'border-green-200',  icon: '✅' },
]

async function apiUpdateOrder(orderId: string, data: any) {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) { console.error('Order update error:', await res.json()); return false }
  return true
}

async function sendEmail(type: string, order: any) {
  if (!order?.customer_email) return
  try {
    await fetch('/api/emails/send-order-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, order, recipientEmail: order.customer_email }),
    })
  } catch (e) {}
}

async function sendTelegram(order: any) {
  try {
    await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })
  } catch (e) {}
}

async function sendPush(order: any, status: string) {
  if (!order?.user_id) return
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:      order.user_id,
        orderId:     order.id,
        orderNumber: order.order_number,
        status,
      }),
    })
  } catch (e) {}
}



function formatAddress(addr: any): string {
  if (!addr) return '–'
  if (typeof addr === 'string') return addr
  if (typeof addr === 'object') {
    const parts = []
    if (addr.street) parts.push(addr.street)
    if (addr.zip && addr.city) parts.push(`${addr.zip} ${addr.city}`)
    else if (addr.city) parts.push(addr.city)
    return parts.join(', ') || '–'
  }
  return String(addr)
}

function playSound(volume: number = 1.0) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const vol = Math.max(0.1, Math.min(2.0, volume))
    const pattern = [880, 1100]
    for (let i = 0; i < 3; i++) {
      pattern.forEach((freq, j) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'square'
        const start = ctx.currentTime + i * 0.5 + j * 0.18
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(vol, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35)
        osc.start(start); osc.stop(start + 0.35)
      })
    }
  } catch (e) {}
}

function OrderTimer({ createdAt }: { createdAt: string }) {
  const [mins, setMins] = useState(0)
  useEffect(() => {
    const calc = () => setMins(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
    calc(); const iv = setInterval(calc, 30000); return () => clearInterval(iv)
  }, [createdAt])
  const hours = Math.floor(mins / 60)
  const label = hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`
  const color = mins >= 30 ? 'text-red-600 font-bold animate-pulse'
              : mins >= 15 ? 'text-orange-500 font-semibold'
              : mins >= 10 ? 'text-yellow-600'
              : 'text-green-600'
  return <span className={`text-xs ${color}`}>⏱ {label}</span>
}

function printOrder(order: any) {
  const items = (order.items || []).map((item: any) => {
    const flavors   = item.flavors || item.selectedFlavors || []
    const extras    = (item.extras || item.selectedExtras || []).map((e: any) => e.name || e)
    const lineTotal = ((item.totalPrice || (item.price * item.quantity)) || 0).toFixed(2)
    return { ...item, flavors, extras, lineTotal }
  })

  const subtotal    = items.reduce((s: number, i: any) => s + parseFloat(i.lineTotal), 0)
  const deliveryFee = order.delivery_fee ?? 3.00
  const tip         = order.tip ?? 0
  const discount    = order.discount ?? 0
  const grandTotal  = order.total ?? (subtotal + deliveryFee + tip - discount)
  const now         = new Date(order.created_at)
  const dateStr     = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr     = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const orderNr     = order.order_number || order.id?.slice(-6).toUpperCase()
  const addrStr     = formatAddress(order.delivery_address)

  let itemsHtml = ''
  for (const item of items) {
    const extrasWithPrice = (item.selectedExtras || []).filter((e: any) => typeof e === 'object' && e.price)
    const basePrice = item.price * item.quantity
    itemsHtml += `<tr><td class="item-qty">${item.quantity}x</td><td class="item-name">${item.name || item.productName}</td><td class="item-price">${basePrice.toFixed(2)}</td></tr>`
    if (item.flavors.length > 0) itemsHtml += `<tr><td></td><td colspan="2" class="item-detail">Sorten: ${item.flavors.join(', ')}</td></tr>`
    for (const extra of extrasWithPrice) {
      itemsHtml += `<tr><td></td><td class="item-detail">+ ${extra.name}</td><td class="item-price" style="font-size:12px">${(extra.price).toFixed(2)}</td></tr>`
    }
    if (extrasWithPrice.length === 0 && item.extras.length > 0) {
      itemsHtml += `<tr><td></td><td colspan="2" class="item-detail">Extras: ${item.extras.join(', ')}</td></tr>`
    }
  }

  const discountHtml = discount > 0 ? `<tr class="total-row"><td colspan="2">Gutschein${order.voucher_code ? ` (${order.voucher_code})` : ''}</td><td>${(-discount).toFixed(2)}</td></tr>` : ''
  const tipHtml      = tip > 0 ? `<tr class="total-row"><td colspan="2">Trinkgeld</td><td>${tip.toFixed(2)}</td></tr>` : ''
  const notesHtml    = order.notes ? `<tr><td colspan="3"><div class="sep-dashed"></div></td></tr><tr><td colspan="3" class="section-label">ANMERKUNG:</td></tr><tr><td colspan="3" class="notes-text">${order.notes}</td></tr>` : ''
  const phoneHtml    = order.customer_phone ? `<tr><td colspan="3">Tel: <b>${order.customer_phone}</b></td></tr>` : ''
  const isBonCash   = order.payment_method === 'cash' || order.payment_intent_id?.startsWith('cash-')
  const isBonPayPal = !isBonCash && (order.payment_method === 'paypal' || (order.payment_intent_id && !order.payment_intent_id.startsWith('pi_') && !order.payment_intent_id.startsWith('cash-')))
  const paymentLabel = isBonCash ? 'Barzahlung' : isBonPayPal ? 'PayPal' : 'Stripe (inkl. Klarna)'
  const pickupLabel  = order.order_type === 'pickup' ? 'ABHOLUNG' : 'LIEFERUNG'

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/><title>Bon #${orderNr}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 13px; width: 76mm; color: #000; background: #fff; line-height: 1.5; padding: 3mm 4mm; }
  .center { text-align: center; }
  .logo { font-size: 22px; font-weight: 900; letter-spacing: 3px; margin-bottom: 2px; }
  .tagline { font-size: 10px; letter-spacing: 5px; margin-bottom: 4px; }
  .shop-info { font-size: 11px; font-weight: normal; line-height: 1.6; }
  .sep-solid { border-top: 2px solid #000; margin: 5px 0; }
  .sep-dashed { border-top: 1px dashed #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; table-layout: auto; }
  td { vertical-align: top; padding: 1px 0; font-size: 13px; }
  .section-label { font-size: 11px; font-weight: 900; letter-spacing: 1px; padding-top: 3px; padding-bottom: 2px; }
  .item-qty { width: 20px; font-size: 15px; font-weight: 900; white-space: nowrap; padding-left: 1px; }
  .item-name { font-size: 15px; font-weight: 900; padding-left: 4px; padding-right: 4px; word-break: break-word; }
  .item-price { width: 38px; font-size: 15px; font-weight: 900; text-align: right; white-space: nowrap; }
  .item-detail { font-size: 12px; font-weight: bold; padding-left: 26px; padding-bottom: 3px; padding-top: 1px; color: #000; line-height: 1.6; }
  .total-row td { font-size: 13px; padding: 1px 0; }
  .total-row td:last-child { text-align: right; white-space: nowrap; }
  .grand-label { font-size: 20px; font-weight: 900; }
  .grand-value { font-size: 20px; font-weight: 900; text-align: right; white-space: nowrap; }
  .notes-text { font-size: 13px; font-weight: bold; padding-bottom: 3px; }
  .footer-main { font-size: 13px; font-weight: 900; }
  .footer-small { font-size: 11px; font-weight: normal; }
  .info-label { width: 42%; font-size: 13px; }
  .info-value { text-align: right; font-size: 13px; }
  .addr-text { font-size: 13px; font-weight: bold; line-height: 1.6; padding-top: 2px; }
</style></head><body>
<div class="center">
  <div class="logo">SIMONETTI</div>
  <div class="tagline">E I S C A F E</div>
  <div class="shop-info">Konrad-Adenauer-Platz 2, 40764 Langenfeld<br/>Tel: 02173 / 16 22 780</div>
</div>
<div class="sep-solid"></div>
<table>
  <tr><td class="info-label">Bestellung</td><td class="info-value"><b>#${orderNr}</b></td></tr>
  <tr><td class="info-label">Datum</td><td class="info-value">${dateStr}</td></tr>
  <tr><td class="info-label">Uhrzeit</td><td class="info-value">${timeStr} Uhr</td></tr>
  <tr><td class="info-label">Art</td><td class="info-value"><b>${pickupLabel}</b></td></tr>
  <tr><td class="info-label">Zahlung</td><td class="info-value">${paymentLabel}</td></tr>
</table>
<div class="sep-dashed"></div>
<table>
  <tr><td colspan="3" class="section-label">${order.order_type === 'pickup' ? 'ABHOLUNG DURCH' : 'LIEFERUNG AN'}</td></tr>
  <tr><td colspan="3" style="font-size:13px"><b>${order.customer_name || '–'}</b></td></tr>
  ${phoneHtml}
  ${order.order_type !== 'pickup' ? `<tr><td colspan="3" class="addr-text">${addrStr}</td></tr>` : ''}
</table>
<div class="sep-dashed"></div>
<table>
  <tr><td colspan="3" class="section-label">BESTELLUNG</td></tr>
  ${itemsHtml}
  ${notesHtml}
</table>
<div class="sep-dashed"></div>
<table>
  <tr class="total-row"><td colspan="2">Zwischensumme</td><td style="text-align:right">${subtotal.toFixed(2)} EUR</td></tr>
  ${order.order_type !== 'pickup' ? `<tr class="total-row"><td colspan="2">Liefergebuehr</td><td style="text-align:right">${deliveryFee.toFixed(2)} EUR</td></tr>` : ''}
  ${discountHtml}
  ${tipHtml}
</table>
<div class="sep-solid"></div>
<table><tr><td class="grand-label">GESAMT</td><td class="grand-value">${grandTotal.toFixed(2)} EUR</td></tr></table>
<div class="sep-solid"></div>
<div class="center" style="margin-top:5px">
  <div class="footer-main">Vielen Dank & Guten Appetit!</div>
  <div class="footer-small" style="margin-top:2px">www.eiscafe-simonetti.de</div>
  <div class="sep-dashed" style="margin-top:5px"></div>
  <div class="footer-small">Beleg #${orderNr} · ${dateStr} · ${timeStr} Uhr</div>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 400); };</script>
</body></html>`

  const win = window.open('', '_blank', 'width=320,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

function RejectModal({ order, onConfirm, onCancel }: { order: any; onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  const REASONS = ['Liefergebiet nicht erreichbar', 'Zu viele Bestellungen – ausgelastet', 'Produkt nicht mehr verfügbar', 'Shop schließt gleich', 'Sonstiges']
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">❌</div>
          <h2 className="font-bold text-xl">Bestellung ablehnen</h2>
          <p className="text-gray-500 text-sm mt-1">#{order.order_number || order.id?.slice(-6).toUpperCase()} · {order.customer_name}</p>
        </div>
        <div className="mb-4 space-y-2">
          {REASONS.map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="w-4 h-4" />
              <span className="text-sm text-gray-700">{r}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 text-sm">Zurück</button>
          <button onClick={() => onConfirm(reason)} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 text-sm">Ablehnen</button>
        </div>
      </div>
    </div>
  )
}

function TimeAdjuster({ label, value, onChange, min = 5, max = 120, step = 5 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
      <span className="text-sm font-semibold text-gray-600">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - step))} className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-black transition font-bold">-</button>
        <span className="text-lg font-black text-gray-900 w-16 text-center">{value} Min</span>
        <button onClick={() => onChange(Math.min(max, value + step))} className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-black transition font-bold">+</button>
      </div>
    </div>
  )
}

function NewOrderPopup({ order, onAccept, onReject, onLater }: {
  order: any; onAccept: (prepTime: number, deliveryTime: number) => void; onReject: () => void; onLater: () => void
}) {
  const isPickup = order.order_type === 'pickup'
  const [prepTime, setPrepTime] = useState(15)
  const [deliveryTime, setDeliveryTime] = useState(30)
  const totalTime = isPickup ? prepTime : prepTime + deliveryTime
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden" style={{ animation: 'popIn 0.35s ease-out' }}>
        <div className="bg-red-500 text-white px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl" style={{ animation: 'bellShake 0.5s infinite' }}>🔔</span>
            <div>
              <h2 className="font-black text-3xl tracking-tight">NEUE BESTELLUNG!</h2>
              <p className="text-red-100 text-base">#{order.order_number || order.id?.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">{(order.total || 0).toFixed(2)}€</div>
            <div className="text-red-200 text-sm">{new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</div>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Kunde</h3>
              <div className="flex items-center gap-2">
                <User size={18} className="text-gray-400" />
                <span className="font-bold text-gray-900 text-lg">{order.customer_name}</span>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-gray-400" />
                  <a href={`tel:${order.customer_phone}`} className="text-blue-600 font-bold text-lg hover:underline">{order.customer_phone}</a>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {order.order_type === 'pickup' ? '🏪 Abholung' : formatAddress(order.delivery_address)}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5">
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3">Bestellung</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(order.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div>
                      <span className="font-bold text-gray-900">{item.quantity}x {item.name || item.productName}</span>
                      {item.selectedFlavors?.length > 0 && <div className="text-xs text-gray-400">🍦 {item.selectedFlavors.join(', ')}</div>}
                      {item.selectedExtras?.length > 0 && <div className="text-xs text-gray-400">➕ {item.selectedExtras.map((e: any) => e.name || e).join(', ')}</div>}
                    </div>
                    <span className="text-gray-500 font-semibold ml-2">{((item.price || 0) * item.quantity).toFixed(2)}€</span>
                  </div>
                ))}
              </div>
              {order.notes && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 text-sm">
                  💬 {order.notes}
                </div>
              )}
            </div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <span>🕐</span>
              <h3 className="font-bold text-blue-800">Geschätzte Zeit</h3>
              <span className="ml-auto text-2xl font-black text-blue-700">~{totalTime} Min</span>
            </div>
            <div className="space-y-3">
              <TimeAdjuster label="🍦 Zubereitung" value={prepTime} onChange={setPrepTime} />
              {!isPickup && <TimeAdjuster label="🚗 Lieferung" value={deliveryTime} onChange={setDeliveryTime} />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <button onClick={onReject}
              className="py-5 rounded-2xl bg-red-50 text-red-600 font-black text-xl hover:bg-red-100 transition flex items-center justify-center gap-3"
              style={{ border: '3px solid #fca5a5' }}>
              <XCircle size={28} /> Ablehnen
            </button>
            <button onClick={() => onAccept(prepTime, deliveryTime)}
              className="py-5 rounded-2xl bg-green-500 text-white font-black text-xl hover:bg-green-600 transition flex items-center justify-center gap-3 shadow-xl"
              style={{ boxShadow: '0 8px 32px rgba(34,197,94,0.4)' }}>
              <Check size={28} /> Annehmen ✓
            </button>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={() => printOrder(order)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition">
              <Printer size={16} /> Drucken
            </button>
            <button onClick={onLater} className="text-gray-400 text-sm hover:text-gray-600 transition">
              Später entscheiden →
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes popIn {
          0%   { transform: scale(0.5) translateY(40px); opacity: 0; }
          70%  { transform: scale(1.03) translateY(0); opacity: 1; }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          25%       { transform: rotate(-15deg); }
          75%       { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  )
}

function OrderDetailPopup({ order, drivers, onClose, onAccept, onReject, onMoveLeft, onMoveRight, onMarkDelivered, onAssignDriver, colIdx }: any) {
  const [waText, setWaText] = useState('')
  const [waEnabled, setWaEnabled] = useState(true)
  const status   = COLUMNS[colIdx]?.id
  const isPickup = order.order_type === 'pickup'
  const phone    = order.customer_phone?.replace(/\s+/g, '').replace(/^\+/, '').replace(/^0/, '49')
  const name     = order.customer_name || 'Kunde'
  const orderNr  = order.order_number || order.id?.slice(-6).toUpperCase()

  const WA_TEMPLATES = [
    {
      label: '✅ Bestellung bestätigt',
      text: `Hallo ${name}! Deine Bestellung #${orderNr} ist bei uns eingegangen und wird gerade zubereitet. 🍦 Ca. 30–45 Min. – Dein Simonetti Team`,
    },
    {
      label: '🚗 Unterwegs',
      text: `Hallo ${name}! Dein Eis ist unterwegs! 🚗 Unser Fahrer ist ca. 15–20 Min. bei dir. Guten Appetit! – Simonetti`,
    },
    {
      label: '🎉 Zugestellt',
      text: `Hallo ${name}! Deine Bestellung wurde zugestellt. Guten Appetit! 🍦 Wir freuen uns über eine Google Bewertung: https://g.page/r/CeAm6-NrGrYhEBE/review`,
    },
    {
      label: '⏰ Verzögerung',
      text: `Hallo ${name}! Kurze Info: Deine Bestellung #${orderNr} verzögert sich leider etwas. Wir sind so schnell wie möglich bei dir! Danke für deine Geduld 🙏 – Simonetti`,
    },
    {
      label: '❌ Abgelehnt',
      text: `Hallo ${name}! Leider können wir deine Bestellung #${orderNr} heute nicht annehmen. Du wirst nicht belastet. Wir entschuldigen uns! – Simonetti`,
    },
  ]

  const openWhatsApp = () => {
    if (!phone || !waText.trim()) return
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(waText)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <span className="font-black text-xl">#{orderNr}</span>
            <span className="text-gray-400 text-sm ml-2">{new Date(order.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Kunde</div>
            <div className="flex items-center gap-2"><User size={15} className="text-gray-400" /><span className="font-bold text-gray-900">{order.customer_name}</span></div>
            {order.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-gray-400" />
                <a href={`tel:${order.customer_phone}`} className="text-blue-600 font-semibold hover:underline">{order.customer_phone}</a>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-gray-400" />
              <span className="text-gray-700">{isPickup ? '🏪 Abholung' : formatAddress(order.delivery_address)}</span>
            </div>
            {order.customer_email && <div className="text-xs text-gray-400">✉️ {order.customer_email}</div>}
          </div>

          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bestellung</div>
            <div className="space-y-2">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-start bg-gray-50 rounded-xl p-3">
                  <div>
                    <span className="font-bold text-gray-900">{item.quantity}x {item.name || item.productName}</span>
                    {item.selectedFlavors?.length > 0 && <div className="text-xs text-gray-500 mt-0.5">🍦 {item.selectedFlavors.join(', ')}</div>}
                    {item.selectedExtras?.length > 0 && <div className="text-xs text-gray-500">➕ {item.selectedExtras.map((e: any) => e.name || e).join(', ')}</div>}
                  </div>
                  <span className="font-bold text-gray-700 ml-4">{((item.totalPrice || item.price * item.quantity) || 0).toFixed(2)} €</span>
                </div>
              ))}
            </div>
            {order.notes && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                💬 {order.notes}
              </div>
            )}
            <div className="mt-3 flex justify-between font-black text-lg border-t pt-3">
              <span>Gesamt</span><span>{(order.total || 0).toFixed(2)} €</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500 font-semibold">
              <span>Zahlung</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                (order.payment_method === 'cash' || order.payment_intent_id?.startsWith('cash-'))
                  ? 'bg-green-100 text-green-700'
                  : order.payment_method === 'paypal'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {(order.payment_method === 'cash' || order.payment_intent_id?.startsWith('cash-'))
                  ? '💵 Barzahlung'
                  : order.payment_method === 'paypal'
                  ? '🅿️ PayPal'
                  : '💳 Stripe/Klarna'}
              </span>
            </div>
          </div>

          {order.customer_phone && (
            <div className={`border-2 rounded-xl p-4 transition ${waEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <span className={`font-bold ${waEnabled ? 'text-green-800' : 'text-gray-400'}`}>WhatsApp senden</span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">kostenlos</span>
                </div>
                <button onClick={() => setWaEnabled(!waEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${waEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${waEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {waEnabled && (<>
              <div className="flex flex-wrap gap-2 mb-3">
                {WA_TEMPLATES.map((t) => (
                  <button key={t.label} onClick={() => setWaText(t.text)}
                    className={`text-xs px-3 py-1.5 rounded-full border-2 font-semibold transition ${waText === t.text ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea
                value={waText}
                onChange={e => setWaText(e.target.value)}
                rows={3}
                placeholder="Vorlage auswählen oder eigenen Text schreiben..."
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-400 focus:outline-none resize-none mb-2"
              />
              <button onClick={openWhatsApp} disabled={!waText.trim()}
                className="w-full py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
                <span>📲</span> WhatsApp öffnen → {order.customer_phone}
              </button>
              </>)}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { printOrder(order); }} className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition">🖨️ Drucken</button>
            {status !== 'GELIEFERT' && colIdx > 0 && (
              <button onClick={() => { onMoveLeft(); onClose(); }} className="px-4 py-2.5 border-2 border-gray-200 rounded-xl font-bold text-sm hover:border-black transition">← Zurück</button>
            )}
            {status !== 'GELIEFERT' && colIdx < 3 && (
              <button onClick={() => { onMoveRight(); onClose(); }} className="px-4 py-2.5 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition">Weiter →</button>
            )}
            {status === 'AN_FAHRER' && (
              <button onClick={() => { onMarkDelivered(); onClose(); }}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition">
                {isPickup ? '🏪 Abgeholt' : '✅ Geliefert'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, colIdx, onMoveLeft, onMoveRight, onMarkDelivered, onAssignDriver, onAccept, onReject, drivers, onSelect }: any) {
  const status      = COLUMNS[colIdx].id
  const isDelivered = status === 'GELIEFERT'
  const isOffen     = status === 'OFFEN'
  const isPickup    = order.order_type === 'pickup'

  return (
    <div className={`bg-white rounded-xl p-3 shadow-sm border-2 hover:shadow-md transition mb-2 text-xs
      ${isOffen ? 'border-red-300' : isDelivered ? 'border-green-200 opacity-75' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={onMoveLeft} disabled={colIdx === 0 || isDelivered}
          className={`p-1.5 rounded-lg transition ${colIdx > 0 && !isDelivered ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-200 cursor-not-allowed'}`}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center px-2 cursor-pointer" onClick={onSelect}>
          <div className="font-bold text-xs text-gray-500">#{order.order_number || order.id?.slice(-6).toUpperCase()}</div>
          <div className="font-bold text-lg text-gray-900">{(order.total || 0).toFixed(2)}€</div>
          {isPickup && <div className="text-xs font-bold text-purple-600 bg-purple-50 rounded-full px-2 py-0.5 mt-0.5">🏪 Abholung</div>}
        </div>
        <button onClick={onMoveRight} disabled={colIdx >= 3 || isDelivered}
          className={`p-1.5 rounded-lg transition ${colIdx < 3 && !isDelivered ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-200 cursor-not-allowed'}`}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="space-y-1 px-1 mb-2">
        <div className="flex items-center gap-1.5 truncate">
          <User size={11} className="text-gray-400 flex-shrink-0" />
          <span className="font-semibold truncate text-gray-800">{order.customer_name}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <MapPin size={11} className="text-gray-400 flex-shrink-0" />
          <span className="truncate text-gray-500">
            {isPickup ? '🏪 Abholung' : formatAddress(order.delivery_address).split(',')[0]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-500">{new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {!isDelivered && <OrderTimer createdAt={order.created_at} />}
        </div>
        <div className="flex items-center gap-1.5">
          <Package size={11} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-500">{(order.items || []).reduce((s: number, i: any) => s + i.quantity, 0)} Artikel</span>
        </div>
      </div>
      {isOffen && (
        <div className="space-y-1.5 mb-1.5">
          <button onClick={onAccept}
            className="w-full py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition flex items-center justify-center gap-1">
            <Check size={12} /> Annehmen
          </button>
          <button onClick={onReject}
            className="w-full py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1">
            <XCircle size={12} /> Ablehnen
          </button>
        </div>
      )}
      <button onClick={() => printOrder(order)}
        className="w-full py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition mb-1.5">
        🖨️ Drucken
      </button>
      {status === 'AN_FAHRER' && !isPickup && (
        <div className="mt-1 space-y-1.5">
          {order.driver_id ? (
            <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center text-blue-700 font-semibold text-xs">
              🚗 {drivers.find((d: any) => d.id === order.driver_id)?.name || 'Fahrer zugewiesen'}
            </div>
          ) : (
            <select onChange={e => onAssignDriver(order.id, e.target.value)}
              className="w-full text-xs border-2 border-gray-200 rounded-lg px-2 py-1.5 focus:border-black focus:outline-none">
              <option value="">Fahrer auswählen...</option>
              {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button onClick={onMarkDelivered}
            className="w-full py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition">
            ✅ Als geliefert markieren
          </button>
        </div>
      )}
      {status === 'AN_FAHRER' && isPickup && (
        <button onClick={onMarkDelivered}
          className="w-full py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition mt-1">
          🏪 Als abgeholt markieren
        </button>
      )}
      {isDelivered && order.delivered_at && (
        <div className="text-center text-green-600 text-xs font-semibold mt-1">
          ✅ {new Date(order.delivered_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
        </div>
      )}
    </div>
  )
}

export default function KanbanPage() {
  const [orders, setOrders]             = useState<Record<string, any[]>>({ OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: [] })
  const [loading, setLoading]           = useState(true)
  const [drivers, setDrivers]           = useState<any[]>([])
  const [showAllDays, setShowAllDays]   = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundVolume, setSoundVolume]   = useState(1.0)
  const [popupOrder, setPopupOrder]     = useState<any>(null)
  const [rejectTarget, setRejectTarget] = useState<any>(null)
  const [newOrderBanner, setNewOrderBanner] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  const knownIds    = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)
  const popupQueue  = useRef<any[]>([])

  const soundRef   = useRef(soundEnabled)
  const volumeRef  = useRef(soundVolume)
  const showAllRef = useRef(showAllDays)
  const popupRef   = useRef(popupOrder)
  useEffect(() => { soundRef.current   = soundEnabled  }, [soundEnabled])
  useEffect(() => { volumeRef.current  = soundVolume   }, [soundVolume])
  useEffect(() => { showAllRef.current = showAllDays   }, [showAllDays])
  useEffect(() => { popupRef.current   = popupOrder    }, [popupOrder])

  const loadOrders = useCallback(async () => {
    const now = new Date()
    const berlinDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })
    const berlinMidnight = new Date(berlinDateStr + 'T00:00:00.000Z')
    berlinMidnight.setHours(berlinMidnight.getHours() - 2)
    const todayStart = berlinMidnight
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!showAllRef.current) query = query.gte('created_at', todayStart.toISOString())
    const { data, error } = await query
    if (error || !data) return

    if (!isFirstLoad.current) {
      const newOnes = data.filter(o => !knownIds.current.has(o.id) && (o.status === 'OFFEN' || o.status === 'AUSSTEHEND'))
      if (newOnes.length > 0) {
        if (soundRef.current) playSound(volumeRef.current)
        setNewOrderBanner(true)
        setTimeout(() => setNewOrderBanner(false), 5000)
        if (!popupRef.current) {
          setPopupOrder(newOnes[0])
          if (newOnes.length > 1) popupQueue.current = [...popupQueue.current, ...newOnes.slice(1)]
        } else {
          popupQueue.current = [...popupQueue.current, ...newOnes]
        }
      }
    }

    // Auto-Delete nach 1 Stunde
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const toDelete = data.filter(o => (o.status === 'OFFEN' || o.status === 'AUSSTEHEND') && new Date(o.created_at) < oneHourAgo)
    for (const o of toDelete) { await supabase.from('orders').delete().eq('id', o.id) }

    data.forEach(o => knownIds.current.add(o.id))
    isFirstLoad.current = false

    const grouped: Record<string, any[]> = { OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: [] }
    data.forEach(o => { const s = (o.status === 'AUSSTEHEND' || o.status === 'OFFEN') ? 'IN_BEARBEITUNG' : (o.status || 'IN_BEARBEITUNG'); if (grouped[s]) grouped[s].push(o) })
    setOrders(grouped)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadOrders()
    loadDrivers()
    loadWhatsAppToggle()
    const iv = setInterval(loadOrders, 15000)
    return () => clearInterval(iv)
  }, [loadOrders])

  useEffect(() => { loadOrders() }, [showAllDays, loadOrders])

  const loadDrivers = async () => {
    const { data } = await supabase.from('drivers').select('*').eq('is_active', true).order('name')
    if (data) setDrivers(data)
  }

  const loadWhatsAppToggle = async () => {
    const { data } = await supabase.from('feature_toggles').select('enabled').eq('id', 'whatsapp_notify').single()
    if (data && data.enabled === false) {}
  }

  const closePopup = () => {
    setPopupOrder(null)
    if (popupQueue.current.length > 0) {
      const next = popupQueue.current.shift()
      setTimeout(() => setPopupOrder(next), 300)
    }
  }

  const acceptFromPopup = async (order: any, prepTime: number, deliveryTime: number) => {
    const ok = await apiUpdateOrder(order.id, { status: 'IN_BEARBEITUNG', prep_time: prepTime, delivery_time: deliveryTime })
    if (ok) { await sendEmail('order_confirmed', order); await sendTelegram(order); await sendPush(order, 'IN_BEARBEITUNG'); closePopup(); loadOrders() }
  }

  const acceptOrder = async (orderId: string) => {
    const order = [...(orders['OFFEN'] || []), ...(orders['IN_BEARBEITUNG'] || [])].find(o => o.id === orderId) || Object.values(orders).flat().find(o => o.id === orderId)
    const ok = await apiUpdateOrder(orderId, { status: 'IN_BEARBEITUNG' })
    if (ok) { if (order) await sendEmail('order_confirmed', order); loadOrders() }
  }

  const confirmReject = async (reason: string) => {
    if (!rejectTarget) return
    const ok = await apiUpdateOrder(rejectTarget.id, {
      status: 'ABGELEHNT', reject_reason: reason || null, rejected_at: new Date().toISOString()
    })
    if (ok) {
      await sendEmail('order_rejected', rejectTarget)
      if (popupOrder?.id === rejectTarget.id) closePopup()
      setRejectTarget(null)
      loadOrders()
    }
  }

  const moveOrder = async (orderId: string, colIdx: number, dir: number) => {
    const newColIdx = colIdx + dir
    if (newColIdx < 0 || newColIdx > 2) return
    const currentStatus = COLUMNS[colIdx].id
    const newStatus     = COLUMNS[newColIdx].id
    const order = orders[currentStatus]?.find(o => o.id === orderId)
    if (!order) return
    const updateData: any = { status: newStatus }
    if (newStatus === 'AN_FAHRER' && !order.assigned_at) updateData.assigned_at = new Date().toISOString()
    const ok = await apiUpdateOrder(orderId, updateData)
    if (ok) {
      if (newStatus === 'IN_BEARBEITUNG') { await sendEmail('order_confirmed', order); await sendTelegram(order); await sendPush(order, 'IN_BEARBEITUNG') }
      if (newStatus === 'AN_FAHRER')      { await sendEmail('order_out_for_delivery', order); await sendPush(order, 'UNTERWEGS') }
      loadOrders()
    }
  }

  const markDelivered = async (orderId: string) => {
    const label = orders['AN_FAHRER']?.find(o => o.id === orderId)?.order_type === 'pickup' ? 'abgeholt' : 'geliefert'
    if (!confirm(`Bestellung als ${label} markieren?`)) return
    const order = Object.values(orders).flat().find(o => o.id === orderId)
    const ok = await apiUpdateOrder(orderId, { status: 'GELIEFERT', delivered_at: new Date().toISOString() })
    if (ok) { if (order) { await sendEmail('order_delivered', order); await sendPush(order, 'GELIEFERT') } loadOrders() }
  }

  const assignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return
    const order = orders['AN_FAHRER']?.find(o => o.id === orderId) || orders['IN_BEARBEITUNG']?.find(o => o.id === orderId)
    const ok = await apiUpdateOrder(orderId, { driver_id: driverId, status: 'AN_FAHRER', assigned_at: new Date().toISOString() })
    if (ok) {
      if (order) await sendEmail('order_out_for_delivery', order)
      try {
        const driver = drivers.find((d: any) => d.id === driverId)
        if (driver?.push_token) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: driver.push_token,
              title: '🚗 Neue Lieferung!',
              body: `Bestellung #${order?.order_number} · ${order?.customer_name}`,
              data: { order_id: orderId },
              sound: 'default',
            }),
          })
        }
      } catch (e) {}
      loadOrders()
    }
  }

  const deliveredOrders = orders['GELIEFERT'] || []
  const isCash    = (o: any) => o.payment_method === 'cash' || o.payment_intent_id?.startsWith('cash-')
  const isPayPal  = (o: any) => o.payment_method === 'paypal' || (o.payment_intent_id && !o.payment_intent_id.startsWith('pi_') && !o.payment_intent_id.startsWith('cash-'))
  const isStripe  = (o: any) => !isCash(o) && !isPayPal(o)
  const stripeTotal    = deliveredOrders.filter(isStripe).reduce((sum, o) => sum + (o.total || 0) - (o.tip || 0), 0)
  const paypalTotal    = deliveredOrders.filter(isPayPal).reduce((sum, o) => sum + (o.total || 0) - (o.tip || 0), 0)
  const cashTotal      = deliveredOrders.filter(isCash).reduce((sum, o) => sum + (o.total || 0) - (o.tip || 0), 0)
  const tipTotal       = deliveredOrders.reduce((s, o) => s + (o.tip || 0), 0)
  const grandTotal     = deliveredOrders.reduce((s, o) => s + (o.total || 0), 0)
  const deliveredCount = deliveredOrders.length
  const openCount      = orders['OFFEN']?.length || 0

  return (
    <AdminLayout>
      {selectedOrder && (
        <OrderDetailPopup
          order={selectedOrder}
          drivers={drivers}
          colIdx={COLUMNS.findIndex(c => c.id === selectedOrder.status)}
          onClose={() => setSelectedOrder(null)}
          onAccept={() => acceptOrder(selectedOrder.id)}
          onReject={() => { setRejectTarget(selectedOrder); setSelectedOrder(null) }}
          onMoveLeft={() => moveOrder(selectedOrder.id, COLUMNS.findIndex(c => c.id === selectedOrder.status), -1)}
          onMoveRight={() => moveOrder(selectedOrder.id, COLUMNS.findIndex(c => c.id === selectedOrder.status), 1)}
          onMarkDelivered={() => markDelivered(selectedOrder.id)}
          onAssignDriver={assignDriver}
        />
      )}
      {rejectTarget && (
        <RejectModal order={rejectTarget} onConfirm={confirmReject} onCancel={() => setRejectTarget(null)} />
      )}
      {popupOrder && !rejectTarget && (
        <NewOrderPopup
          order={popupOrder}
          onAccept={(prepTime, deliveryTime) => acceptFromPopup(popupOrder, prepTime, deliveryTime)}
          onReject={() => setRejectTarget(popupOrder)}
          onLater={closePopup}
        />
      )}
      {newOrderBanner && !popupOrder && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-bounce">
          🔔 Neue Bestellung eingegangen!
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Bestellungen</h1>
            <p className="text-gray-400 text-xs mt-0.5">Aktualisiert alle 15 Sek · Neue Bestellungen erscheinen als Popup</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {openCount > 0 && (
              <div className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-bold text-sm animate-pulse">
                🔔 {openCount} offen
              </div>
            )}
            <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-medium">💳 Stripe/Klarna</div>
                  <div className="text-base font-black text-gray-900">{stripeTotal.toFixed(2)} €</div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-medium">🅿️ PayPal</div>
                  <div className="text-base font-black text-gray-900">{paypalTotal.toFixed(2)} €</div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-medium">💵 Bar</div>
                  <div className="text-base font-black text-gray-900">{cashTotal.toFixed(2)} €</div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-medium">💝 Trinkgeld</div>
                  <div className="text-base font-black text-purple-600">{tipTotal.toFixed(2)} €</div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-medium">Gesamt</div>
                  <div className="text-base font-black text-green-600">{grandTotal.toFixed(2)} €</div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xs text-gray-400">{deliveredCount} geliefert</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/admin/reports'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border-2 border-gray-200 hover:border-black transition">
              <TrendingUp size={15} /> Reports
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition border-2 ${soundEnabled ? 'border-yellow-300 text-yellow-700 bg-yellow-50' : 'border-gray-200 text-gray-400'}`}>
                {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
                {soundEnabled ? 'Ton an' : 'Ton aus'}
              </button>
              {soundEnabled && (
                <div className="flex items-center gap-1.5 bg-yellow-50 border-2 border-yellow-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs">🔈</span>
                  <input type="range" min="0.1" max="2.0" step="0.1" value={soundVolume}
                    onChange={e => setSoundVolume(parseFloat(e.target.value))}
                    className="w-20 accent-yellow-500"
                    title={`Lautstärke: ${Math.round(soundVolume * 100)}%`} />
                  <span className="text-xs font-bold text-yellow-700 w-8">{Math.round(soundVolume * 100)}%</span>
                  <button onClick={() => playSound(soundVolume)} className="text-xs text-yellow-600 hover:text-yellow-800 font-semibold">▶</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setShowAllDays(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition border-2 ${!showAllDays ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}>
            📅 Nur Heute
          </button>
          <button onClick={() => setShowAllDays(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition border-2 ${showAllDays ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}>
            📋 Alle
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="text-5xl animate-pulse">🍦</div></div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {COLUMNS.filter(col => !col.hidden).map((col) => { const colIdx = COLUMNS.findIndex(c => c.id === col.id); return (
              <div key={col.id} className={`rounded-xl ${col.color} border-2 ${col.border} p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm flex items-center gap-1.5">
                    <span>{col.icon}</span><span>{col.title}</span>
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 font-semibold bg-white rounded-full px-2 py-0.5">
                      {orders[col.id]?.length || 0}
                    </span>
                    {col.id === 'OFFEN' && openCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {openCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-h-[400px]">
                  {orders[col.id]?.map(order => (
                    <OrderCard key={order.id} order={order} colIdx={colIdx}
                      onMoveLeft={() => moveOrder(order.id, colIdx, -1)}
                      onMoveRight={() => moveOrder(order.id, colIdx, 1)}
                      onMarkDelivered={() => markDelivered(order.id)}
                      onAssignDriver={assignDriver}
                      onAccept={() => acceptOrder(order.id)}
                      onReject={() => setRejectTarget(order)}
                      onSelect={() => setSelectedOrder(order)}
                      drivers={drivers}
                    />
                  ))}
                  {(orders[col.id]?.length || 0) === 0 && (
                    <div className="text-center text-gray-400 text-xs pt-10">Keine Bestellungen</div>
                  )}
                </div>
              </div>
            )})}

          </div>
        )}
      </div>
    </AdminLayout>
  )
}


















