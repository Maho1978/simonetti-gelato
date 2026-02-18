import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Package, Settings as SettingsIcon, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'

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
}

interface Feature {
  id: string
  name: string
  description: string
  enabled: boolean
  config: any
}

interface ShopSettings {
  delivery_time: string
  min_order_value: number
  delivery_fee: number
  is_open: boolean
}

export default function SimonettiAdmin({ session }: { session: Session | null }) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [settings, setSettings] = useState<ShopSettings>({
    delivery_time: '30-45 Min.',
    min_order_value: 15.00,
    delivery_fee: 3.00,
    is_open: true
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'features' | 'settings'>('orders')

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/admin')
      return
    }

    const isAdmin = session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
                    session.user.user_metadata?.role === 'admin'

    if (!isAdmin) {
      router.push('/')
      return
    }

    fetchData()
    const interval = setInterval(fetchData, 20000)
    return () => clearInterval(interval)
  }, [session])

  const fetchData = async () => {
    try {
      // Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (ordersData) setOrders(ordersData)

      // Features
      const { data: featuresData } = await supabase
        .from('feature_toggles')
        .select('*')
        .order('name', { ascending: true })

      if (featuresData) setFeatures(featuresData)

      // Settings
      const { data: settingsData } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('id', 'main')
        .single()

      if (settingsData) {
        setSettings({
          delivery_time: settingsData.delivery_time,
          min_order_value: settingsData.min_order_value,
          delivery_fee: settingsData.delivery_fee,
          is_open: settingsData.is_open
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (id: string, newStatus: string) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token

    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })

    fetchData()
  }

  const toggleFeature = async (featureId: string, currentState: boolean) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token

    await fetch('/api/features', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        id: featureId, 
        enabled: !currentState 
      })
    })

    fetchData()
  }

  const renderKanbanColumn = (title: string, status: string, color: string, nextStatus?: string, btnText?: string) => {
    const filteredOrders = orders.filter(o => o.status === status)
    
    return (
      <div className="flex-1 bg-cream rounded-2xl p-6 min-h-[60vh]">
        <h3 className="text-xl font-display font-bold italic mb-4 pb-3 border-b-4" style={{ borderColor: color, color: '#4a5d54' }}>
          {title} ({filteredOrders.length})
        </h3>

        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-primary">#{order.order_number}</div>
                <div className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-3">
                {order.items?.map((item: any, i: number) => (
                  <div key={i}>{item.quantity}x {item.name}</div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-primary text-lg">{order.total.toFixed(2)} €</div>
                <div className="text-xs px-2 py-1 rounded bg-gray-100">
                  {order.payment_method}
                </div>
              </div>

              {nextStatus && (
                <button
                  onClick={() => updateOrderStatus(order.id, nextStatus)}
                  className="w-full py-2 rounded-lg font-bold text-white text-sm transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: color }}
                >
                  {btnText}
                </button>
              )}
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-2">🍦</div>
              <div className="text-sm">Keine Bestellungen</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🍦</div>
          <div className="font-display italic text-xl text-primary">Lade Dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-display font-bold italic text-primary mb-2">
            Simonetti Control
          </h1>
          <p className="text-secondary text-lg">Verwaltung & Logistik</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📦 Bestellungen
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🍦 Produkte
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'features'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⚙️ Features
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔧 Einstellungen
          </button>
        </div>

        {/* Orders Tab - Kanban Board */}
        {activeTab === 'orders' && (
          <div className="flex gap-6">
            {renderKanbanColumn('Eingegangen', 'OFFEN', '#e74c3c', 'IN_BEARBEITUNG', 'VORBEREITEN')}
            {renderKanbanColumn('Zubereitung', 'IN_BEARBEITUNG', '#f39c12', 'GELIEFERT', 'AUSLIEFERN')}
            {renderKanbanColumn('Geliefert', 'GELIEFERT', '#27ae60')}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-primary">Produkte verwalten</h2>
              <Link
                href="/admin/products"
                className="btn-primary flex items-center space-x-2"
              >
                <Package size={20} />
                <span>Produkte bearbeiten</span>
              </Link>
            </div>
            <p className="text-gray-600">
              Hier können Sie Ihre Eissorten, Preise und Kategorien verwalten.
            </p>
          </div>
        )}

        {/* Features Tab - Toggle System */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-2xl font-display font-bold text-primary mb-4">
                Feature-Steuerung
              </h2>
              <p className="text-gray-600 mb-6">
                Aktivieren oder deaktivieren Sie Features für Ihre Kunden. Änderungen sind sofort wirksam.
              </p>

              {/* Zahlungsmethoden */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <CreditCard className="mr-2" size={20} />
                  Zahlungsmethoden
                </h3>
                <div className="space-y-3">
                  {features
                    .filter(f => ['paypal', 'sepa', 'giropay', 'sofort', 'apple_pay', 'google_pay'].includes(f.id))
                    .map(feature => (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-primary">{feature.name}</div>
                          <div className="text-sm text-gray-600">{feature.description}</div>
                          {feature.id === 'paypal' && !feature.enabled && (
                            <div className="text-xs text-secondary mt-1">
                              ℹ️ Code installiert, aber für Kunden unsichtbar
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleFeature(feature.id, feature.enabled)}
                          className={`p-2 rounded-lg transition-all ${
                            feature.enabled 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                        >
                          {feature.enabled ? (
                            <ToggleRight size={32} />
                          ) : (
                            <ToggleLeft size={32} />
                          )}
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Andere Features */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <SettingsIcon className="mr-2" size={20} />
                  Shop-Features
                </h3>
                <div className="space-y-3">
                  {features
                    .filter(f => !['paypal', 'sepa', 'giropay', 'sofort', 'apple_pay', 'google_pay'].includes(f.id))
                    .map(feature => (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-primary">{feature.name}</div>
                          <div className="text-sm text-gray-600">{feature.description}</div>
                        </div>
                        <button
                          onClick={() => toggleFeature(feature.id, feature.enabled)}
                          className={`p-2 rounded-lg transition-all ${
                            feature.enabled 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                        >
                          {feature.enabled ? (
                            <ToggleRight size={32} />
                          ) : (
                            <ToggleLeft size={32} />
                          )}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="card">
            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              Shop-Einstellungen
            </h2>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    LIEFERZEIT
                  </label>
                  <input
                    type="text"
                    value={settings.delivery_time}
                    onChange={(e) => setSettings({ ...settings, delivery_time: e.target.value })}
                    className="input"
                    placeholder="30-45 Min."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    MINDESTBESTELLWERT (€)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={settings.min_order_value}
                    onChange={(e) => setSettings({ ...settings, min_order_value: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    LIEFERGEBÜHR (€)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={settings.delivery_fee}
                    onChange={(e) => setSettings({ ...settings, delivery_fee: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    SHOP STATUS
                  </label>
                  <select
                    value={settings.is_open ? 'open' : 'closed'}
                    onChange={(e) => setSettings({ ...settings, is_open: e.target.value === 'open' })}
                    className="input"
                  >
                    <option value="open">🟢 Geöffnet</option>
                    <option value="closed">🔴 Geschlossen</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
              >
                Einstellungen speichern
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
