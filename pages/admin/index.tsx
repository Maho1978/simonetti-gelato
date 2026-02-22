import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/router'
import { ShoppingBag, Package, Euro, Clock, TrendingUp, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OFFEN:          { label: 'Offen',          color: 'bg-red-100 text-red-700'       },
  IN_BEARBEITUNG: { label: 'In Bearbeitung', color: 'bg-yellow-100 text-yellow-700' },
  AN_FAHRER:      { label: 'An Fahrer',      color: 'bg-blue-100 text-blue-700'     },
  GELIEFERT:      { label: 'Geliefert',      color: 'bg-green-100 text-green-700'   },
  ABGELEHNT:      { label: 'Abgelehnt',      color: 'bg-gray-100 text-gray-500'     },
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    todayOrders: 0, todayRevenue: 0,
    totalProducts: 0, pendingOrders: 0,
    weekRevenue: 0, deliveredToday: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    loadDashboard()
    const h = new Date().getHours()
    setGreeting(h < 11 ? 'Guten Morgen' : h < 17 ? 'Guten Tag' : 'Guten Abend')
  }, [])

  const loadDashboard = async () => {
    const today   = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [ordersRes, productsRes, pendingRes, weekRes] = await Promise.all([
      supabase.from('orders').select('*').gte('created_at', today),
      supabase.from('products').select('id'),
      supabase.from('orders').select('id').in('status', ['OFFEN', 'IN_BEARBEITUNG']),
      supabase.from('orders').select('total').gte('created_at', weekAgo).eq('status', 'GELIEFERT'),
    ])

    const todayOrders = ordersRes.data || []
    const delivered   = todayOrders.filter(o => o.status === 'GELIEFERT')

    setStats({
      todayOrders:    todayOrders.length,
      todayRevenue:   todayOrders.reduce((s, o) => s + (o.total || 0), 0),
      totalProducts:  productsRes.data?.length || 0,
      pendingOrders:  pendingRes.data?.length || 0,
      weekRevenue:    weekRes.data?.reduce((s, o) => s + (o.total || 0), 0) || 0,
      deliveredToday: delivered.length,
    })

    const { data: recent } = await supabase
      .from('orders').select('*').order('created_at', { ascending: false }).limit(8)
    if (recent) setRecentOrders(recent)
    setLoading(false)
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{greeting}! 👋</h1>
          <p className="text-gray-400 mt-1">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bestellungen heute</span>
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <ShoppingBag size={18} className="text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.todayOrders}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.deliveredToday} geliefert</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Umsatz heute</span>
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Euro size={18} className="text-green-500" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.todayRevenue.toFixed(2)} €</div>
            <div className="text-xs text-gray-400 mt-1">Diese Woche: {stats.weekRevenue.toFixed(2)} €</div>
          </div>

          <div className={`bg-white rounded-2xl border p-5 shadow-sm ${stats.pendingOrders > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${stats.pendingOrders > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                Offen / In Bearb.
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stats.pendingOrders > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
                <Clock size={18} className={stats.pendingOrders > 0 ? 'text-red-500' : 'text-gray-400'} />
              </div>
            </div>
            <div className={`text-3xl font-black ${stats.pendingOrders > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats.pendingOrders}
            </div>
            {stats.pendingOrders > 0
              ? <Link href="/admin/kanban" className="text-xs text-red-500 font-semibold mt-1 block hover:underline">→ Jetzt bearbeiten</Link>
              : <div className="text-xs text-gray-400 mt-1">Alles erledigt ✅</div>
            }
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Produkte</span>
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.totalProducts}</div>
            <Link href="/admin/products" className="text-xs text-gray-400 mt-1 block hover:text-gray-600 hover:underline">→ Verwalten</Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wochenumsatz</span>
              <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-yellow-500" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.weekRevenue.toFixed(0)} €</div>
            <div className="text-xs text-gray-400 mt-1">Letzte 7 Tage (geliefert)</div>
          </div>

          {/* Schnellzugriff Kanban */}
          <div onClick={() => router.push('/admin/kanban')}
            className="bg-gray-900 rounded-2xl p-5 shadow-sm cursor-pointer hover:bg-gray-800 transition group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kanban Board</span>
              <div className="w-9 h-9 bg-gray-700 rounded-xl flex items-center justify-center">
                <Zap size={18} className="text-yellow-400" />
              </div>
            </div>
            <div className="text-white font-black text-lg">Bestellungen</div>
            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1 group-hover:text-gray-300">
              <span>Öffnen</span><ChevronRight size={12} />
            </div>
          </div>

        </div>

        {/* ── Letzte Bestellungen ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-lg">Letzte Bestellungen</h2>
            <Link href="/admin/kanban" className="text-sm text-blue-600 hover:underline font-semibold">Alle ansehen →</Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3 animate-pulse">🍦</div>
              <div className="text-sm">Lädt...</div>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <div className="text-sm">Noch keine Bestellungen</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order: any) => {
                const cfg    = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-500' }
                const isToday = new Date(order.created_at).toDateString() === new Date().toDateString()
                const time   = new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                const date   = new Date(order.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                return (
                  <div key={order.id} onClick={() => router.push('/admin/kanban')}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">#{order.order_number || order.id.slice(-6).toUpperCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <div className="text-sm text-gray-500 truncate mt-0.5">{order.customer_name || 'Gast'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900">{(order.total || 0).toFixed(2)} €</div>
                      <div className="text-xs text-gray-400">{isToday ? time + ' Uhr' : date + ' ' + time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}