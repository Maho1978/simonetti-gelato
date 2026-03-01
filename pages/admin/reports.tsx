import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Download, TrendingUp, Euro, ShoppingBag, Users, ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface Order {
  id: string
  created_at: string
  total: number
  status: string
  items: any[]
  user_id: string | null
  email: string
  order_type?: string
}

const COLORS = ['#4a5d54', '#8da399', '#c4a882', '#e8b89a', '#f0d4c0', '#b8cfc9']

const RANGE_OPTIONS = [
  { key: 'today',  label: 'Heute' },
  { key: 'week',   label: '7 Tage' },
  { key: 'month',  label: '30 Tage' },
  { key: 'year',   label: '12 Monate' },
]

function StatCard({ icon, label, value, sub, trend }: { icon: React.ReactNode; label: string; value: string; sub?: string; trend?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 bg-gray-50 rounded-xl">{icon}</div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : trend < 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
            {trend > 0 ? <ArrowUp size={10} /> : trend < 0 ? <ArrowDown size={10} /> : <Minus size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-300 mt-0.5">{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-800 mb-4">{children}</h2>
}

export default function Reports({ session }: { session: Session | null }) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [prevOrders, setPrevOrders] = useState<Order[]>([])
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'year'>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { router.push('/auth/login?redirect=/admin/reports'); return }
    fetchOrders()
  }, [session, range])

  const getDateRange = (r: string, offset = 0) => {
    const now = new Date()
    let start = new Date(), end = new Date()
    if (r === 'today') {
      start = new Date(now); start.setHours(0,0,0,0)
      end   = new Date(now); end.setHours(23,59,59,999)
      if (offset) { start.setDate(start.getDate()-1); end.setDate(end.getDate()-1) }
    } else if (r === 'week') {
      start = new Date(now); start.setDate(now.getDate() - 7 * (offset+1))
      end   = new Date(now); end.setDate(now.getDate() - 7 * offset)
    } else if (r === 'month') {
      start = new Date(now); start.setDate(now.getDate() - 30 * (offset+1))
      end   = new Date(now); end.setDate(now.getDate() - 30 * offset)
    } else {
      start = new Date(now); start.setMonth(now.getMonth() - 12 * (offset+1))
      end   = new Date(now); end.setMonth(now.getMonth() - 12 * offset)
    }
    return { start, end }
  }

  const fetchOrders = async () => {
    setLoading(true)
    const { start, end } = getDateRange(range)
    const { start: ps, end: pe } = getDateRange(range, 1)

    const [curr, prev] = await Promise.all([
      supabase.from('orders').select('*').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).order('created_at'),
      supabase.from('orders').select('*').gte('created_at', ps.toISOString()).lte('created_at', pe.toISOString()),
    ])
    if (curr.data) setOrders(curr.data)
    if (prev.data) setPrevOrders(prev.data)
    setLoading(false)
  }

  const exportCSV = () => {
    const rows = [
      ['ID', 'Datum', 'Uhrzeit', 'Gesamt', 'Status', 'Typ', 'Email'],
      ...orders.map(o => {
        const d = new Date(o.created_at)
        return [o.id.slice(0,8), d.toLocaleDateString('de'), d.toLocaleTimeString('de',{hour:'2-digit',minute:'2-digit'}), o.total.toFixed(2), o.status, o.order_type || 'lieferung', o.email]
      })
    ]
    const blob = new Blob([rows.map(r => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `simonetti-report-${new Date().toLocaleDateString('de').replace(/\./g,'-')}.csv`
    a.click()
  }

  // ── Berechnungen ─────────────────────────────────────────────────────────────
  const revenue     = useMemo(() => orders.reduce((s,o) => s + o.total, 0), [orders])
  const prevRevenue = useMemo(() => prevOrders.reduce((s,o) => s + o.total, 0), [prevOrders])
  const revTrend    = prevRevenue > 0 ? Math.round((revenue - prevRevenue) / prevRevenue * 100) : 0

  const avgOrder    = orders.length ? revenue / orders.length : 0
  const prevAvg     = prevOrders.length ? prevRevenue / prevOrders.length : 0
  const avgTrend    = prevAvg > 0 ? Math.round((avgOrder - prevAvg) / prevAvg * 100) : 0

  const uniqueCustomers    = useMemo(() => new Set(orders.map(o => o.email)).size, [orders])
  const prevUniqueCustomers= useMemo(() => new Set(prevOrders.map(o => o.email)).size, [prevOrders])
  const custTrend          = prevUniqueCustomers > 0 ? Math.round((uniqueCustomers - prevUniqueCustomers) / prevUniqueCustomers * 100) : 0

  const orderTrend = prevOrders.length > 0 ? Math.round((orders.length - prevOrders.length) / prevOrders.length * 100) : 0

  // Neue vs Stammkunden
  const allPrevEmails = useMemo(async () => {
    const { data } = await supabase.from('orders').select('email').lt('created_at', getDateRange(range).start.toISOString())
    return new Set((data || []).map((o: any) => o.email))
  }, [range])

  const [knownEmails, setKnownEmails] = useState<Set<string>>(new Set())
  useEffect(() => {
    supabase.from('orders').select('email').lt('created_at', getDateRange(range).start.toISOString()).then(({ data }) => {
      setKnownEmails(new Set((data || []).map((o: any) => o.email)))
    })
  }, [range])

  const neukunden     = orders.filter(o => !knownEmails.has(o.email))
  const stammkunden   = orders.filter(o => knownEmails.has(o.email))
  const neukundenRate = orders.length ? Math.round(neukunden.length / orders.length * 100) : 0

  // Umsatz-Verlauf Chart
  const revenueChart = useMemo(() => {
    const map: Record<string, number> = {}
    orders.forEach(o => {
      const d = new Date(o.created_at)
      const key = range === 'year'
        ? d.toLocaleDateString('de', { month: 'short', year: '2-digit' })
        : d.toLocaleDateString('de', { day: '2-digit', month: '2-digit' })
      map[key] = (map[key] || 0) + o.total
    })
    return Object.entries(map).map(([date, umsatz]) => ({ date, umsatz: parseFloat(umsatz.toFixed(2)) }))
  }, [orders, range])

  // Top Produkte
  const topProducts = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {}
    orders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        const name = item.name || item.product_name || 'Unbekannt'
        if (!map[name]) map[name] = { count: 0, revenue: 0 }
        map[name].count   += item.quantity || 1
        map[name].revenue += (item.price || 0) * (item.quantity || 1)
      })
    })
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, revenue: parseFloat(v.revenue.toFixed(2)) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [orders])

  // Bestellzeiten Heatmap (Stunden 0-23)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, count: 0 }))
    orders.forEach(o => {
      const h = new Date(o.created_at).getHours()
      hours[h].count++
    })
    return hours
  }, [orders])

  const maxHourCount = Math.max(...hourlyData.map(h => h.count), 1)

  // Wochentage
  const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const weekdayData = useMemo(() => {
    const days = DAYS.map(d => ({ day: d, count: 0, umsatz: 0 }))
    orders.forEach(o => {
      const d = new Date(o.created_at).getDay()
      days[d].count++
      days[d].umsatz = parseFloat((days[d].umsatz + o.total).toFixed(2))
    })
    return days
  }, [orders])

  // Lieferung vs Abholung
  const orderTypeData = useMemo(() => {
    const delivery = orders.filter(o => !o.order_type || o.order_type === 'delivery').length
    const pickup   = orders.filter(o => o.order_type === 'pickup').length
    return [
      { name: 'Lieferung', value: delivery },
      { name: 'Abholung',  value: pickup },
    ].filter(d => d.value > 0)
  }, [orders])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#4a5d54] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Daten werden geladen...</p>
      </div>
    </div>
  )

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
<h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-400 text-sm mt-0.5">Eiscafé Simonetti · Bestellstatistiken</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              {RANGE_OPTIONS.map(r => (
                <button key={r.key} onClick={() => setRange(r.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${range === r.key ? 'bg-[#4a5d54] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              <Download size={16} /> CSV
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Euro size={20} className="text-[#4a5d54]" />} label="Umsatz" value={`${revenue.toFixed(2)} €`} trend={revTrend} />
          <StatCard icon={<ShoppingBag size={20} className="text-[#4a5d54]" />} label="Bestellungen" value={orders.length.toString()} trend={orderTrend} />
          <StatCard icon={<TrendingUp size={20} className="text-[#4a5d54]" />} label="Ø Bestellwert" value={`${avgOrder.toFixed(2)} €`} trend={avgTrend} />
          <StatCard icon={<Users size={20} className="text-[#4a5d54]" />} label="Kunden" value={uniqueCustomers.toString()} trend={custTrend} />
        </div>

        {/* Umsatz-Verlauf */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <SectionTitle>📈 Umsatz-Verlauf</SectionTitle>
          {revenueChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Keine Daten im gewählten Zeitraum</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${v}€`} />
                <Tooltip formatter={(v: any) => [`${v} €`, 'Umsatz']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
                <Line type="monotone" dataKey="umsatz" stroke="#4a5d54" strokeWidth={2.5} dot={{ r: 3, fill: '#4a5d54' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* Top Produkte */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionTitle>🍦 Top Produkte</SectionTitle>
            {topProducts.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Keine Daten</div>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs text-gray-300 font-bold text-right">{i+1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-sm font-semibold text-gray-700 truncate max-w-[180px]">{p.name}</span>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{p.count}× · {p.revenue.toFixed(2)} €</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4a5d54] rounded-full transition-all" style={{ width: `${(p.count / topProducts[0].count) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Neukunden vs Stammkunden */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionTitle>👥 Neukunden vs. Stammkunden</SectionTitle>
            <div className="flex items-center justify-center gap-8 mb-5">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#4a5d54]">{neukunden.length}</div>
                <div className="text-xs text-gray-400 mt-0.5">Neukunden</div>
                <div className="text-xs font-semibold text-[#4a5d54] mt-0.5">{neukundenRate}%</div>
              </div>
              <div className="w-px h-12 bg-gray-100" />
              <div className="text-center">
                <div className="text-3xl font-bold text-[#8da399]">{stammkunden.length}</div>
                <div className="text-xs text-gray-400 mt-0.5">Stammkunden</div>
                <div className="text-xs font-semibold text-[#8da399] mt-0.5">{100-neukundenRate}%</div>
              </div>
            </div>
            {orderTypeData.length > 0 && (
              <>
                <div className="border-t border-gray-100 pt-4 mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Bestelltyp</p>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={orderTypeData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3}>
                      {orderTypeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#6b7280' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>

        {/* Heatmap Bestellzeiten */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <SectionTitle>🕐 Beste Bestellzeiten</SectionTitle>
          <div className="flex gap-1 items-end h-20 mb-2">
            {hourlyData.map((h, i) => {
              const intensity = h.count / maxHourCount
              const isPeak = intensity >= 0.7
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={`w-full rounded-t transition-all ${intensity === 0 ? 'bg-gray-100' : isPeak ? 'bg-[#4a5d54]' : 'bg-[#8da399]'}`}
                    style={{ height: `${Math.max(4, intensity * 64)}px`, opacity: intensity === 0 ? 0.3 : 0.6 + intensity * 0.4 }}
                  />
                  {h.count > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      {h.count}×
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex gap-1">
            {hourlyData.map((h, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-gray-300">
                {i % 3 === 0 ? `${i}h` : ''}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#4a5d54] rounded-sm inline-block" /> Peak</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#8da399] rounded-sm inline-block" /> Aktiv</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded-sm inline-block" /> Ruhig</span>
          </div>
        </div>

        {/* Wochentage */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle>📅 Bestellungen nach Wochentag</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekdayData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                formatter={(v: any, name: string) => [name === 'count' ? `${v} Bestellungen` : `${v} €`, name === 'count' ? 'Bestellungen' : 'Umsatz']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="count" fill="#4a5d54" radius={[6,6,0,0]} name="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
    </AdminLayout>
  )
}