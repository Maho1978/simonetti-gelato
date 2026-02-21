import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoCheck, setAutoCheck] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastCheckTime, setLastCheckTime] = useState(new Date())
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastOrderCountRef = useRef(0)

  // Initial Load
  useEffect(() => {
    loadOrders()
  }, [])

  // Auto-Check alle 15 Sekunden
  useEffect(() => {
    if (!autoCheck) return

    const interval = setInterval(() => {
      checkForNewOrders()
    }, 15000) // 15 Sekunden

    return () => clearInterval(interval)
  }, [autoCheck, orders])

  const loadOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setOrders(data)
      lastOrderCountRef.current = data.length
    }
    setLoading(false)
    setLastCheckTime(new Date())
  }

  const checkForNewOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      const newOrdersCount = data.length
      const hasNewOrders = newOrdersCount > lastOrderCountRef.current

      if (hasNewOrders && soundEnabled) {
        // Spiele Ton ab
        playNotificationSound()
      }

      setOrders(data)
      lastOrderCountRef.current = newOrdersCount
      setLastCheckTime(new Date())
    }
  }

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log('Audio playback failed:', err)
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OFFEN': return 'bg-gray-200 text-gray-800'
      case 'IN_BEARBEITUNG': return 'bg-blue-100 text-blue-800'
      case 'AN_FAHRER': return 'bg-orange-100 text-orange-800'
      case 'GELIEFERT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'OFFEN': return '🔔'
      case 'IN_BEARBEITUNG': return '👨‍🍳'
      case 'AN_FAHRER': return '🚗'
      case 'GELIEFERT': return '✅'
      default: return '📦'
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-7xl">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold italic mb-2">Bestellungen</h1>
              <p className="text-gray-600">
                {orders.length} Bestellungen | 
                Letzte Prüfung: {lastCheckTime.toLocaleTimeString('de-DE')}
              </p>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={() => setAutoCheck(!autoCheck)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                  autoCheck 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {autoCheck ? <Bell size={20} /> : <BellOff size={20} />}
                Auto-Check {autoCheck ? 'AN' : 'AUS'}
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                  soundEnabled 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                Ton {soundEnabled ? 'AN' : 'AUS'}
              </button>

              <button
                onClick={loadOrders}
                className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition"
              >
                🔄 Aktualisieren
              </button>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-12">Lädt Bestellungen...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">Noch keine Bestellungen</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-black transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">
                          #{order.order_number || order.id.substring(0, 8).toUpperCase()}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{order.total.toFixed(2)} €</div>
                      <div className="text-xs text-gray-500 mt-1">{order.payment_method}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-700">Kunde</p>
                      <p>{order.customer_name}</p>
                      <p className="text-gray-600">{order.customer_phone}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Lieferadresse</p>
                      <p className="text-gray-600">{order.delivery_address}</p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Artikel:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto">
        {/* Notification Sound - Web Audio API Beep */}
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKJ0/LPezMGBQFMXt41TlUhZi1pP2Nzq+Gs0KPjqlW7i1FeekNdZG1EWUNXN0ZaU0lJXk9US0lFP0A/TEtGRk5MSUpKQ0VFQ0RGRUdERERDQ0NEQkNEQ0RDQkJCQUFCQUFBQEBAQD8/Pz4+Pj09PT08PDs7OTg4Nzc2NTU0NDMzMzIyMTExMDAwLy8vLi4uLS0tLCwrKyoqKSkpKCgoJycmJiUlJCQjIyMiIiEhICAf

Hx4eHR0dHBwbGxoaGhkZGBgYFxcWFhYVFRQUFBMTEhISERERDw8ODg0NDAwMCwoKCQkJCAcHBwYGBQUFBAMDAwICAQEBAAABAgIDAwQEBQUGBwcICQkKCgsLDAwNDQ4ODw8REBESExMUFBUVFhYXFxgYGRkaGhscHB0dHh4fHyAgISEiIyMkJCUmJicoKCkpKioqKywtLS4uLi8vMDAxMTIyMzM0NDU1NjY3Nzg4OTo6Ozs8PDw9PT4+Pz8/QEBAQUFBQkJDQ0RDRERERUZGRkZHR0dHR0hISEhISEhISEhISEhISEhISEhHR0dHR0dGRkZGRUVFREREREJDQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkNDQ0REREVFRUZGRkdHR0hISUlJSkpLCwsMDA0NDg4PDxAQEBESEhMTFBQVFRYWFhcYGBgZGhobGx0dHh8fICEiIiQkJSYnKCkqKywsLS4vMDEyMzU1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoamtrbG1ub3BxcnN0dXZ3d3h5ent8fX5/f4CBgoODhIWGh4iJiYqLjI2Oj5CRkpKTlJWWl5iYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==" type="audio/wav" />
      </audio>
    </AdminLayout>
  )
}