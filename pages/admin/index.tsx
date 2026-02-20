import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'
import { 
  Edit2, Trash2, ToggleLeft, ToggleRight, CreditCard, ShoppingBag, 
  X, Package, ChevronDown, ChevronUp, Plus, BarChart3, Ticket, 
  Calendar, LayoutGrid, Settings, Star, Layers, Clock
} from 'lucide-react'

interface Product {
  id: string; name: string; description: string; price: number
  category: string; icon: string; available: boolean; featured: boolean
  allergens: string[] | null; image_url: string | null; scoop_count: number
}
interface Order {
  id: string; order_number: string; created_at: string; items: any[]
  total: number; status: string; delivery_address: any
  guest_email?: string; payment_method: string; notes?: string
}
interface Feature { id: string; name: string; description: string; enabled: boolean }
interface ShopSettings { 
  delivery_time: string; min_order_value: number; delivery_fee: number
  is_open: boolean; open_from: string; open_until: string
}
interface GlobalExtra {
  id: string; name: string; price: number; icon: string
  sort_order: number; available: boolean; categories: string[]
}

const COLS = [
  { title: 'Eingegangen',  status: 'OFFEN',          color: '#e74c3c', next: 'IN_BEARBEITUNG', btn: '▶ VORBEREITEN', emoji: '🆕' },
  { title: 'Zubereitung',  status: 'IN_BEARBEITUNG', color: '#f39c12', next: 'AN_FAHRER',      btn: '🛵 AN FAHRER',  emoji: '👨‍🍳' },
  { title: 'An Fahrer',    status: 'AN_FAHRER',      color: '#3498db', next: 'GELIEFERT',       btn: '✅ GELIEFERT',   emoji: '🛵' },
  { title: 'Geliefert',    status: 'GELIEFERT',      color: '#27ae60', next: null,               btn: null,            emoji: '✅' },
]

const ALLERGEN_OPTIONS = [
  'Gluten', 'Krebstiere', 'Eier', 'Fisch', 'Erdnüsse', 'Soja', 
  'Laktose', 'Schalenfrüchte', 'Sellerie', 'Senf', 'Sesam', 
  'Schwefeldioxid', 'Lupinen', 'Weichtiere'
]

const CATEGORY_OPTIONS = [
  'Eis', 'Sorbet', 'Eisportionen', 'Eisbecher', 
  'Spezialitäten', 'Getränke', 'Waffeln'
]

export default function Admin({ session }: { session: Session | null }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'extras' | 'features' | 'settings'>('orders')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [globalExtras, setGlobalExtras] = useState<GlobalExtra[]>([])
  const [settings, setSettings] = useState<ShopSettings>({
    delivery_time: '30-45 Min.', min_order_value: 15, delivery_fee: 3,
    is_open: true, open_from: '14:00', open_until: '22:00'
  })
  
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingExtra, setEditingExtra] = useState<GlobalExtra | null>(null)
  const [saveMsg, setSaveMsg] = useState('')
  const [newOrderPopup, setNewOrderPopup] = useState<Order | null>(null)
  const [allergensOpen, setAllergensOpen] = useState(false)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: 'Eis', icon: '🍦',
    available: true, featured: false, scoop_count: 0, image_url: ''
  })
  
  const [extraFormData, setExtraFormData] = useState({
    name: '', price: '', icon: '➕', categories: [] as string[]
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
    await Promise.all([
      fetchProducts(), 
      fetchOrders(), 
      fetchFeatures(), 
      fetchSettings(),
      fetchGlobalExtras()
    ])
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

  const fetchGlobalExtras = async () => {
    const { data } = await supabase.from('global_extras').select('*').order('sort_order')
    if (data) setGlobalExtras(data)
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
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    )
  }

  const toggleExtraCategory = (category: string) => {
    setExtraFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const productData = { 
      ...formData, 
      price: parseFloat(formData.price),
      allergens: selectedAllergens.length > 0 ? selectedAllergens : null,
      scoop_count: formData.scoop_count
    }
    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id)
    } else {
      await supabase.from('products').insert(productData)
    }
    resetProductForm()
    fetchProducts()
    showMsg('✅ Produkt gespeichert!')
  }

  const handleExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const extraData = {
      name: extraFormData.name,
      price: parseFloat(extraFormData.price),
      icon: extraFormData.icon,
      categories: extraFormData.categories,
      sort_order: globalExtras.length,
      available: true
    }
    if (editingExtra) {
      await supabase.from('global_extras').update(extraData).eq('id', editingExtra.id)
    } else {
      await supabase.from('global_extras').insert(extraData)
    }
    resetExtraForm()
    fetchGlobalExtras()
    showMsg('✅ Extra gespeichert!')
  }

  const handleEditExtra = (extra: GlobalExtra) => {
    setEditingExtra(extra)
    setExtraFormData({
      name: extra.name, price: extra.price.toString(),
      icon: extra.icon, categories: extra.categories || []
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteExtra = async (id: string) => {
    if (!confirm('Extra wirklich löschen?')) return
    await supabase.from('global_extras').delete().eq('id', id)
    fetchGlobalExtras()
    showMsg('✅ Extra gelöscht!')
  }

  const toggleExtraAvailable = async (id: string, current: boolean) => {
    await supabase.from('global_extras').update({ available: !current }).eq('id', id)
    fetchGlobalExtras()
  }

  const resetProductForm = () => {
    setFormData({ 
      name: '', description: '', price: '', category: 'Eis', 
      icon: '🍦', available: true, featured: false, scoop_count: 0, image_url: ''
    })
    setSelectedAllergens([])
    setEditingProduct(null)
    setAllergensOpen(false)
  }

  const resetExtraForm = () => {
    setExtraFormData({ name: '', price: '', icon: '➕', categories: [] })
    setEditingExtra(null)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name, description: product.description, price: product.price.toString(),
      category: product.category, icon: product.icon, available: product.available,
      featured: product.featured, scoop_count: product.scoop_count || 0,
      image_url: product.image_url || ''
    })
    setSelectedAllergens(product.allergens || [])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleAvailable = async (id: string, current: boolean) => {
    await supabase.from('products').update({ available: !current }).eq('id', id)
    fetchProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Produkt wirklich löschen?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const toggleFeature = async (id: string, current: boolean) => {
    await supabase.from('feature_toggles').update({ enabled: !current }).eq('id', id)
    fetchFeatures()
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
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      {saveMsg && (
        <div className="fixed top-24 right-6 z-50 animate-bounce">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border-2 border-[#4a5d54] font-bold text-[#4a5d54]">
            {saveMsg}
          </div>
        </div>
      )}

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
                <div key={i} className="flex justify-between text-sm text-[#4a5d54]">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold" style={{ color: '#4a5d54', borderColor: '#e5e7eb' }}>
                <span>Gesamt</span><span>{Number(newOrderPopup.total).toFixed(2)} €</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { updateOrderStatus(newOrderPopup.id, 'IN_BEARBEITUNG'); setNewOrderPopup(null) }}
                className="flex-1 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: '#4a5d54' }}>▶ ANNEHMEN</button>
              <button onClick={() => setNewOrderPopup(null)}
                className="p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"><X size={22} /></button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-display font-bold italic" style={{ color: '#4a5d54' }}>Simonetti Control</h1>
            <p className="text-lg mt-1" style={{ color: '#8da399' }}>Dashboard & Filialsteuerung</p>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2"
            style={{ 
              backgroundColor: settings.is_open ? '#f0fdf4' : '#fef2f2',
              borderColor: settings.is_open ? '#bcf0da' : '#fecaca' 
            }}>
            <div className={`w-3 h-3 rounded-full ${settings.is_open ? 'animate-pulse' : ''}`} style={{ backgroundColor: settings.is_open ? '#27ae60' : '#e74c3c' }}></div>
            <span className="font-bold text-sm" style={{ color: settings.is_open ? '#27ae60' : '#e74c3c' }}>
              {settings.is_open ? `ONLINE · ${settings.open_from} – ${settings.open_until}` : 'OFFLINE (Geschlossen)'}
            </span>
          </div>
        </div>

        {/* --- NAVIGATION --- */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
          <button onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'orders' ? 'shadow-md scale-105' : 'border-2 border-gray-100'}`}
            style={activeTab === 'orders' ? { backgroundColor: '#4a5d54', color: '#fdfcfb' } : { backgroundColor: 'white', color: '#4a5d54' }}>
            <Package size={18} /> Bestellungen
          </button>
          
          <button onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'products' ? 'shadow-md scale-105' : 'border-2 border-gray-100'}`}
            style={activeTab === 'products' ? { backgroundColor: '#4a5d54', color: '#fdfcfb' } : { backgroundColor: 'white', color: '#4a5d54' }}>
            <Star size={18} /> Produkte
          </button>

          <button onClick={() => router.push('/admin/calendar')}
            className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all bg-white border-2 border-gray-100 text-[#4a5d54] whitespace-nowrap hover:bg-gray-50">
            <Calendar size={18} /> Kalender
          </button>

          <button onClick={() => router.push('/admin/kanban')}
            className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all bg-white border-2 border-gray-100 text-[#4a5d54] whitespace-nowrap hover:bg-gray-50">
            <LayoutGrid size={18} /> Kanban
          </button>

          <button onClick={() => router.push('/admin/reports')}
            className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all bg-white border-2 border-gray-100 text-[#4a5d54] whitespace-nowrap hover:bg-gray-50">
            <BarChart3 size={18} /> Reports
          </button>

          <button onClick={() => router.push('/admin/vouchers')}  
            className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 bg-white border-2 border-gray-100 text-[#4a5d54] whitespace-nowrap hover:shadow-md transition">  
            🎫 Gutscheine verwalten
          </button>

          <button onClick={() => setActiveTab('extras')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'extras' ? 'shadow-md scale-105' : 'border-2 border-gray-100'}`}
            style={activeTab === 'extras' ? { backgroundColor: '#4a5d54', color: '#fdfcfb' } : { backgroundColor: 'white', color: '#4a5d54' }}>
            <Layers size={18} /> Extras
          </button>

          <button onClick={() => setActiveTab('features')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'features' ? 'shadow-md scale-105' : 'border-2 border-gray-100'}`}
            style={activeTab === 'features' ? { backgroundColor: '#4a5d54', color: '#fdfcfb' } : { backgroundColor: 'white', color: '#4a5d54' }}>
            <Clock size={18} /> Features
          </button>

          <button onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'shadow-md scale-105' : 'border-2 border-gray-100'}`}
            style={activeTab === 'settings' ? { backgroundColor: '#4a5d54', color: '#fdfcfb' } : { backgroundColor: 'white', color: '#4a5d54' }}>
            <Settings size={18} /> Setup
          </button>
        </div>

        {/* --- TAB: ORDERS --- */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {COLS.map(col => {
              const colOrders = orders.filter(o => o.status === col.status)
              return (
                <div key={col.status} className="rounded-3xl p-5 min-h-[600px] bg-[#f9f8f4] border border-gray-100">
                  <h3 className="font-bold italic pb-4 mb-5 border-b-2 flex items-center gap-2"
                    style={{ borderColor: col.color, color: '#4a5d54' }}>
                    <span className="text-xl">{col.emoji}</span>
                    <span className="flex-1">{col.title}</span>
                    <span className="bg-white text-xs font-bold px-3 py-1 rounded-full border shadow-sm" style={{ color: col.color }}>
                      {colOrders.length}
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {colOrders.map(order => (
                      <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border-l-8 hover:shadow-md transition-shadow" style={{ borderColor: col.color }}>
                        <div className="flex justify-between font-bold text-sm mb-2 text-[#4a5d54]">
                          <span>#{order.order_number || order.id.slice(-4)}</span>
                          <span className="text-gray-400 font-normal">{new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mb-3 bg-gray-50 p-2 rounded-xl">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-semibold">{Number(item.price).toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                        {order.delivery_address?.street && (
                           <div className="text-[10px] text-gray-500 mb-3 flex items-center gap-1">
                             <span className="grayscale">📍</span> {order.delivery_address.street}, {order.delivery_address.city}
                           </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-dashed">
                          <span className="text-xs uppercase font-bold text-gray-400">{order.payment_method === 'stripe' ? '💳 Paid' : '💵 Cash'}</span>
                          <span className="font-bold text-[#4a5d54]">{Number(order.total).toFixed(2)} €</span>
                        </div>
                        {col.btn && (
                          <button onClick={() => updateOrderStatus(order.id, col.next!)}
                            className="w-full mt-4 py-3 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.02] shadow-sm"
                            style={{ backgroundColor: col.color }}>{col.btn}</button>
                        )}
                      </div>
                    ))}
                    {colOrders.length === 0 && (
                      <div className="text-center py-10 opacity-20 italic text-sm">Keine Bestellungen</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* --- TAB: PRODUCTS --- */}
        {activeTab === 'products' && (
          <div className="space-y-10 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-display font-bold italic text-[#4a5d54]">
                  {editingProduct ? '✏️ Produkt anpassen' : '➕ Neues Produkt anlegen'}
                </h2>
                {editingProduct && (
                  <button onClick={resetProductForm} className="text-sm font-bold text-red-500 underline">Abbrechen</button>
                )}
              </div>
              
              <form onSubmit={handleProductSubmit} className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 ml-2">PRODUKTNAME</label>
                      <input type="text" placeholder="z.B. Vanille Traum" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none focus:ring-2 ring-[#4a5d54]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 ml-2">PREIS (€)</label>
                      <input type="number" step="0.10" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none focus:ring-2 ring-[#4a5d54]" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-2">BESCHREIBUNG</label>
                    <textarea placeholder="Was macht dieses Produkt besonders?" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none focus:ring-2 ring-[#4a5d54] h-24 resize-none" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 ml-2">KATEGORIE</label>
                      <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none font-bold text-[#4a5d54]">
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 ml-2">ICON</label>
                      <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="w-full p-4 bg-[#f9f8f4] rounded-2xl text-center text-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 ml-2">KUGEL-ANZAHL</label>
                      <input type="number" value={formData.scoop_count} onChange={e => setFormData({ ...formData, scoop_count: parseInt(e.target.value) })} className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none" />
                    </div>
                  </div>

                  <div className="p-4 bg-[#fdfcfb] border rounded-2xl space-y-3">
                    <label className="text-xs font-bold text-gray-400 block">ALLERGENE & INFOS</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGEN_OPTIONS.map(a => (
                        <button key={a} type="button" onClick={() => toggleAllergen(a)} 
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${selectedAllergens.includes(a) ? 'bg-[#4a5d54] text-white border-[#4a5d54]' : 'bg-white text-gray-400 border-gray-100'}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-2">PRODUKTBILD</label>
                    <ImageUpload currentImageUrl={formData.image_url} onImageUploaded={url => setFormData({ ...formData, image_url: url })} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#f9f8f4] rounded-2xl">
                    <span className="font-bold text-sm text-[#4a5d54]">Hervorgehoben (Favorit)</span>
                    <button type="button" onClick={() => setFormData({...formData, featured: !formData.featured})}>
                      {formData.featured ? <ToggleRight size={36} className="text-amber-500" /> : <ToggleLeft size={36} className="text-gray-300" />}
                    </button>
                  </div>

                  <button type="submit" className="w-full py-5 rounded-2xl bg-[#4a5d54] text-white font-bold text-lg hover:shadow-lg transition-all active:scale-95">
                    {editingProduct ? 'Änderungen speichern' : 'Produkt veröffentlichen'}
                  </button>
                </div>
              </form>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-3xl flex items-center gap-4 shadow-sm group hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                  <div className="w-16 h-16 rounded-2xl bg-[#f9f8f4] flex items-center justify-center text-3xl">
                    {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded-2xl" /> : p.icon}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-[#4a5d54] truncate">{p.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category}</p>
                    <p className="text-sm font-bold text-[#8da399]">{Number(p.price).toFixed(2)} €</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => toggleAvailable(p.id, p.available)} className="transition-transform active:scale-75">
                      {p.available ? <ToggleRight size={28} className="text-[#27ae60]" /> : <ToggleLeft size={28} className="text-gray-300" />}
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(p)} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-[#4a5d54]"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: EXTRAS --- */}
        {activeTab === 'extras' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-display font-bold italic mb-8 text-[#4a5d54]">
                {editingExtra ? '✏️ Extra bearbeiten' : '➕ Neues Extra hinzufügen'}
              </h2>
              <form onSubmit={handleExtraSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400">BEZEICHNUNG</label>
                    <input type="text" placeholder="z.B. Sahne" value={extraFormData.name} onChange={e => setExtraFormData({ ...extraFormData, name: e.target.value })} required className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400">AUFPREIS (€)</label>
                    <input type="number" step="0.10" placeholder="0.50" value={extraFormData.price} onChange={e => setExtraFormData({ ...extraFormData, price: e.target.value })} required className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400">SYMBOL</label>
                    <input type="text" value={extraFormData.icon} onChange={e => setExtraFormData({ ...extraFormData, icon: e.target.value })} className="w-full p-4 bg-[#f9f8f4] rounded-2xl text-center text-xl" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400">VERFÜGBAR FÜR KATEGORIEN</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map(c => (
                      <button key={c} type="button" onClick={() => toggleExtraCategory(c)} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${extraFormData.categories.includes(c) ? 'bg-[#8da399] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-[#4a5d54] text-white font-bold rounded-2xl shadow-lg hover:opacity-90">Extra Speichern</button>
                  {editingExtra && <button type="button" onClick={resetExtraForm} className="px-8 py-4 bg-gray-100 rounded-2xl font-bold text-gray-500">Abbruch</button>}
                </div>
              </form>
            </div>

            <div className="grid gap-3">
              {globalExtras.map(ex => (
                <div key={ex.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-transparent hover:border-gray-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#f9f8f4] rounded-xl flex items-center justify-center text-2xl">{ex.icon}</div>
                    <div>
                      <div className="font-bold text-[#4a5d54]">{ex.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{ex.categories?.join(' • ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-[#8da399]">+{Number(ex.price).toFixed(2)} €</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditExtra(ex)} className="p-2 text-gray-300 hover:text-[#4a5d54] transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteExtra(ex.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      <button onClick={() => toggleExtraAvailable(ex.id, ex.available)} className="ml-2">
                        {ex.available ? <ToggleRight size={36} className="text-[#27ae60]" /> : <ToggleLeft size={36} className="text-gray-200" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: FEATURES --- */}
        {activeTab === 'features' && (
          <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
            <div className="bg-[#f9f8f4] p-6 rounded-3xl mb-8">
              <h2 className="font-display font-bold italic text-2xl text-[#4a5d54] mb-2">Funktionen & Module</h2>
              <p className="text-sm text-[#8da399]">Schalte hier spezielle Shop-Funktionen in Echtzeit an oder aus.</p>
            </div>
            {features.map(f => (
              <div key={f.id} className="bg-white p-6 rounded-3xl flex items-center justify-between shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-bold text-lg text-[#4a5d54]">{f.name}</h3>
                  <p className="text-sm text-gray-400 max-w-md">{f.description}</p>
                </div>
                <button onClick={() => toggleFeature(f.id, f.enabled)} className="transition-transform active:scale-90">
                  {f.enabled ? <ToggleRight size={50} className="text-[#27ae60]" /> : <ToggleLeft size={50} className="text-gray-200" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB: SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 animate-fade-in">
            <div className="text-center mb-10">
              <div className="inline-block p-4 bg-[#f9f8f4] rounded-full mb-4">
                <Settings size={32} className="text-[#4a5d54]" />
              </div>
              <h2 className="text-3xl font-display font-bold italic text-[#4a5d54]">Shop Konfiguration</h2>
            </div>
            
            <form onSubmit={saveSettings} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">ø Lieferzeit</label>
                  <input type="text" value={settings.delivery_time} onChange={e => setSettings({...settings, delivery_time: e.target.value})} className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none font-bold text-[#4a5d54]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Min. Bestellwert (€)</label>
                  <input type="number" value={settings.min_order_value} onChange={e => setSettings({...settings, min_order_value: Number(e.target.value)})} className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none font-bold text-[#4a5d54]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Öffnung</label>
                  <input type="time" value={settings.open_from} onChange={e => setSettings({...settings, open_from: e.target.value})} className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Schließung</label>
                  <input type="time" value={settings.open_until} onChange={e => setSettings({...settings, open_until: e.target.value})} className="w-full p-4 bg-[#f9f8f4] rounded-2xl border-none font-bold" />
                </div>
              </div>

              <div className="p-6 bg-[#f9f8f4] rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#4a5d54]">Live Status</div>
                  <div className="text-xs text-gray-400">Schaltet den Shop sofort offline/online</div>
                </div>
                <button type="button" onClick={() => setSettings({...settings, is_open: !settings.is_open})} className="transition-transform active:scale-90">
                  {settings.is_open ? <ToggleRight size={54} className="text-[#27ae60]" /> : <ToggleLeft size={54} className="text-gray-200" />}
                </button>
              </div>

              <button type="submit" className="w-full py-5 bg-[#4a5d54] text-white font-bold rounded-2xl text-lg shadow-xl hover:opacity-90 transition-all active:scale-[0.98]">
                Konfiguration speichern
              </button>
            </form>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md py-3 px-6 border-t flex justify-center gap-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-40">
        <span>© {new Date().getFullYear()} Simonetti Gelateria</span>
        <span className="text-[#4a5d54]">Admin Engine v2.4.0</span>
        <span className={settings.is_open ? 'text-[#27ae60]' : 'text-red-400'}>{settings.is_open ? 'System Online' : 'System Offline'}</span>
      </div>
    </div>
  )
}