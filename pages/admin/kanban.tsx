import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Clock, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  created_at: string
  items: any[]
  total: number
  status: string
  delivery_address: any
  guest_email?: string
  payment_method: string
  notes?: string
  timer_minutes?: number
}

interface Column {
  title: string
  status: string
  color: string
  next: string | null
  btn: string | null
  emoji: string
  timer_default?: number
}

const COLS: Column[] = [
  { title: 'Eingegangen', status: 'OFFEN', color: '#e74c3c', next: 'IN_BEARBEITUNG', btn: '▶ VORBEREITEN', emoji: '🆕', timer_default: 5 },
  { title: 'Zubereitung', status: 'IN_BEARBEITUNG', color: '#f39c12', next: 'AN_FAHRER', btn: '🛵 AN FAHRER', emoji: '👨‍🍳', timer_default: 15 },
  { title: 'An Fahrer', status: 'AN_FAHRER', color: '#3498db', next: 'GELIEFERT', btn: '✅ GELIEFERT', emoji: '🛵', timer_default: 20 },
  { title: 'Geliefert', status: 'GELIEFERT', color: '#27ae60', next: null, btn: null, emoji: '✅' },
]

// Sortierbare Bestellkarte
function SortableOrderCard({ order, onStatusChange, columnColor, nextButton, formatTime, showTimer }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id })
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    if (!order.timer_end) return
    
    const interval = setInterval(() => {
      const now = Date.now()
      const end = new Date(order.timer_end).getTime()
      const diff = Math.floor((end - now) / 1000)
      
      setTimeLeft(diff)
      setIsWarning(diff <= 120 && diff > 0) // Warnung bei letzten 2 Minuten
      
      if (diff <= 0) {
        playWarningSound()
        clearInterval(interval)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [order.timer_end])

  const playWarningSound = () => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.3
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch (e) {}
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderColor: isWarning ? '#f59e0b' : columnColor,
    borderWidth: isWarning ? '3px' : '2px',
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-3 rounded-xl shadow-sm mb-3 border-l-4 relative">
      {/* Drag Handle */}
      <div {...listeners} {...attributes} className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
        <GripVertical size={16} className="text-gray-400" />
      </div>

      <div className="flex justify-between items-start mb-1 pr-8">
        <div className="font-bold text-sm" style={{ color: '#4a5d54' }}>
          #{order.order_number || order.id.slice(-4)}
        </div>
        <div className="text-xs text-gray-400">
          {new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {order.delivery_address?.street && (
        <div className="text-xs text-gray-400 mb-1">📍 {order.delivery_address.street}</div>
      )}

      <div className="text-xs text-gray-600 mb-2 space-y-0.5">
        {order.items?.map((item: any, i: number) => (
          <div key={i}>{item.quantity}x {item.name}</div>
        ))}
      </div>

      {order.notes && <div className="text-xs italic text-gray-400 mb-2">💬 {order.notes}</div>}

      {/* Timer Display */}
      {showTimer && timeLeft !== null && (
        <div className={`flex items-center gap-1 mb-2 text-xs font-bold ${
          isWarning ? 'text-orange-600 animate-pulse' : 'text-blue-600'
        }`}>
          <Clock size={12} />
          {timeLeft > 0 ? formatTime(timeLeft) : 'Zeit abgelaufen!'}
          {isWarning && <AlertCircle size={12} className="animate-bounce" />}
        </div>
      )}

      <div className="font-bold text-sm mb-2" style={{ color: '#4a5d54' }}>
        {Number(order.total).toFixed(2)} €
      </div>

      {nextButton && (
        <button
          onClick={() => onStatusChange(order.id, nextButton.next)}
          className="w-full py-1.5 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90"
          style={{ backgroundColor: columnColor }}
        >
          {nextButton.btn}
        </button>
      )}
    </div>
  )
}

export default function KanbanBoard({ session }: { session: Session | null }) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    OFFEN: 25,
    IN_BEARBEITUNG: 25,
    AN_FAHRER: 25,
    GELIEFERT: 25
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/admin/kanban')
      return
    }
    fetchOrders()
    const interval = setInterval(fetchOrders, 15000)
    
    // Load saved column widths
    const saved = localStorage.getItem('kanban-column-widths')
    if (saved) setColumnWidths(JSON.parse(saved))
    
    return () => clearInterval(interval)
  }, [session])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setOrders(data)
  }

  const updateOrderStatus = async (id: string, status: string) => {
    // Set timer when moving to new status
    const col = COLS.find(c => c.status === status)
    const timerMinutes = col?.timer_default || 0
    const timerEnd = timerMinutes > 0 ? new Date(Date.now() + timerMinutes * 60000).toISOString() : null

    await supabase
      .from('orders')
      .update({ status, timer_end: timerEnd })
      .eq('id', id)

    // Send email notification wenn "AN_FAHRER"
    if (status === 'AN_FAHRER') {
      const order = orders.find(o => o.id === id)
      if (order) {
        const recipientEmail = order.guest_email || order.user?.email
        if (recipientEmail) {
          await fetch('/api/emails/send-order-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order_out_for_delivery',
              order: order,
              recipientEmail: recipientEmail
            })
          })
        }
      }
    }

    fetchOrders()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeOrder = orders.find(o => o.id === active.id)
    const overColumn = COLS.find(c => over.id.toString().startsWith(c.status))
    
    if (activeOrder && overColumn && activeOrder.status !== overColumn.status) {
      updateOrderStatus(activeOrder.id, overColumn.status)
    }
  }

  const adjustColumnWidth = (status: string, delta: number) => {
    const newWidths = { ...columnWidths }
    const currentWidth = newWidths[status]
    const newWidth = Math.max(15, Math.min(40, currentWidth + delta))
    newWidths[status] = newWidth
    
    // Adjust other columns proportionally
    const others = Object.keys(newWidths).filter(k => k !== status)
    const totalOthers = 100 - newWidth
    const share = totalOthers / others.length
    others.forEach(k => newWidths[k] = share)
    
    setColumnWidths(newWidths)
    localStorage.setItem('kanban-column-widths', JSON.stringify(newWidths))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-full mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-bold italic" style={{ color: '#4a5d54' }}>
            Kanban Board
          </h1>
          <button onClick={fetchOrders} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold">
            🔄 Aktualisieren
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {COLS.map(col => {
              const colOrders = orders.filter(o => o.status === col.status)
              const width = columnWidths[col.status]

              return (
                <div key={col.status} style={{ width: `${width}%` }} className="min-h-[600px]">
                  <div className="rounded-2xl p-4 h-full" style={{ backgroundColor: '#f9f8f4' }}>
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b-4" style={{ borderColor: col.color }}>
                      <div className="flex items-center gap-2">
                        <span>{col.emoji}</span>
                        <h3 className="font-bold italic text-sm" style={{ color: '#4a5d54' }}>
                          {col.title}
                        </h3>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: col.color }}>
                          {colOrders.length}
                        </span>
                      </div>
                      
                      {/* Width Controls */}
                      <div className="flex gap-1">
                        <button onClick={() => adjustColumnWidth(col.status, -5)} className="text-xs px-1 py-0.5 bg-white rounded hover:bg-gray-100">−</button>
                        <button onClick={() => adjustColumnWidth(col.status, 5)} className="text-xs px-1 py-0.5 bg-white rounded hover:bg-gray-100">+</button>
                      </div>
                    </div>

                    {/* Drop Zone */}
                    <SortableContext items={colOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                      <div id={`${col.status}-dropzone`} className="space-y-3">
                        {colOrders.map(order => (
                          <SortableOrderCard
                            key={order.id}
                            order={order}
                            onStatusChange={updateOrderStatus}
                            columnColor={col.color}
                            nextButton={col.next ? { next: col.next, btn: col.btn } : null}
                            formatTime={formatTime}
                            showTimer={col.timer_default && col.timer_default > 0}
                          />
                        ))}
                        {colOrders.length === 0 && (
                          <div className="text-center py-10 text-gray-300">
                            <div className="text-2xl mb-1">🍦</div>
                            <div className="text-xs">Leer</div>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              )
            })}
          </div>
        </DndContext>
      </div>
    </div>
  )
}