import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/router'
import { ShoppingBag, Package, Euro, TrendingUp } from 'lucide-react'

function DashboardContent() {
  const router = useRouter()
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    // Stats
    const today = new Date().toISOString().split('T')[0]
    
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', today)
    
    const { data: products } = await supabase
      .from('products')
      .select('id')
    
    const { data: pending } = await supabase
      .from('orders')
      .select('id')
      .in('status', ['OFFEN', 'IN_BEARBEITUNG'])
    
    setStats({
      todayOrders: orders?.length || 0,
      todayRevenue: orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0,
      totalProducts: products?.length || 0,
      pendingOrders: pending?.length || 0
    })

    // Recent Orders
    const { data: recent } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recent) setRecentOrders(recent)
    setLoading(false)
  }

  const statusColors = {
    OFFEN: 'bg-red-100 text-red-700',
    IN_BEARBEITUNG: 'bg-yellow-100 text-yellow-700',
    AN_FAHRER: 'bg-blue-100 text-blue-700',
    GELIEFERT: 'bg-green-100 text-green-700'
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold italic mb-2">Dashboard</h1>
          <p className="text-gray-600">Übersicht deines Shops</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Bestellungen heute</span>
              <ShoppingBag size={20} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{stats.todayOrders}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Umsatz heute</span>
              <Euro size={20} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{stats.todayRevenue.toFixed(2)} €</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Produkte</span>
              <Package size={20} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Offene Bestellungen</span>
              <TrendingUp size={20} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Letzte Bestellungen</h2>
            <button
              onClick={() => router.push('/admin/kanban')}
              className="text-sm text-blue-600 hover:underline"
            >
              Alle ansehen →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Lädt...</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Noch keine Bestellungen</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => router.push('/admin/kanban')}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                >
                  <div>
                    <div className="font-semibold">#{order.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-600">{order.customer_name || 'Gast'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{order.total.toFixed(2)} €</div>
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {order.status}
                    </span>
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

export default function AdminPage() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  )
}