import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, TrendingUp, Euro, ShoppingBag, Calendar, ChevronLeft } from 'lucide-react'

interface Order {
  id: string
  created_at: string
  total: number
  status: string
  items: any[]
}

export default function Reports({ session }: { session: Session | null }) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/admin/reports')
      return
    }
    fetchOrders()
  }, [session, timeRange])

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdfcfb' }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📊</div>
          <div className="font-display italic text-xl" style={{ color: '#4a5d54' }}>Lade Reports...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <button 
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-[#8da399] font-bold text-sm mb-6 hover:text-[#4a5d54] transition"
        >
          <ChevronLeft size={18} /> ZURÜCK ZUM ADMIN
        </button>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-5xl font-display font-bold italic" style={{ color: '#4a5d54' }}>
              Umsatz-Reports
            </h1>
            <p className="text-lg mt-1" style={{ color: '#8da399' }}>
              Detaillierte Analysen & Statistiken
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#4a5d54' }}
          >
            <Download size={20} />
            CSV Export
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-3 mb-8">
          {(['day', 'week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2 rounded-xl font-semibold transition ${
                timeRange === range
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              style={timeRange === range ? { backgroundColor: '#4a5d54' } : {}}
            >
              {range === 'day' && '📅 Heute'}
              {range === 'week' && '📆 Woche'}
              {range === 'month' && '📊 Monat'}
              {range === 'year' && '📈 Jahr'}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#f0f9ff' }}>
                <Euro size={24} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Gesamtumsatz</div>
                <div className="text-3xl font-bold" style={{ color: '#4a5d54' }}>
                  {stats.totalRevenue.toFixed(2)} €
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#f0fdf4' }}>
                <ShoppingBag size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Bestellungen</div>
                <div className="text-3xl font-bold" style={{ color: '#4a5d54' }}>
                  {stats.totalOrders}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#fef3c7' }}>
                <TrendingUp size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Ø Bestellwert</div>
                <div className="text-3xl font-bold" style={{ color: '#4a5d54' }}>
                  {stats.avgOrderValue.toFixed(2)} €
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#e0f2fe' }}>
                <Calendar size={24} style={{ color: '#0ea5e9' }} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Abgeschlossen</div>
                <div className="text-3xl font-bold" style={{ color: '#4a5d54' }}>
                  {stats.completedOrders}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Umsatz pro Tag */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#4a5d54' }}>
              Umsatz-Verlauf
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyRevenue()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#4a5d54" strokeWidth={3} dot={{ fill: '#4a5d54' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bestellungen pro Stunde */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#4a5d54' }}>
              Bestellungen nach Uhrzeit
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersByHour()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8da399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bestseller & Status */}
        <div className="grid grid-cols-2 gap-6">
          {/* Bestseller */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#4a5d54' }}>
              Top 10 Bestseller
            </h3>
            <div className="space-y-3">
              {getBestsellers().map((product, i) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.count}x verkauft</div>
                    </div>
                  </div>
                  <div className="font-bold" style={{ color: '#4a5d54' }}>
                    {product.revenue.toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Verteilung */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#4a5d54' }}>
              Bestellstatus
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
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
    </div>
  )
}