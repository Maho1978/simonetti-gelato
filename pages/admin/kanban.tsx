import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, User, MapPin, Clock, Printer, LayoutDashboard, ShoppingBag, Package, Tag, BarChart2, Ticket, Heart, Settings, LogOut, Bell, BellOff, X, Check, Phone } from 'lucide-react'
import { useRouter } from 'next/router'

const COLUMNS = [
  { id: 'OFFEN', title: 'Offen', color: 'bg-gray-100', icon: '🔔' },
  { id: 'IN_BEARBEITUNG', title: 'In Bearbeitung', color: 'bg-blue-100', icon: '👨‍🍳' },
  { id: 'AN_FAHRER', title: 'An Fahrer', color: 'bg-orange-100', icon: '🚗' },
  { id: 'GELIEFERT', title: 'Geliefert', color: 'bg-green-100', icon: '✅' }
]

const NAV_ITEMS = [
  { label: 'Bestellungen', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Produkte', href: '/admin/products', icon: Package },
  { label: 'Extras', href: '/admin/extras', icon: Tag },
  { label: 'Kategorien', href: '/admin/categories', icon: LayoutDashboard },
  { label: 'Kanban', href: '/admin/kanban', icon: LayoutDashboard },
  { label: 'Reports', href: '/admin/reports', icon: BarChart2 },
  { label: 'Gutscheine', href: '/admin/gutscheine', icon: Ticket },
  { label: 'Favoriten', href: '/admin/favorites', icon: Heart },
  { label: 'Setup', href: '/admin/settings', icon: Settings },
]

// ── API ──────────────────────────────────────────────────────
async function updateOrder(orderId: string, data: any) {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const err = await response.json()
    console.error('Order update error:', err)
    return false
  }
  return true
}

async function sendEmailNotification(type: string, order: any) {
  const email = order?.customer_email
  if (!email) return
  try {
    await fetch('/api/emails/send-order-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, order, recipientEmail: email })
    })
  } catch (e) { console.error('Email error:', e) }
}

// ── Lauterer Ton ─────────────────────────────────────────────
function playNotificationSound(loud = false) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    if (loud) {
      // Lautes, dringendes Klingeln - 5x wiederholt
      const playBell = (startTime: number) => {
        const notes = [880, 1100, 880, 1100]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = freq
          osc.type = 'square'
          const t = startTime + i * 0.12
          gain.gain.setValueAtTime(0, t)
          gain.gain.linearRampToValueAtTime(0.6, t + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25)
          osc.start(t)
          osc.stop(t + 0.25)
        })
      }
      // 4x klingeln mit Pause
      for (let i = 0; i < 4; i++) {
        playBell(ctx.currentTime + i * 0.7)
      }
    } else {
      // Normaler sanfter Ton
      const notes = [523, 659, 784]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        const startTime = ctx.currentTime + i * 0.15
        gain.gain.setValueAtTime(0.3, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
        osc.start(startTime)
        osc.stop(startTime + 0.3)
      })
    }
  } catch (e) {
    console.log('Audio not available')
  }
}

// ── Timer ────────────────────────────────────────────────────
function OrderTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000))
    calc()
    const interval = setInterval(calc, 10000)
    return () => clearInterval(interval)
  }, [createdAt])

  const minutes = Math.floor(elapsed / 60)
  const hours = Math.floor(minutes / 60)
  let color = 'text-green-600'
  if (minutes >= 30) color = 'text-red-600 font-bold'
  else if (minutes >= 15) color = 'text-orange-500 font-semibold'
  else if (minutes >= 10) color = 'text-yellow-600'
  return <span className={`text-xs ${color}`}>⏱ {hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`}</span>
}

// ── Print ────────────────────────────────────────────────────
function printOrder(order: any) {
  const items = order.items?.map((item: any) =>
    `${item.quantity}x ${item.name}${item.flavors?.length ? ' (' + item.flavors.join(', ') + ')' : item.selectedFlavors?.length ? ' (' + item.selectedFlavors.join(', ') + ')' : ''} - ${(item.price * item.quantity).toFixed(2)}€`
  ).join('\n') || ''
  const printContent = `
    <html><head><title>Bestellung #${order.order_number || order.id.substring(0, 6).toUpperCase()}</title>
    <style>
      body { font-family: monospace; font-size: 14px; padding: 20px; max-width: 400px; }
      h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
      .row { display: flex; justify-content: space-between; margin: 4px 0; }
      .total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 16px; }
      .section { margin: 10px 0; padding: 8px; background: #f5f5f5; }
      pre { white-space: pre-wrap; font-family: monospace; }
    </style></head>
    <body>
      <h2>🍦 Simonetti Gelateria</h2>
      <div class="row"><span>Bestellung:</span><span><b>#${order.order_number || order.id.substring(0, 6).toUpperCase()}</b></span></div>
      <div class="row"><span>Zeit:</span><span>${new Date(order.created_at).toLocaleString('de-DE')}</span></div>
      <div class="section">
        <b>Kunde:</b><br/>
        ${order.customer_name}<br/>
        ${order.customer_phone || ''}<br/>
        ${order.delivery_address || 'Abholung'}
      </div>
      <div class="section"><b>Bestellung:</b><br/><pre>${items}</pre></div>
      ${order.notes ? `<div class="section"><b>Notizen:</b><br/>${order.notes}</div>` : ''}
      <div class="total row"><span>GESAMT:</span><span>${order.total?.toFixed(2)}€</span></div>
    </body></html>
  `
  const win = window.open('', '_blank')
  if (win) { win.document.write(printContent); win.document.close(); win.print() }
}

// ── NEUE BESTELLUNG POPUP ────────────────────────────────────
function NewOrderPopup({ order, onAccept, onLater }: {
  order: any
  onAccept: () => void
  onLater: () => void
}) {
  const items = order.items || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      {/* Pulsierender Rand */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in">

        {/* Roter Header */}
        <div className="bg-red-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse">🔔</span>
            <div>
              <h2 className="font-bold text-xl">NEUE BESTELLUNG!</h2>
              <p className="text-red-100 text-sm">#{order.order_number || order.id?.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{order.total?.toFixed(2)}€</div>
            <div className="text-red-200 text-xs">{new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</div>
          </div>
        </div>

        <div className="p-6">
          {/* Kunde */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-gray-500" />
              <span className="font-bold text-gray-800">{order.customer_name}</span>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-2 mb-1">
                <Phone size={16} className="text-gray-500" />
                <a href={`tel:${order.customer_phone}`} className="text-blue-600 font-semibold text-sm">{order.customer_phone}</a>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-500" />
              <span className="text-gray-600 text-sm">{order.delivery_address}</span>
            </div>
          </div>

          {/* Bestellte Artikel */}
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-2">Bestellung</h3>
            <div className="space-y-1.5">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-start text-sm">
                  <div>
                    <span className="font-bold text-gray-800">{item.quantity}x {item.name}</span>
                    {(item.flavors?.length > 0 || item.selectedFlavors?.length > 0) && (
                      <div className="text-xs text-gray-500 ml-2">🍦 {(item.flavors || item.selectedFlavors).join(', ')}</div>
                    )}
                    {(item.extras?.length > 0 || item.selectedExtras?.length > 0) && (
                      <div className="text-xs text-gray-500 ml-2">➕ {(item.extras || item.selectedExtras).map((e: any) => e.name || e).join(', ')}</div>
                    )}
                  </div>
                  <span className="font-semibold text-gray-600">{(item.price * item.quantity).toFixed(2)}€</span>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm">
              <strong>💬 Notiz:</strong> {order.notes}
            </div>
          )}

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onLater}
              className="py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <X size={18} /> Später
            </button>
            <button
              onClick={onAccept}
              className="py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Check size={18} /> Akzeptieren
            </button>
          </div>

          {/* Drucken */}
          <button
            onClick={() => printOrder(order)}
            className="w-full mt-3 py-2 rounded-xl bg-gray-800 text-white text-xs font-bold hover:bg-gray-900 transition"
          >
            🖨️ Sofort drucken
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// ── Order Card ───────────────────────────────────────────────
function OrderCard({ order, columnIndex, onMoveLeft, onMoveRight, onMarkDelivered, onAssignDriver, onAccept, drivers, onClick }: any) {
  const status = COLUMNS[columnIndex].id
  const isDelivered = status === 'GELIEFERT'
  const canMoveLeft = columnIndex > 0 && !isDelivered
  const canMoveRight = columnIndex < 2 && !isDelivered

  return (
    <div className={`bg-white rounded-lg p-2 shadow-sm border-2 hover:shadow-md transition mb-2 text-xs ${isDelivered ? 'opacity-70' : ''} ${status === 'OFFEN' ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={(e) => { e.stopPropagation(); onMoveLeft() }} disabled={!canMoveLeft}
          className={`p-1 rounded transition ${canMoveLeft ? 'hover:bg-gray-200 text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1" onClick={onClick}>
          <div className="font-bold text-xs">#{order.order_number || order.id.substring(0, 6).toUpperCase()}</div>
          <div className="font-bold text-base">{order.total?.toFixed(2)}€</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onMoveRight() }} disabled={!canMoveRight}
          className={`p-1 rounded transition ${canMoveRight ? 'hover:bg-gray-200 text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-1 cursor-pointer hover:bg-gray-50 rounded p-2" onClick={onClick}>
        <div className="flex items-center gap-1 truncate">
          <User size={12} className="text-gray-400 flex-shrink-0" />
          <span className="font-semibold truncate">{order.customer_name}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
          <span className="truncate text-gray-600">{order.delivery_address?.split(',')[0]}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">{new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {!isDelivered && <OrderTimer createdAt={order.created_at} />}
        </div>
      </div>

      <div className="text-center py-1 bg-gray-50 rounded mt-2">
        <span className="text-gray-600">{order.items?.reduce((s: number, i: any) => s + i.quantity, 0)} Artikel</span>
      </div>

      {/* AKZEPTIEREN Button in OFFEN Spalte */}
      {status === 'OFFEN' && (
        <button onClick={(e) => { e.stopPropagation(); onAccept() }}
          className="w-full mt-2 py-1.5 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600 transition flex items-center justify-center gap-1">
          <Check size={12} /> Akzeptieren
        </button>
      )}

      <button onClick={(e) => { e.stopPropagation(); printOrder(order) }}
        className="w-full mt-2 py-1.5 bg-gray-700 text-white rounded text-xs font-bold hover:bg-gray-900 transition flex items-center justify-center gap-1">
        <Printer size={12} /> Drucken
      </button>

      {status === 'AN_FAHRER' && (
        <>
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            {order.driver_id ? (
              <div className="text-xs bg-blue-50 rounded px-2 py-1 text-center">
                🚗 {drivers.find((d: any) => d.id === order.driver_id)?.name || 'Zugewiesen'}
              </div>
            ) : (
              <select onChange={(e) => onAssignDriver(order.id, e.target.value)}
                className="text-xs w-full border rounded px-2 py-1" onClick={(e) => e.stopPropagation()}>
                <option value="">Fahrer...</option>
                {drivers.map((driver: any) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onMarkDelivered() }}
            className="w-full mt-2 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition">
            ✅ Geliefert
          </button>
        </>
      )}

      {isDelivered && order.delivered_at && (
        <div className="text-center mt-2 text-green-600 font-semibold">
          ✅ {new Date(order.delivered_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function KanbanPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any>({ OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: [] })
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<any[]>([])
  const [showAllDays, setShowAllDays] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [popupOrder, setPopupOrder] = useState<any>(null) // Neue Bestellung Popup
  const knownOrderIds = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)
  const popupQueue = useRef<any[]>([]) // Warteschlange für mehrere neue Bestellungen

  const loadOrders = useCallback(async () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!showAllDays) query = query.gte('created_at', todayStart.toISOString())
    const { data } = await query

    if (data) {
      if (!isFirstLoad.current) {
        const newOrders = data.filter((o: any) => !knownOrderIds.current.has(o.id) && o.status === 'OFFEN')
        if (newOrders.length > 0) {
          if (soundEnabled) playNotificationSound(true) // Lauter Ton!
          setNewOrderAlert(true)
          setTimeout(() => setNewOrderAlert(false), 5000)

          // Erste neue Bestellung als Popup zeigen
          if (!popupOrder) {
            setPopupOrder(newOrders[0])
          }
          // Restliche in Warteschlange
          if (newOrders.length > 1) {
            popupQueue.current = [...popupQueue.current, ...newOrders.slice(1)]
          }
        }
      }
      data.forEach((o: any) => knownOrderIds.current.add(o.id))
      isFirstLoad.current = false

      const grouped: any = { OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: [] }
      data.forEach((order: any) => {
        const status = order.status || 'OFFEN'
        if (grouped[status] !== undefined) grouped[status].push(order)
      })
      setOrders(grouped)
    }
    setLoading(false)
  }, [showAllDays, soundEnabled, popupOrder])

  useEffect(() => {
    loadOrders()
    loadDrivers()
    const interval = setInterval(loadOrders, 15000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const loadDrivers = async () => {
    const { data } = await supabase.from('drivers').select('*').eq('is_active', true).order('name')
    if (data) setDrivers(data)
  }

  const closePopup = () => {
    setPopupOrder(null)
    // Nächste in Warteschlange zeigen
    if (popupQueue.current.length > 0) {
      const next = popupQueue.current[0]
      popupQueue.current = popupQueue.current.slice(1)
      setTimeout(() => setPopupOrder(next), 300)
    }
  }

  const acceptOrderFromPopup = async (order: any) => {
    const ok = await updateOrder(order.id, { status: 'IN_BEARBEITUNG' })
    if (ok) {
      await sendEmailNotification('order_confirmed', order)
      closePopup()
      loadOrders()
    }
  }

  const acceptOrder = async (orderId: string) => {
    const order = orders['OFFEN'].find((o: any) => o.id === orderId)
    const ok = await updateOrder(orderId, { status: 'IN_BEARBEITUNG' })
    if (ok) {
      await sendEmailNotification('order_confirmed', order)
      loadOrders()
    }
  }

  const moveOrder = async (orderId: string, currentColumnIndex: number, direction: number) => {
    const newColumnIndex = currentColumnIndex + direction
    if (newColumnIndex < 0 || newColumnIndex >= COLUMNS.length) return
    const currentStatus = COLUMNS[currentColumnIndex].id
    const newStatus = COLUMNS[newColumnIndex].id
    const updateData: any = { status: newStatus }
    if (newStatus === 'AN_FAHRER') {
      const order = orders[currentStatus].find((o: any) => o.id === orderId)
      if (order && !order.assigned_at) updateData.assigned_at = new Date().toISOString()
    }
    const ok = await updateOrder(orderId, updateData)
    if (ok) {
      const order = orders[currentStatus].find((o: any) => o.id === orderId)
      if (newStatus === 'IN_BEARBEITUNG') await sendEmailNotification('order_confirmed', order)
      if (newStatus === 'AN_FAHRER') await sendEmailNotification('order_out_for_delivery', order)
      loadOrders()
    }
  }

  const markDelivered = async (orderId: string) => {
    if (!confirm('Als geliefert markieren?')) return
    const ok = await updateOrder(orderId, { status: 'GELIEFERT', delivered_at: new Date().toISOString() })
    if (ok) {
      const order = Object.values(orders).flat().find((o: any) => o.id === orderId)
      await sendEmailNotification('order_delivered', order)
      loadOrders()
    }
  }

  const assignDriver = async (orderId: string, driverId: string) => {
    const ok = await updateOrder(orderId, { driver_id: driverId, status: 'AN_FAHRER', assigned_at: new Date().toISOString() })
    if (ok) {
      const order = Object.values(orders).flat().find((o: any) => o.id === orderId)
      await sendEmailNotification('order_out_for_delivery', order)
      loadOrders()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin')
  }

  const todayTotal = Object.values(orders).flat().reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const deliveredCount = orders['GELIEFERT']?.length || 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-4xl animate-pulse">🍦</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* NEUE BESTELLUNG POPUP */}
      {popupOrder && (
        <NewOrderPopup
          order={popupOrder}
          onAccept={() => acceptOrderFromPopup(popupOrder)}
          onLater={closePopup}
        />
      )}

      {/* BANNER ALERT */}
      {newOrderAlert && !popupOrder && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-bounce">
          🔔 Neue Bestellung eingegangen!
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-gray-900 text-white px-4 py-2 flex items-center gap-1 flex-wrap shadow-lg">
        <div className="flex items-center gap-2 mr-4">
          <span className="text-xl">🍦</span>
          <span className="font-bold text-sm">Simonetti</span>
          <span className="text-xs text-gray-400 ml-1">ADMIN</span>
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = router.pathname === item.href
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${isActive ? 'bg-white text-gray-900' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <Icon size={13} />{item.label}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition ${soundEnabled ? 'text-yellow-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-700'}`}>
            {soundEnabled ? <Bell size={13} /> : <BellOff size={13} />}
            {soundEnabled ? 'Ton an' : 'Ton aus'}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition">
            <LogOut size={13} /> Abmelden
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold italic">Bestellungen Kanban</h1>
            <p className="text-gray-500 text-xs">Neue Bestellungen erscheinen als Popup · Aktualisiert alle 15 Sek</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">{todayTotal.toFixed(2)}€</div>
            <div className="text-xs text-gray-500">{deliveredCount} geliefert heute</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setShowAllDays(false)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${!showAllDays ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:border-black'}`}>
            📅 Nur Heute
          </button>
          <button onClick={() => setShowAllDays(true)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${showAllDays ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:border-black'}`}>
            📋 Alle
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {COLUMNS.map((column, columnIndex) => (
            <div key={column.id} className={`rounded-lg ${column.color} p-3`}>
              <div className="mb-3">
                <h2 className="font-bold flex items-center gap-1.5">
                  <span>{column.icon}</span>
                  <span>{column.title}</span>
                  <span className="text-sm font-normal text-gray-600">({orders[column.id]?.length || 0})</span>
                  {column.id === 'OFFEN' && orders['OFFEN']?.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 animate-pulse">
                      {orders['OFFEN'].length}
                    </span>
                  )}
                </h2>
              </div>
              <div className="min-h-[500px]">
                {orders[column.id]?.map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    columnIndex={columnIndex}
                    onMoveLeft={() => moveOrder(order.id, columnIndex, -1)}
                    onMoveRight={() => moveOrder(order.id, columnIndex, 1)}
                    onMarkDelivered={() => markDelivered(order.id)}
                    onAssignDriver={assignDriver}
                    onAccept={() => acceptOrder(order.id)}
                    drivers={drivers}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  />
                ))}
                {orders[column.id]?.length === 0 && (
                  <div className="text-center text-gray-400 text-xs pt-8">Keine Bestellungen</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}