import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/router'
import {
  ChevronLeft, ChevronRight, User, MapPin, Clock,
  Bell, BellOff, Check, Phone, Package, XCircle, Printer
} from 'lucide-react'

const COLUMNS = [
  { id: 'OFFEN',          title: 'Offen',          color: 'bg-red-50',    border: 'border-red-200',    icon: '🔔' },
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

function playSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    for (let i = 0; i < 4; i++) {
      ;[880, 1100, 880, 1100].forEach((freq, j) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = freq; osc.type = 'square'
        const start = ctx.currentTime + i * 0.7 + j * 0.12
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.7, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.28)
        osc.start(start); osc.stop(start + 0.28)
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
  const color = mins >= 30 ? 'text-red-600 font-bold animate-pulse' : mins >= 15 ? 'text-orange-500 font-semibold' : mins >= 10 ? 'text-yellow-600' : 'text-green-600'
  return <span className={`text-xs ${color}`}>⏱ {label}</span>
}

function printOrder(order: any) {
  const items = (order.items || []).map((item: any) => {
    const flavors = (item.flavors || item.selectedFlavors || []).join(', ')
    const extras = (item.extras || item.selectedExtras || []).map((e: any) => e.name || e).join(', ')
    return `${item.quantity}x ${item.name}${flavors ? ' (' + flavors + ')' : ''}${extras ? ' + ' + extras : ''} — ${((item.price || 0) * item.quantity).toFixed(2)}€`
  }).join('\n')
  const win = window.open('', '_blank'); if (!win) return
  win.document.write(`<html><head><title>Bestellung</title>
    <style>body{font-family:monospace;font-size:14px;padding:20px;max-width:380px}
    h2{text-align:center;border-bottom:2px solid #000;padding-bottom:8px}
    .row{display:flex;justify-content:space-between;margin:4px 0}
    .section{margin:10px 0;padding:8px;background:#f5f5f5;border-radius:4px}
    .total{border-top:2px solid #000;margin-top:10px;padding-top:10px;font-weight:bold;font-size:16px}
    pre{white-space:pre-wrap;font-family:monospace;margin:0}</style></head><body>
    <h2>🍦 Simonetti Gelateria</h2>
    <div class="row"><span>Bestellung:</span><span><b>#${order.order_number || order.id?.slice(-6).toUpperCase()}</b></span></div>
    <div class="row"><span>Zeit:</span><span>${new Date(order.created_at).toLocaleString('de-DE')}</span></div>
    <div class="section"><b>Kunde:</b><br/>${order.customer_name || ''}<br/>${order.customer_phone || ''}<br/>${order.delivery_address || ''}</div>
    <div class="section"><b>Bestellung:</b><br/><pre>${items}</pre></div>
    ${order.notes ? `<div class="section"><b>Notizen:</b><br/>${order.notes}</div>` : ''}
    <div class="total row"><span>GESAMT:</span><span>${(order.total || 0).toFixed(2)}€</span></div>
    </body></html>`)
  win.document.close(); win.print()
}

// ── GROSSES Popup ─────────────────────────────────────────────
function NewOrderPopup({ order, onAccept, onReject, onLater }: {
  order: any; onAccept: () => void; onReject: () => void; onLater: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden" style={{ animation: 'popIn 0.35s ease-out' }}>

        {/* Header */}
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
            {/* Kunde */}
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
                <span className="text-gray-700">{order.delivery_address}</span>
              </div>
            </div>

            {/* Artikel */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3">Bestellung</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(order.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div>
                      <span className="font-bold text-gray-900">{item.quantity}x {item.name}</span>
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

          {/* ── GROSSE Buttons ── */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* ABLEHNEN */}
            <button onClick={onReject}
              className="py-5 rounded-2xl border-3 border-red-300 bg-red-50 text-red-600 font-black text-xl hover:bg-red-100 hover:border-red-400 transition flex items-center justify-center gap-3"
              style={{ border: '3px solid #fca5a5' }}>
              <XCircle size={28} />
              Ablehnen
            </button>

            {/* ANNEHMEN */}
            <button onClick={onAccept}
              className="py-5 rounded-2xl bg-green-500 text-white font-black text-xl hover:bg-green-600 transition flex items-center justify-center gap-3 shadow-xl"
              style={{ boxShadow: '0 8px 32px rgba(34,197,94,0.4)' }}>
              <Check size={28} />
              Annehmen ✓
            </button>
          </div>

          {/* Kleine Aktionen */}
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

// ── Ablehnen Modal ────────────────────────────────────────────
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

// ── Order Card ────────────────────────────────────────────────
function OrderCard({ order, colIdx, onMoveLeft, onMoveRight, onMarkDelivered, onAssignDriver, onAccept, onReject, drivers }: any) {
  const status = COLUMNS[colIdx].id
  const isDelivered = status === 'GELIEFERT'
  const isOffen = status === 'OFFEN'

  return (
    <div className={`bg-white rounded-xl p-3 shadow-sm border-2 hover:shadow-md transition mb-2 text-xs
      ${isOffen ? 'border-red-300' : isDelivered ? 'border-green-200 opacity-75' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={onMoveLeft} disabled={colIdx === 0 || isDelivered}
          className={`p-1.5 rounded-lg transition ${colIdx > 0 && !isDelivered ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-200 cursor-not-allowed'}`}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center px-2">
          <div className="font-bold text-xs text-gray-500">#{order.order_number || order.id?.slice(-6).toUpperCase()}</div>
          <div className="font-bold text-lg text-gray-900">{(order.total || 0).toFixed(2)}€</div>
        </div>
        <button onClick={onMoveRight} disabled={colIdx >= 2 || isDelivered}
          className={`p-1.5 rounded-lg transition ${colIdx < 2 && !isDelivered ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-200 cursor-not-allowed'}`}>
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
          <span className="truncate text-gray-500">{order.delivery_address?.split(',')[0]}</span>
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

      {status === 'AN_FAHRER' && (
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

      {isDelivered && order.delivered_at && (
        <div className="text-center text-green-600 text-xs font-semibold mt-1">
          ✅ {new Date(order.delivered_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
        </div>
      )}
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────
export default function KanbanPage() {
  const [orders, setOrders] = useState<Record<string, any[]>>({ OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: [] })
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<any[]>([])
  const [showAllDays, setShowAllDays] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [popupOrder, setPopupOrder] = useState<any>(null)
  const [rejectTarget, setRejectTarget] = useState<any>(null)
  const [newOrderBanner, setNewOrderBanner] = useState(false)

  const knownIds = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)
  const popupQueue = useRef<any[]>([])

  const loadOrders = useCallback(async () => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!showAllDays) query = query.gte('created_at', todayStart.toISOString())
    const { data, error } = await query
    if (error || !data) return

    if (!isFirstLoad.current) {
      const newOnes = data.filter(o => !knownIds.current.has(o.id) && o.status === 'OFFEN')
      if (newOnes.length > 0) {
        if (soundEnabled) playSound()
        setNewOrderBanner(true)
        setTimeout(() => setNewOrderBanner(false), 5000)
        if (!popupOrder) {
          setPopupOrder(newOnes[0])
          if (newOnes.length > 1) popupQueue.current = [...popupQueue.current, ...newOnes.slice(1)]
        } else {
          popupQueue.current = [...popupQueue.current, ...newOnes]
        }
      }
    }
    data.forEach(o => knownIds.current.add(o.id))
    isFirstLoad.current = false

    const grouped: Record<string, any[]> = { OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: [] }
    data.forEach(o => { const s = o.status || 'OFFEN'; if (grouped[s]) grouped[s].push(o) })
    setOrders(grouped)
    setLoading(false)
  }, [showAllDays, soundEnabled, popupOrder])

  useEffect(() => {
    loadOrders(); loadDrivers()
    const iv = setInterval(loadOrders, 15000)
    return () => clearInterval(iv)
  }, [loadOrders])

  const loadDrivers = async () => {
    const { data } = await supabase.from('drivers').select('*').eq('is_active', true).order('name')
    if (data) setDrivers(data)
  }

  const closePopup = () => {
    setPopupOrder(null)
    if (popupQueue.current.length > 0) {
      const next = popupQueue.current.shift()
      setTimeout(() => setPopupOrder(next), 300)
    }
  }

  const acceptFromPopup = async (order: any) => {
    const ok = await apiUpdateOrder(order.id, { status: 'IN_BEARBEITUNG' })
    if (ok) { await sendEmail('order_confirmed', order); closePopup(); loadOrders() }
  }

  const acceptOrder = async (orderId: string) => {
    const order = orders['OFFEN'].find(o => o.id === orderId)
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
    const newStatus = COLUMNS[newColIdx].id
    const order = orders[currentStatus]?.find(o => o.id === orderId)
    if (!order) return
    const updateData: any = { status: newStatus }
    if (newStatus === 'AN_FAHRER' && !order.assigned_at) updateData.assigned_at = new Date().toISOString()
    const ok = await apiUpdateOrder(orderId, updateData)
    if (ok) {
      if (newStatus === 'IN_BEARBEITUNG') await sendEmail('order_confirmed', order)
      if (newStatus === 'AN_FAHRER') await sendEmail('order_out_for_delivery', order)
      loadOrders()
    }
  }

  const markDelivered = async (orderId: string) => {
    if (!confirm('Bestellung als geliefert markieren?')) return
    const order = Object.values(orders).flat().find(o => o.id === orderId)
    const ok = await apiUpdateOrder(orderId, { status: 'GELIEFERT', delivered_at: new Date().toISOString() })
    if (ok) { if (order) await sendEmail('order_delivered', order); loadOrders() }
  }

  const assignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return
    const order = orders['AN_FAHRER']?.find(o => o.id === orderId) || orders['IN_BEARBEITUNG']?.find(o => o.id === orderId)
    const ok = await apiUpdateOrder(orderId, { driver_id: driverId, status: 'AN_FAHRER', assigned_at: new Date().toISOString() })
    if (ok) { if (order) await sendEmail('order_out_for_delivery', order); loadOrders() }
  }

  const allOrders = Object.values(orders).flat()
  const todayTotal = allOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const deliveredCount = orders['GELIEFERT']?.length || 0
  const openCount = orders['OFFEN']?.length || 0

  return (
    <AdminLayout>
      {/* Modals */}
      {rejectTarget && (
        <RejectModal order={rejectTarget} onConfirm={confirmReject} onCancel={() => setRejectTarget(null)} />
      )}
      {popupOrder && !rejectTarget && (
        <NewOrderPopup
          order={popupOrder}
          onAccept={() => acceptFromPopup(popupOrder)}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Bestellungen</h1>
            <p className="text-gray-400 text-xs mt-0.5">Aktualisiert alle 15 Sek · Neue Bestellungen erscheinen als Popup</p>
          </div>
          <div className="flex items-center gap-3">
            {openCount > 0 && (
              <div className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-bold text-sm animate-pulse">
                🔔 {openCount} offen
              </div>
            )}
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">{todayTotal.toFixed(2)}€</div>
              <div className="text-xs text-gray-400">{deliveredCount} geliefert</div>
            </div>
            <button onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition border-2 ${soundEnabled ? 'border-yellow-300 text-yellow-700 bg-yellow-50' : 'border-gray-200 text-gray-400'}`}>
              {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
              {soundEnabled ? 'Ton an' : 'Ton aus'}
            </button>
          </div>
        </div>

        {/* Filter */}
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

        {/* Kanban */}
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="text-5xl animate-pulse">🍦</div></div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {COLUMNS.map((col, colIdx) => (
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
                      drivers={drivers}
                    />
                  ))}
                  {(orders[col.id]?.length || 0) === 0 && (
                    <div className="text-center text-gray-400 text-xs pt-10">Keine Bestellungen</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}