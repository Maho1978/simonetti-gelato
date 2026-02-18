import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Edit2, Trash2, ToggleLeft, ToggleRight, CreditCard, ShoppingBag, X, Package, ChevronDown, ChevronUp } from 'lucide-react'

interface Product {
  id: string; name: string; description: string; price: number
  category: string; icon: string; available: boolean; featured: boolean
  allergens: string[] | null; image_url: string | null
}
interface Order {
  id: string; order_number: string; created_at: string; items: any[]
  total: number; status: string; delivery_address: any
  guest_email?: string; payment_method: string; notes?: string
}
interface Feature { id: string; name: string; description: string; enabled: boolean }
interface ShopSettings { delivery_time: string; min_order_value: number; delivery_fee: number; is_open: boolean; open_from: string; open_until: string }

const COLS = [
  { title: 'Eingegangen',  status: 'OFFEN',          color: '#e74c3c', next: 'IN_BEARBEITUNG', btn: '▶ VORBEREITEN', emoji: '🆕' },
  { title: 'Zubereitung',  status: 'IN_BEARBEITUNG', color: '#f39c12', next: 'AN_FAHRER',       btn: '🛵 AN FAHRER',  emoji: '👨‍🍳' },
  { title: 'An Fahrer',    status: 'AN_FAHRER',      color: '#3498db', next: 'GELIEFERT',       btn: '✅ GELIEFERT',  emoji: '🛵' },
  { title: 'Geliefert',    status: 'GELIEFERT',      color: '#27ae60', next: null,              btn: null,           emoji: '✅' },
]

const ALLERGEN_OPTIONS = [
  'Gluten', 'Krebstiere', 'Eier', 'Fisch', 'Erdnüsse', 'Soja', 
  'Laktose', 'Schalenfrüchte', 'Sellerie', 'Senf', 'Sesam', 
  'Schwefeldioxid', 'Lupinen', 'Weichtiere'
]

export default function Admin({ session }: { session: Session | null }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'features' | 'settings'>('orders')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [settings, setSettings] = useState<ShopSettings>({
    delivery_time: '30-45 Min.', min_order_value: 15, delivery_fee: 3,
    is_open: true, open_from: '14:00', open_until: '22:00'
  })
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saveMsg, setSaveMsg] = useState('')
  const [newOrderPopup, setNewOrderPopup] = useState<Order | null>(null)
  const [allergensOpen, setAllergensOpen] = useState(false)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: 'Eis', icon: '🍦',
    available: true, featured: false
  })
  const prevOrderIds = useRef<Set<string>>(new Set())
  const audioCtx = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!session) { router.push('/auth/login?redirect=/admin'); return }
    const isAdmin = session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
                    session.user.user_metadata?.role === 'admin'
    if (!isAdmin) { router.push('/'); return }
    fetchAll()
    const interval = setInterval(checkNewOrders, 15000)
    return () => clearInterval(interval)
  }, [session])

  const fetchAll = async () => {
    await Promise.all([fetchProducts(), fetchOrders(), fetchFeatures(), fetchSettings()])
    setLoading(false)
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('category').order('name')
    if (data) setProducts(data)
  }

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
    if (data) setOrders(data)
  }

  const fetchFeatures = async () => {
    const { data } = await supabase.from('feature_toggles').select('*').order('name')
    if (data) setFeatures(data)
  }

  const fetchSettings = async () => {
    const { data } = await supabase.from('shop_settings').select('*').eq('id', 'main').single()
    if (data) setSettings({
      delivery_time: data.delivery_time,
      min_order_value: data.min_order_value,
      delivery_fee: data.delivery_fee,
      is_open: data.is_open,
      open_from: data.open_from || '14:00',
      open_until: data.open_until || '22:00',
    })
  }

  const checkNewOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
    if (!data) return
    const newOrders = data.filter(o => !prevOrderIds.current.has(o.id))
    if (newOrders.length > 0 && prevOrderIds.current.size > 0) {
      setNewOrderPopup(newOrders[0])
      playBell()
    }
    prevOrderIds.current = new Set(data.map(o => o.id))
    setOrders(data)
  }

  const playBell = () => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      [0, 0.4, 0.8].forEach(delay => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(830, ctx.currentTime + delay)
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + delay + 0.3)
        gain.gain.setValueAtTime(0.5, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.4)
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.4)
      })
    } catch (e) { console.log('Audio nicht verfügbar') }
  }

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchOrders()
  }

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    )
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const productData = { 
      ...formData, 
      price: parseFloat(formData.price),
      allergens: selectedAllergens.length > 0 ? selectedAllergens : null
    }
    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id)
    } else {
      await supabase.from('products').insert(productData)
    }
    setFormData({ name: '', description: '', price: '', category: 'Eis', icon: '🍦', available: true, featured: false })
    setSelectedAllergens([])
    setEditingProduct(null)
    setAllergensOpen(false)
    fetchProducts()
    showMsg('✅ Produkt gespeichert!')
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name, description: product.description, price: product.price.toString(),
      category: product.category, icon: product.icon, available: product.available,
      featured: product.featured
    })
    setSelectedAllergens(product.allergens || [])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleAvailable = async (id: string, current: boolean) => {
    await supabase.from('products').update({ available: !current }).eq('id', id)
    fetchProducts()
    showMsg(!current ? '✅ Produkt verfügbar' : '⏸️ Produkt nicht verfügbar')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Produkt wirklich löschen?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const toggleFeature = async (id: string, current: boolean) => {
    await supabase.from('feature_toggles').update({ enabled: !current }).eq('id', id)
    fetchFeatures()
    showMsg(!current ? '✅ Aktiviert!' : '⏸️ Deaktiviert!')
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('shop_settings').update({
      delivery_time: settings.delivery_time,
      min_order_value: settings.min_order_value,
      delivery_fee: settings.delivery_fee,
      is_open: settings.is_open,
      open_from: settings.open_from,
      open_until: settings.open_until,
    }).eq('id', 'main')
    showMsg('✅ Einstellungen gespeichert!')
  }

  const showMsg = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000) }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🍦</div>
        <div className="font-display italic text-xl" style={{ color: '#4a5d54' }}>Lade Dashboard...</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      {newOrderPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-fade-in">
            <div className="text-center mb-5">
              <div className="text-6xl mb-3 animate-bounce">🔔</div>
              <h2 className="text-3xl font-display font-bold italic" style={{ color: '#4a5d54' }}>Neue Bestellung!</h2>
              <div className="font-bold mt-1" style={{ color: '#8da399' }}>
                #{newOrderPopup.order_number || newOrderPopup.id.slice(-6)}
              </div>
            </div>
            <div className="rounded-2xl p-4 mb-5 space-y-1" style={{ backgroundColor: '#f9f8f4' }}>
              {newOrderPopup.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold" style={{ color: '#4a5d54', borderColor: '#e5e7eb' }}>
                <span>Gesamt</span><span>{Number(newOrderPopup.total).toFixed(2)} €</span>
              </div>
              {newOrderPopup.delivery_address && (
                <div className="text-xs text-gray-400 pt-1">
                  📍 {newOrderPopup.delivery_address.street}, {newOrderPopup.delivery_address.zip}
                </div>
              )}
              {newOrderPopup.notes && <div className="text-xs italic text-gray-400">💬 {newOrderPopup.notes}</div>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { updateOrderStatus(newOrderPopup.id, 'IN_BEARBEITUNG'); setNewOrderPopup(null) }}
                className="flex-1 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90"
                style={{ backgroundColor: '#4a5d54' }}>▶ ANNEHMEN</button>
              <button onClick={() => setNewOrderPopup(null)}
                className="p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"><X size={22} /></button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-5xl font-display font-bold italic" style={{ color: '#4a5d54' }}>Simonetti Control</h1>
            <p className="text-lg mt-1" style={{ color: '#8da399' }}>Verwaltung & Logistik</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ backgroundColor: settings.is_open ? '#e8f8f0' : '#fde8e8' }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: settings.is_open ? '#27ae60' : '#e74c3c' }}></div>
            <span className="font-bold text-sm" style={{ color: settings.is_open ? '#27ae60' : '#e74c3c' }}>
              {settings.is_open ? `Geöffnet · ${settings.open_from} – ${settings.open_until} Uhr` : 'Geschlossen'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { key: 'orders', label: '📦 Bestellungen' },
            { key: 'products', label: '🍦 Produkte' },
            { key: 'features', label: '⚙️ Features' },
            { key: 'settings', label: '🔧 Einstellungen' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className="px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all"
              style={activeTab === tab.key
                ? { backgroundColor: '#4a5d54', color: '#fdfcfb' }
                : { backgroundColor: 'white', color: '#4a5d54', border: '2px solid #e5e7eb' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">Automatische Aktualisierung alle 15 Sekunden 🔄</p>
              <button onClick={checkNewOrders}
                className="text-sm px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ backgroundColor: '#f9f8f4', color: '#8da399' }}>🔄 Jetzt prüfen</button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {COLS.map(col => {
                const colOrders = orders.filter(o => o.status === col.status)
                return (
                  <div key={col.status} className="rounded-2xl p-4 min-h-96" style={{ backgroundColor: '#f9f8f4' }}>
                    <h3 className="font-bold italic pb-3 mb-4 border-b-4 flex items-center gap-2"
                      style={{ borderColor: col.color, color: '#4a5d54' }}>
                      <span>{col.emoji}</span><span className="flex-1">{col.title}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: col.color }}>
                        {colOrders.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {colOrders.map(order => (
                        <div key={order.id} className="bg-white p-3 rounded-xl shadow-sm border-l-4" style={{ borderColor: col.color }}>
                          <div className="flex justify-between items-start mb-1">
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
                          <div className="font-bold text-sm mb-2" style={{ color: '#4a5d54' }}>
                            {Number(order.total).toFixed(2)} €
                          </div>
                          {col.btn && (
                            <button onClick={() => updateOrderStatus(order.id, col.next!)}
                              className="w-full py-1.5 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90"
                              style={{ backgroundColor: col.color }}>{col.btn}</button>
                          )}
                        </div>
                      ))}
                      {colOrders.length === 0 && (
                        <div className="text-center py-10 text-gray-300">
                          <div className="text-2xl mb-1">🍦</div><div className="text-xs">Leer</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-display font-bold italic mb-5" style={{ color: '#4a5d54' }}>
                {editingProduct ? '✏️ Produkt bearbeiten' : '➕ Neues Produkt'}
              </h2>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>NAME</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="input" placeholder="z.B. Pistazie" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>PREIS (€)</label>
                    <input type="number" step="0.10" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required className="input" placeholder="1.80" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>BESCHREIBUNG</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="input" placeholder="Beschreibung..." />
                </div>
                
                {/* ALLERGENE - AKKORDION */}
                <div>
                  <button
                    type="button"
                    onClick={() => setAllergensOpen(!allergensOpen)}
                    className="w-full flex items-center justify-between p-4 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: '#f9f8f4', color: '#4a5d54' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: '#8da399' }}>
                        ⚠️ ALLERGENE {selectedAllergens.length > 0 && `(${selectedAllergens.length} ausgewählt)`}
                      </span>
                    </div>
                    {allergensOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {allergensOpen && (
                    <div className="mt-2 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-2" style={{ backgroundColor: '#f9f8f4' }}>
                      {ALLERGEN_OPTIONS.map(allergen => (
                        <label key={allergen} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedAllergens.includes(allergen)}
                            onChange={() => toggleAllergen(allergen)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <span className="text-sm">{allergen}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>KATEGORIE</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input">
                      <option value="Eis">🍦 Eis</option>
                      <option value="Sorbet">🍧 Sorbet</option>
                      <option value="Eisbecher">🍨 Eisbecher</option>
                      <option value="Spezialitäten">⭐ Spezialitäten</option>
                      <option value="Getränke">🥤 Getränke</option>
                      <option value="Waffeln">🧇 Waffeln</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>ICON (Emoji)</label>
                    <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="input" placeholder="🍦" />
                  </div>
                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.available} onChange={e => setFormData({ ...formData, available: e.target.checked })} className="w-5 h-5 accent-green-600" />
                      <span className="font-semibold text-sm" style={{ color: '#4a5d54' }}>Verfügbar</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })} className="w-5 h-5 accent-yellow-500" />
                      <span className="font-semibold text-sm" style={{ color: '#4a5d54' }}>⭐ Top</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="px-6 py-3 rounded-xl font-bold text-white hover:opacity-90 transition-all" style={{ backgroundColor: '#4a5d54' }}>
                    {editingProduct ? '✅ Aktualisieren' : '➕ Hinzufügen'}
                  </button>
                  {editingProduct && (
                    <button type="button"
                      onClick={() => { setEditingProduct(null); setFormData({ name: '', description: '', price: '', category: 'Eis', icon: '🍦', available: true, featured: false }); setSelectedAllergens([]) }}
                      className="px-6 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 transition-all">Abbrechen</button>
                  )}
                </div>
              </form>
            </div>

            <div>
              <h2 className="text-xl font-bold italic mb-3" style={{ color: '#4a5d54' }}>Alle Produkte ({products.length})</h2>
              <div className="space-y-2">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-3xl">{product.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold" style={{ color: '#4a5d54' }}>{product.name}</div>
                        <div className="text-xs text-gray-400">
                          {product.category} • {Number(product.price).toFixed(2)} €
                          {product.allergens && product.allergens.length > 0 && (
                            <span className="ml-2">• ⚠️ {product.allergens.join(', ')}</span>
                          )}
                          {product.featured && <span className="ml-2 text-yellow-500">• ⭐ Top</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 rounded-lg text-white hover:opacity-80 transition-all" style={{ backgroundColor: '#8da399' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all">
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => alert('Varianten-Verwaltung kommt in der nächsten Version!')}
                        className="px-3 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                        style={{ backgroundColor: '#f9f8f4', color: '#4a5d54', border: '2px solid #4a5d54' }}
                        title="Bald verfügbar!">
                        <Package size={16} className="inline mr-1" />
                        Varianten
                      </button>
                      {/* TOGGLE GANZ RECHTS */}
                      <button onClick={() => toggleAvailable(product.id, product.available)}
                        className="transition-all hover:scale-110" title={product.available ? 'Verfügbar' : 'Nicht verfügbar'}>
                        {product.available ? (
                          <ToggleRight size={36} style={{ color: '#27ae60' }} />
                        ) : (
                          <ToggleLeft size={36} style={{ color: '#ccc' }} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-2xl font-display font-bold italic mb-1" style={{ color: '#4a5d54' }}>Feature-Steuerung</h2>
            <p className="text-gray-400 text-sm mb-6">Änderungen sind sofort für alle Kunden wirksam.</p>
            <div className="mb-8">
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#4a5d54' }}>
                <CreditCard size={18} /> Zahlungsmethoden
              </h3>
              <div className="space-y-2">
                {features.filter(f => ['paypal', 'sepa', 'giropay', 'sofort', 'apple_pay', 'google_pay'].includes(f.id)).map(feature => (
                  <div key={feature.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#f9f8f4' }}>
                    <div>
                      <div className="font-semibold" style={{ color: '#4a5d54' }}>{feature.name}</div>
                      <div className="text-xs text-gray-400">{feature.description}</div>
                      {feature.id === 'paypal' && !feature.enabled && (
                        <div className="text-xs mt-0.5" style={{ color: '#8da399' }}>💡 Code ready - Toggle AN = Kunden sehen PayPal sofort</div>
                      )}
                    </div>
                    <button onClick={() => toggleFeature(feature.id, feature.enabled)} className="transition-all hover:scale-110" style={{ color: feature.enabled ? '#27ae60' : '#ccc' }}>
                      {feature.enabled ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#4a5d54' }}>
                <ShoppingBag size={18} /> Shop-Features
              </h3>
              <div className="space-y-2">
                {features.filter(f => !['paypal', 'sepa', 'giropay', 'sofort', 'apple_pay', 'google_pay'].includes(f.id)).map(feature => (
                  <div key={feature.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#f9f8f4' }}>
                    <div>
                      <div className="font-semibold" style={{ color: '#4a5d54' }}>{feature.name}</div>
                      <div className="text-xs text-gray-400">{feature.description}</div>
                    </div>
                    <button onClick={() => toggleFeature(feature.id, feature.enabled)} className="transition-all hover:scale-110" style={{ color: feature.enabled ? '#27ae60' : '#ccc' }}>
                      {feature.enabled ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-2xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>Shop-Einstellungen</h2>
            <form onSubmit={saveSettings} className="space-y-8">
              <div>
                <h3 className="font-bold text-lg mb-4 pb-2 border-b" style={{ color: '#4a5d54', borderColor: '#f0ede8' }}>🕐 Lieferzeiten</h3>
                <div className="grid md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>LIEFERZEIT (Anzeige)</label>
                    <input type="text" value={settings.delivery_time}
                      onChange={e => setSettings({ ...settings, delivery_time: e.target.value })}
                      className="input" placeholder="z.B. 30-45 Min." />
                    <p className="text-xs text-gray-400 mt-1">Wird dem Kunden angezeigt</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>LIEFERUNG AB</label>
                    <input type="time" value={settings.open_from}
                      onChange={e => setSettings({ ...settings, open_from: e.target.value })} className="input" />
                    <p className="text-xs text-gray-400 mt-1">Früheste Bestellzeit</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>LIEFERUNG BIS</label>
                    <input type="time" value={settings.open_until}
                      onChange={e => setSettings({ ...settings, open_until: e.target.value })} className="input" />
                    <p className="text-xs text-gray-400 mt-1">Letzte Bestellzeit</p>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: '#f9f8f4' }}>
                  <span className="text-2xl">🕐</span>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#4a5d54' }}>Aktuelle Lieferzeiten</div>
                    <div className="text-sm text-gray-500">
                      Täglich <strong>{settings.open_from} – {settings.open_until} Uhr</strong> · Lieferzeit: <strong>{settings.delivery_time}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4 pb-2 border-b" style={{ color: '#4a5d54', borderColor: '#f0ede8' }}>💶 Kosten & Mindestbestellung</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>MINDESTBESTELLWERT (€)</label>
                    <input type="number" step="0.50" value={settings.min_order_value}
                      onChange={e => setSettings({ ...settings, min_order_value: parseFloat(e.target.value) })} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#8da399' }}>LIEFERGEBÜHR (€)</label>
                    <input type="number" step="0.50" value={settings.delivery_fee}
                      onChange={e => setSettings({ ...settings, delivery_fee: parseFloat(e.target.value) })} className="input" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4 pb-2 border-b" style={{ color: '#4a5d54', borderColor: '#f0ede8' }}>🟢 Shop Status</h3>
                <div className="flex items-center gap-6">
                  <select value={settings.is_open ? 'open' : 'closed'}
                    onChange={e => setSettings({ ...settings, is_open: e.target.value === 'open' })}
                    className="input" style={{ maxWidth: '250px' }}>
                    <option value="open">🟢 Geöffnet</option>
                    <option value="closed">🔴 Geschlossen</option>
                  </select>
                  <p className="text-sm text-gray-400">
                    {settings.is_open ? 'Kunden können jetzt bestellen' : 'Keine Bestellungen möglich'}
                  </p>
                </div>
              </div>
              <button type="submit" className="px-8 py-3 rounded-xl font-bold text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: '#4a5d54' }}>💾 Alle Einstellungen speichern</button>
            </form>
          </div>
        )}
      </div>

      {saveMsg && (
        <div className="fixed bottom-6 right-6 px-6 py-4 rounded-xl text-white font-bold shadow-2xl animate-fade-in" style={{ backgroundColor: '#4a5d54' }}>
          {saveMsg}
        </div>
      )}
    </div>
  )
}