import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Package, RefreshCw, Star } from 'lucide-react'

interface Order {
  id: string
  created_at: string
  items: any[]
  total: number
  status: string
  delivery_address: any
  tip?: number
}

export default function Account({ session }: { session: Session | null }) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/account')
      return
    }

    fetchOrders()
    fetchFavorites()
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?user_id=${session?.user.id}`)
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  const handleReorder = (order: Order) => {
    // Add all items from order to cart
    const cart = order.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      icon: item.icon || '🍽️',
      quantity: item.quantity,
      description: item.description || '',
      category: item.category || '',
      available: true,
    }))

    localStorage.setItem('cart', JSON.stringify(cart))
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Mein Account</h1>
          <p className="text-xl text-gray-600">
            Willkommen zurück, {session?.user?.user_metadata?.name || session?.user?.email}!
          </p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-display font-bold mb-6">
            Meine Bestellungen
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={80} className="text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-6">
                Du hast noch keine Bestellungen aufgegeben
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                Jetzt bestellen
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="border-2 border-gray-200 rounded-2xl p-6 hover:border-primary transition-colors duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">
                        Bestellung #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {order.status === 'pending'
                        ? 'Ausstehend'
                        : order.status === 'processing'
                        ? 'In Bearbeitung'
                        : 'Abgeschlossen'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between text-gray-700"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-semibold">
                          {(item.price * item.quantity).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 pt-4 flex justify-between items-center">
                    <div className="text-gray-600">
                      <div className="font-semibold">Lieferadresse:</div>
                      <div>
                        {order.delivery_address.name}
                        <br />
                        {order.delivery_address.street}
                        <br />
                        {order.delivery_address.zip} {order.delivery_address.city}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-primary">
                        {order.total.toFixed(2)} €
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.tip && order.tip > 0 && `inkl. ${order.tip.toFixed(2)} € Trinkgeld`}
                      </div>
                      
                      <button
                        onClick={() => handleReorder(order)}
                        className="btn-primary text-sm py-2 px-4 flex items-center space-x-2"
                      >
                        <RefreshCw size={16} />
                        <span>Erneut bestellen</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
