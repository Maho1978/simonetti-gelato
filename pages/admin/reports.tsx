import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import { Download, TrendingUp, Euro, ShoppingBag, Calendar } from 'lucide-react'

interface Order {
  id: string
  created_at: string
  total: number
  status: string
  items: any[]
  payment_method?: string
}

function ReportsContent() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchOrders()
  }, [timeRange])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login?redirect=/admin/reports')
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const { data } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (data) setOrders(data)
    setLoading(false)
  }

  // Statistiken berechnen
  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
    completedOrders: orders.filter(o => o.status === 'GELIEFERT').length,
  }

  // Umsatz pro Tag
  const dailyRevenue = () => {
    const grouped: { [key: string]: number } = {}
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('de-DE')
      grouped[date] = (grouped[date] || 0) + order.total
    })
    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }))
  }

  // Bestseller
  const getBestsellers = () => {
    const products: { [key: string]: { count: number; revenue: number } } = {}
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        if (!products[item.name]) {
          products[item.name] = { count: 0, revenue: 0 }
        }
        products[item.name].count += item.quantity
        products[item.name].revenue += item.price * item.quantity
      })
    })
    return Object.entries(products)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  // Bestellungen pro Stunde
  const ordersByHour = () => {
    const hours: { [key: number]: number } = {}
    for (let i = 0; i < 24; i++) hours[i] = 0
    
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours()
      hours[hour]++
    })
    
    return Object.entries(hours).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count
    }))
  }

  // Status-Verteilung
  const statusDistribution = () => {
    const statuses: { [key: string]: number } = {}
    orders.forEach(order => {
      statuses[order.status] = (statuses[order.status] || 0) + 1
    })
    return Object.entries(statuses).map(([status, count]) => ({ status, count }))
  }

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Datum', 'Bestellnummer', 'Gesamt', 'Status', 'Artikel', 'Zahlungsart']
    const rows = orders.map(o => [
      new Date(o.created_at).toLocaleString('de-DE'),
      o.id.slice(-6),
      o.total.toFixed(2),
      o.status,
      o.items?.map((i: any) => `${i.quantity}x ${i.name}`).join('; ') || '',
      o.payment_method || 'N/A'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `simonetti-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const COLORS = ['#4a5d54', '#8da399', '#f39c12', '#e74c3c', '#3498db']

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-4 animate-bounce">📊</div>
        <p className="text-gray-500 italic">Lade Berichte...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold italic text-[#4a5d54]">Umsatz-Reports</h1>
          <p className="text-gray-500">Analysen für dein Business</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-6 py-3 bg-[#4a5d54] text-white rounded-xl font-bold hover:opacity-90 transition"
        >
          <Download size={20} /> CSV Export
        </button>
      </div>

      {/* Range Selector */}
      <div className="flex gap-2 mb-8">
        {(['day', 'week', 'month', 'year'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              timeRange === range ? 'bg-[#4a5d54] text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Euro className="text-blue-500" />
            <span className="text-sm text-gray-500">Umsatz</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} €</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="text-green-500" />
            <span className="text-sm text-gray-500">Bestellungen</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-orange-500" />
            <span className="text-sm text-gray-500">Ø Wert</span>
          </div>
          <div className="text-2xl font-bold">{stats.avgOrderValue.toFixed(2)} €</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-purple-500" />
            <span className="text-sm text-gray-500">Geliefert</span>
          </div>
          <div className="text-2xl font-bold">{stats.completedOrders}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-4">Umsatz-Verlauf</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRevenue()}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#4a5d54" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-4">Bestellungen nach Uhrzeit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByHour()}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="hour" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#8da399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-4">Top 10 Produkte</h3>
          <div className="space-y-3">
            {getBestsellers().map((product, i) => (
              <div key={product.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-sm">{i + 1}. {product.name}</span>
                <span className="font-bold">{product.revenue.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-4">Status-Verteilung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution()}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ status }) => status}
              >
                {statusDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <AdminLayout>
      <ReportsContent />
    </AdminLayout>
  )
}