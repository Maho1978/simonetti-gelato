import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, User, MapPin, Clock, Printer, LayoutDashboard, ShoppingBag, Package, Tag, BarChart2, Ticket, Heart, Settings, LogOut, Bell, BellOff } from 'lucide-react'
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

// API Helper - nutzt Service Role Key serverseitig
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

// Ton erzeugen mit Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Drei aufsteigende Töne
    const notes = [523, 659, 784] // C, E, G
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
  } catch (e) {
    console.log('Audio not available')
  }
}

// Timer Komponente - zeigt wie lange Bestellung schon in dieser Spalte ist
function OrderTimer({ createdAt, status }: { createdAt: string, status: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
      setElapsed(diff)
    }
    calc()
    const interval = setInterval(calc, 10000) // alle 10 Sek aktualisieren
    return () => clearInterval(interval)
  }, [createdAt])

  const minutes = Math.floor(elapsed / 60)
  const hours = Math.floor(minutes / 60)
  const displayMinutes = minutes % 60

  // Farbe je nach Wartezeit
  let color = 'text-green-600'
  if (minutes >= 30) color = 'text-red-600 font-bold'
  else if (minutes >= 15) color = 'text-orange-500 font-semibold'
  else if (minutes >= 10) color = 'text-yellow-600'

  const timeStr = hours > 0
    ? `${hours}h ${displayMinutes}m`
    : `${minutes}m`

  return (
    <span className={`text-xs ${color}`}>⏱ {timeStr}</span>
  )
}

function printOrder(order: any) {
  const items = order.items?.map((item: any) =>
    `${item.quantity}x ${item.name}${item.selectedFlavors?.length ? ' (' + item.selectedFlavors.join(', ') + ')' : ''} - ${(item.price * item.quantity).toFixed(2)}€`
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
      <div class="row"><span>Zahlung:</span><span>${order.payment_method || 'N/A'}</span></div>
    </body></html>
  `
  const win = window.open('', '_blank')
  if (win) { win.document.write(printContent); win.document.close(); win.print() }
}

function OrderCard({ order, columnIndex, onMoveLeft, onMoveRight, onMarkDelivered, onAssignDriver, drivers, onClick }: any) {
  const status = COLUMNS[columnIndex].id
  const isDelivered = status === 'GELIEFERT'
  const canMoveLeft = columnIndex > 0 && !isDelivered
  const canMoveRight = columnIndex < 2 && !isDelivered

  return (
    <div className={`bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:shadow-md transition mb-2 text-xs ${isDelivered ? 'opacity-70' : ''}`}>
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
            <span className="text-gray-600">
              {new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {/* Timer - nur bei nicht-gelieferten */}
          {!isDelivered && <OrderTimer createdAt={order.created_at} status={status} />}
        </div>
      </div>

      <div className="text-center py-1 bg-gray-50 rounded mt-2">
        <span className="text-gray-600">{order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0)} Artikel</span>
      </div>

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

export default function KanbanPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any>({ OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: [] })
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<any[]>([])
  const [showAllDays, setShowAllDays] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const knownOrderIds = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)

  const loadOrders = useCallback(async () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!showAllDays) query = query.gte('created_at', todayStart.toISOString())
    const { data } = await query

    if (data) {
      // Neue Bestellungen erkennen
      if (!isFirstLoad.current) {
        const newOrders = data.filter((o: any) => !knownOrderIds.current.has(o.id) && o.status === 'OFFEN')
        if (newOrders.length > 0) {
          if (soundEnabled) playNotificationSound()
          setNewOrderAlert(true)
          setTimeout(() => setNewOrderAlert(false), 5000)
        }
      }

      // Alle bekannten IDs speichern
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
  }, [showAllDays, soundEnabled])

  useEffect(() => {
    loadOrders()
    loadDrivers()
    const interval = setInterval(loadOrders, 15000) // alle 15 Sek prüfen
    return () => clearInterval(interval)
  }, [loadOrders])

  const loadDrivers = async () => {
    const { data } = await supabase.from('drivers').select('*').eq('is_active', true).order('name')
    if (data) setDrivers(data)
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
    if (ok) loadOrders()
  }

  const markDelivered = async (orderId: string) => {
    if (!confirm('Als geliefert markieren?')) return
    const ok = await updateOrder(orderId, {
      status: 'GELIEFERT',
      delivered_at: new Date().toISOString()
    })
    if (ok) loadOrders()
  }

  const assignDriver = async (orderId: string, driverId: string) => {
    const ok = await updateOrder(orderId, {
      driver_id: driverId,
      status: 'AN_FAHRER',
      assigned_at: new Date().toISOString()
    })
    if (ok) loadOrders()
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

      {/* NEUE BESTELLUNG ALERT */}
      {newOrderAlert && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-bounce">
          🔔 Neue Bestellung eingegangen!
        </div>
      )}

      {/* HORIZONTALE TOP NAVBAR */}
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                isActive ? 'bg-white text-gray-900' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}>
              <Icon size={13} />
              {item.label}
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-3">
          {/* Sound Toggle */}
          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition ${soundEnabled ? 'text-yellow-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-700'}`}
            title={soundEnabled ? 'Ton ausschalten' : 'Ton einschalten'}>
            {soundEnabled ? <Bell size={13} /> : <BellOff size={13} />}
            {soundEnabled ? 'Ton an' : 'Ton aus'}
          </button>
          <span className="text-xs text-gray-400 hidden md:block">info@eiscafe-simonetti.de</span>
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
            <p className="text-gray-500 text-xs">Pfeile ← → zum Verschieben · Aktualisiert alle 15 Sek</p>
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

        {/* 4 Spalten */}
        <div className="grid grid-cols-4 gap-3">
          {COLUMNS.map((column, columnIndex) => (
            <div key={column.id} className={`rounded-lg ${column.color} p-3`}>
              <div className="mb-3">
                <h2 className="font-bold flex items-center gap-1.5">
                  <span>{column.icon}</span>
                  <span>{column.title}</span>
                  <span className="text-sm font-normal text-gray-600">({orders[column.id]?.length || 0})</span>
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