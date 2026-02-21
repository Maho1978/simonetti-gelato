import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { ChevronLeft, ChevronRight, User, Phone, MapPin, Clock, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/router'

const COLUMNS = [
  { id: 'OFFEN', title: 'Offen', color: 'bg-gray-100', icon: '🔔' },
  { id: 'IN_BEARBEITUNG', title: 'In Bearbeitung', color: 'bg-blue-100', icon: '👨‍🍳' },
  { id: 'AN_FAHRER', title: 'An Fahrer', color: 'bg-orange-100', icon: '🚗' }
]

function OrderCard({ order, columnIndex, onMoveLeft, onMoveRight, onMarkDelivered, onAssignDriver, drivers, onClick }: any) {
  const canMoveLeft = columnIndex > 0
  const canMoveRight = columnIndex < COLUMNS.length - 1
  const status = COLUMNS[columnIndex].id

  return (
    <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:shadow-md transition mb-2 text-xs">
      
      {/* Compact Header: Arrows, Number, Price */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoveLeft()
          }}
          disabled={!canMoveLeft}
          className={`p-1 rounded transition ${
            canMoveLeft 
              ? 'hover:bg-gray-200 text-gray-700' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={16} />
        </button>

        <div 
          className="flex-1 text-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
          onClick={onClick}
        >
          <div className="font-bold text-xs">
            #{order.order_number || order.id.substring(0, 6).toUpperCase()}
          </div>
          <div className="font-bold text-base">
            {order.total.toFixed(2)}€
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoveRight()
          }}
          disabled={!canMoveRight}
          className={`p-1 rounded transition ${
            canMoveRight 
              ? 'hover:bg-gray-200 text-gray-700' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Compact Customer Info */}
      <div 
        className="space-y-1 cursor-pointer hover:bg-gray-50 rounded p-2"
        onClick={onClick}
      >
        <div className="flex items-center gap-1 truncate">
          <User size={12} className="text-gray-400 flex-shrink-0" />
          <span className="font-semibold truncate">{order.customer_name}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
          <span className="truncate text-gray-600">{order.delivery_address.split(',')[0]}</span>
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
          {order.items.reduce((sum, item) => sum + item.quantity, 0)} Artikel
        </span>
      </div>

      {/* Driver Assignment */}
      {status === 'AN_FAHRER' && (
        <>
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            {order.driver_id ? (
              <div className="text-xs bg-blue-50 rounded px-2 py-1 text-center">
                🚗 {drivers.find(d => d.id === order.driver_id)?.name || 'Zugewiesen'}
              </div>
            ) : (
              <select
                onChange={(e) => onAssignDriver(order.id, e.target.value)}
                className="text-xs w-full border rounded px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Fahrer...</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* Geliefert Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkDelivered()
            }}
            className="w-full mt-2 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition"
          >
            ✅ Geliefert
          </button>
        </>
      )}
    </div>
  )
}

export default function KanbanPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any>({
    OFFEN: [],
    IN_BEARBEITUNG: [],
    AN_FAHRER: []
  })
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<any[]>([])

  useEffect(() => {
    loadOrders()
    loadDrivers()
    
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'GELIEFERT') // Nur aktive Bestellungen
      .order('created_at', { ascending: false })

    if (data) {
      const grouped = {
        OFFEN: [],
        IN_BEARBEITUNG: [],
        AN_FAHRER: []
      }

      data.forEach(order => {
        const status = order.status || 'OFFEN'
        if (grouped[status]) {
          grouped[status].push(order)
        }
      })

      setOrders(grouped)
    }
    setLoading(false)
  }

  const loadDrivers = async () => {
    const { data } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (data) setDrivers(data)
  }

  const moveOrder = async (orderId: string, currentColumnIndex: number, direction: number) => {
    const newColumnIndex = currentColumnIndex + direction
    if (newColumnIndex < 0 || newColumnIndex >= COLUMNS.length) return

    const currentStatus = COLUMNS[currentColumnIndex].id
    const newStatus = COLUMNS[newColumnIndex].id

    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (newStatus === 'AN_FAHRER') {
      const order: any = orders[currentStatus as keyof typeof orders].find((o: any) => o.id === orderId)
      if (order && !order.assigned_at) {
        updateData.assigned_at = new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (!error) {
      loadOrders()
    } else {
      console.error('Update error:', error)
    }
  }

  const markDelivered = async (orderId: string) => {
    if (!confirm('Als geliefert markieren?')) return

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'GELIEFERT',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (!error) {
      loadOrders() // Verschwindet aus Kanban
    } else {
      console.error('Update error:', error)
    }
  }

  const assignDriver = async (orderId: string, driverId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        driver_id: driverId,
        status: 'AN_FAHRER',
        assigned_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (!error) {
      loadOrders()
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">Lädt...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold italic mb-2">Bestellungen Kanban</h1>
          <p className="text-gray-600">Verwende die Pfeile ← → um Bestellungen zu verschieben</p>
          <p className="text-sm text-gray-500 mt-1">💡 Gelieferte Bestellungen findest du unter "Bestellungen"</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map((column, columnIndex) => (
            <div key={column.id} className={`rounded-lg ${column.color} p-4`}>
              
              {/* Column Header */}
              <div className="mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <span>{column.icon}</span>
                  <span>{column.title}</span>
                  <span className="text-sm font-normal text-gray-600">
                    ({orders[column.id].length})
                  </span>
                </h2>
              </div>

              {/* Orders */}
              <div className="min-h-[500px]">
                {orders[column.id].map((order) => (
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
              </div>

            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  )
}