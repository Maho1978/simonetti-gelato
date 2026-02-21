import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { ChevronLeft, ChevronRight, User, MapPin, Clock, Printer } from 'lucide-react'
import { useRouter } from 'next/router'

const COLUMNS = [
  { id: 'OFFEN', title: 'Offen', color: 'bg-gray-100', icon: '🔔' },
  { id: 'IN_BEARBEITUNG', title: 'In Bearbeitung', color: 'bg-blue-100', icon: '👨‍🍳' },
  { id: 'AN_FAHRER', title: 'An Fahrer', color: 'bg-orange-100', icon: '🚗' },
  { id: 'GELIEFERT', title: 'Geliefert', color: 'bg-green-100', icon: '✅' }
]

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

      <div class="section">
        <b>Bestellung:</b><br/>
        <pre>${items}</pre>
      </div>

      ${order.notes ? `<div class="section"><b>Notizen:</b><br/>${order.notes}</div>` : ''}

      <div class="total row">
        <span>GESAMT:</span>
        <span>${order.total?.toFixed(2)}€</span>
      </div>
      <div class="row"><span>Zahlung:</span><span>${order.payment_method || 'N/A'}</span></div>
    </body></html>
  `
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(printContent)
    win.document.close()
    win.print()
  }
}

function OrderCard({ order, columnIndex, onMoveLeft, onMoveRight, onMarkDelivered, onAssignDriver, drivers, onClick }: any) {
  const status = COLUMNS[columnIndex].id
  const isDelivered = status === 'GELIEFERT'
  // Geliefert kann nicht verschoben werden, AN_FAHRER kann nicht nach rechts per Pfeil
  const canMoveLeft = columnIndex > 0 && !isDelivered
  const canMoveRight = columnIndex < 2 && !isDelivered // max bis AN_FAHRER per Pfeil

  return (
    <div className={`bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:shadow-md transition mb-2 text-xs ${isDelivered ? 'opacity-70' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveLeft() }}
          disabled={!canMoveLeft}
          className={`p-1 rounded transition ${canMoveLeft ? 'hover:bg-gray-200 text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 text-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1" onClick={onClick}>
          <div className="font-bold text-xs">
            #{order.order_number || order.id.substring(0, 6).toUpperCase()}
          </div>
          <div className="font-bold text-base">{order.total?.toFixed(2)}€</div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onMoveRight() }}
          disabled={!canMoveRight}
          className={`p-1 rounded transition ${canMoveRight ? 'hover:bg-gray-200 text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Customer Info */}
      <div className="space-y-1 cursor-pointer hover:bg-gray-50 rounded p-2" onClick={onClick}>
        <div className="flex items-center gap-1 truncate">
          <User size={12} className="text-gray-400 flex-shrink-0" />
          <span className="font-semibold truncate">{order.customer_name}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
          <span className="truncate text-gray-600">{order.delivery_address?.split(',')[0]}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-600">
            {new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Items Count */}
      <div className="text-center py-1 bg-gray-50 rounded mt-2">
        <span className="text-gray-600">
          {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0)} Artikel
        </span>
      </div>

      {/* Druck Button - immer sichtbar */}
      <button
        onClick={(e) => { e.stopPropagation(); printOrder(order) }}
        className="w-full mt-2 py-1.5 bg-gray-700 text-white rounded text-xs font-bold hover:bg-gray-900 transition flex items-center justify-center gap-1"
      >
        <Printer size={12} /> Drucken
      </button>

      {/* Driver Assignment - nur bei AN_FAHRER */}
      {status === 'AN_FAHRER' && (
        <>
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            {order.driver_id ? (
              <div className="text-xs bg-blue-50 rounded px-2 py-1 text-center">
                🚗 {drivers.find((d: any) => d.id === order.driver_id)?.name || 'Zugewiesen'}
              </div>
            ) : (
              <select
                onChange={(e) => onAssignDriver(order.id, e.target.value)}
                className="text-xs w-full border rounded px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Fahrer...</option>
                {drivers.map((driver: any) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onMarkDelivered() }}
            className="w-full mt-2 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition"
          >
            ✅ Geliefert
          </button>
        </>
      )}

      {/* Geliefert-Zeit anzeigen */}
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
  const [orders, setOrders] = useState<any>({
    OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: []
  })
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<any[]>([])
  const [showAllDays, setShowAllDays] = useState(false)

  useEffect(() => {
    loadOrders()
    loadDrivers()
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [showAllDays])

  const loadOrders = async () => {
    // Heute von 00:00 bis jetzt
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    // Standardmäßig nur heute anzeigen
    if (!showAllDays) {
      query = query.gte('created_at', todayStart.toISOString())
    }

    const { data } = await query

    if (data) {
      const grouped: any = { OFFEN: [], IN_BEARBEITUNG: [], AN_FAHRER: [], GELIEFERT: [] }
      data.forEach((order: any) => {
        const status = order.status || 'OFFEN'
        if (grouped[status] !== undefined) {
          grouped[status].push(order)
        }
      })
      setOrders(grouped)
    }
    setLoading(false)
  }

  const loadDrivers = async () => {
    const { data } = await supabase.from('drivers').select('*').eq('is_active', true).order('name')
    if (data) setDrivers(data)
  }

  const moveOrder = async (orderId: string, currentColumnIndex: number, direction: number) => {
    const newColumnIndex = currentColumnIndex + direction
    if (newColumnIndex < 0 || newColumnIndex >= COLUMNS.length) return

    const currentStatus = COLUMNS[currentColumnIndex].id
    const newStatus = COLUMNS[newColumnIndex].id

    const updateData: any = { status: newStatus, updated_at: new Date().toISOString() }

    if (newStatus === 'AN_FAHRER') {
      const order = orders[currentStatus].find((o: any) => o.id === orderId)
      if (order && !order.assigned_at) updateData.assigned_at = new Date().toISOString()
    }

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)
    if (!error) loadOrders()
  }

  const markDelivered = async (orderId: string) => {
    if (!confirm('Als geliefert markieren?')) return
    const { error } = await supabase.from('orders').update({
      status: 'GELIEFERT',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', orderId)
    if (!error) loadOrders()
  }

  const assignDriver = async (orderId: string, driverId: string) => {
    const { error } = await supabase.from('orders').update({
      driver_id: driverId,
      status: 'AN_FAHRER',
      assigned_at: new Date().toISOString()
    }).eq('id', orderId)
    if (!error) loadOrders()
  }

  // Tages-Umsatz berechnen
  const todayTotal = Object.values(orders).flat().reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const deliveredCount = orders['GELIEFERT']?.length || 0

  if (loading) return <AdminLayout><div className="p-8">Lädt...</div></AdminLayout>

  return (
    <AdminLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-display font-bold italic mb-1">Bestellungen Kanban</h1>
            <p className="text-gray-600 text-sm">Verwende die Pfeile ← → um Bestellungen zu verschieben</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{todayTotal.toFixed(2)}€</div>
            <div className="text-sm text-gray-500">{deliveredCount} geliefert heute</div>
          </div>
        </div>

        {/* Filter: Heute / Alle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowAllDays(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${!showAllDays ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:border-black'}`}
          >
            📅 Nur Heute
          </button>
          <button
            onClick={() => setShowAllDays(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${showAllDays ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:border-black'}`}
          >
            📋 Alle Bestellungen
          </button>
        </div>

        {/* 4 Spalten */}
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((column, columnIndex) => (
            <div key={column.id} className={`rounded-lg ${column.color} p-4`}>
              <div className="mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
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
                  <div className="text-center text-gray-400 text-sm pt-8">Keine Bestellungen</div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  )
}