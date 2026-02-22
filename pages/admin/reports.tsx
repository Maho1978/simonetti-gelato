import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { TrendingUp, ShoppingBag, Euro, Users, Download, Calendar } from 'lucide-react'

type Period = 'today' | 'week' | 'month' | 'custom'

interface Stats {
  totalRevenue:   number
  orderCount:     number
  avgOrderValue:  number
  deliveredCount: number
  cancelledCount: number
  topProducts:    { name: string; qty: number; revenue: number }[]
  hourlyData:     { hour: number; orders: number; revenue: number }[]
  dailyData:      { date: string; orders: number; revenue: number }[]
}

function StatCard({ icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>{icon}</div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      <div className="text-sm font-semibold text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

function SimpleBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span className="text-gray-700 truncate max-w-[60%]">{label}</span>
        <span className="text-gray-500">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod]   = useState<Period>('today')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]   = useState('')
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [period, dateFrom, dateTo])

  const getRange = () => {
    const now  = new Date()
    const from = new Date()
    if (period === 'today') {
      from.setHours(0, 0, 0, 0)
      return { from: from.toISOString(), to: now.toISOString() }
    }
    if (period === 'week') {
      from.setDate(now.getDate() - 7)
      return { from: from.toISOString(), to: now.toISOString() }
    }
    if (period === 'month') {
      from.setDate(1); from.setHours(0, 0, 0, 0)
      return { from: from.toISOString(), to: now.toISOString() }
    }
    if (period === 'custom' && dateFrom && dateTo) {
      return { from: new Date(dateFrom).toISOString(), to: new Date(dateTo + 'T23:59:59').toISOString() }
    }
    from.setHours(0, 0, 0, 0)
    return { from: from.toISOString(), to: now.toISOString() }
  }

  const loadStats = async () => {
    setLoading(true)
    const { from, to } = getRange()

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: true })

    if (!orders) { setLoading(false); return }

    const delivered  = orders.filter(o => o.status === 'GELIEFERT')
    const cancelled  = orders.filter(o => o.status === 'ABGELEHNT')
    const revenue    = delivered.reduce((s, o) => s + (o.total || 0), 0)
    const avgOrder   = delivered.length > 0 ? revenue / delivered.length : 0

    // Top-Produkte
    const productMap: Record<string, { qty: number; revenue: number }> = {}
    for (const order of delivered) {
      for (const item of (order.items || [])) {
        const name = item.name || 'Unbekannt'
        if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 }
        productMap[name].qty     += item.quantity || 1
        productMap[name].revenue += (item.totalPrice || item.price * item.quantity) || 0
      }
    }
    const topProducts = Object.entries(productMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)

    // Stündliche Verteilung (für Tagesansicht)
    const hourlyMap: Record<number, { orders: number; revenue: number }> = {}
    for (let h = 0; h < 24; h++) hourlyMap[h] = { orders: 0, revenue: 0 }
    for (const order of delivered) {
      const h = new Date(order.created_at).getHours()
      hourlyMap[h].orders++
      hourlyMap[h].revenue += order.total || 0
    }
    const hourlyData = Object.entries(hourlyMap)
      .map(([hour, d]) => ({ hour: parseInt(hour), ...d }))
      .filter(h => h.orders > 0)

    // Tägliche Daten (für Wochen-/Monatsansicht)
    const dailyMap: Record<string, { orders: number; revenue: number }> = {}
    for (const order of delivered) {
      const day = new Date(order.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      if (!dailyMap[day]) dailyMap[day] = { orders: 0, revenue: 0 }
      dailyMap[day].orders++
      dailyMap[day].revenue += order.total || 0
    }
    const dailyData = Object.entries(dailyMap).map(([date, d]) => ({ date, ...d }))

    setStats({
      totalRevenue:   revenue,
      orderCount:     orders.length,
      avgOrderValue:  avgOrder,
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      topProducts,
      hourlyData,
      dailyData,
    })
    setLoading(false)
  }

  const exportCSV = () => {
    if (!stats) return
    const { from, to } = getRange()
    const rows = [
      ['Simonetti Eiscafé – Umsatzreport'],
      [`Zeitraum: ${new Date(from).toLocaleDateString('de-DE')} – ${new Date(to).toLocaleDateString('de-DE')}`],
      [],
      ['Kennzahl', 'Wert'],
      ['Gesamtumsatz', stats.totalRevenue.toFixed(2) + ' €'],
      ['Bestellungen gesamt', stats.orderCount],
      ['Davon geliefert', stats.deliveredCount],
      ['Davon abgelehnt', stats.cancelledCount],
      ['Ø Bestellwert', stats.avgOrderValue.toFixed(2) + ' €'],
      [],
      ['Top-Produkte', '', ''],
      ['Produkt', 'Menge', 'Umsatz €'],
      ...stats.topProducts.map(p => [p.name, p.qty, p.revenue.toFixed(2)]),
    ]
    const csv  = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `simonetti-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const periodLabel: Record<Period, string> = {
    today:  'Heute',
    week:   'Letzte 7 Tage',
    month:  'Dieser Monat',
    custom: 'Benutzerdefiniert',
  }

  const maxDailyRevenue = Math.max(...(stats?.dailyData.map(d => d.revenue) || [1]))
  const maxHourlyOrders = Math.max(...(stats?.hourlyData.map(h => h.orders) || [1]))
  const maxProductQty   = Math.max(...(stats?.topProducts.map(p => p.qty) || [1]))

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp size={24} /> Umsatz-Reports
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">{periodLabel[period]}</p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-900 transition">
            <Download size={16} /> Als CSV exportieren
          </button>
        </div>

        {/* Zeitraum-Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['today', 'week', 'month', 'custom'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border-2 ${period === p ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}>
              {periodLabel[p]}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex gap-3 mb-6 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Von</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Bis</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-5xl animate-pulse">🍦</div>
          </div>
        ) : !stats ? (
          <div className="text-center text-gray-400 py-16">Keine Daten gefunden.</div>
        ) : (
          <>
            {/* KPI Karten */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Euro size={20} className="text-green-700" />}
                label="Umsatz"
                value={`${stats.totalRevenue.toFixed(2)} €`}
                sub={`${stats.deliveredCount} Lieferungen`}
                color="bg-green-100"
              />
              <StatCard
                icon={<ShoppingBag size={20} className="text-blue-700" />}
                label="Bestellungen"
                value={String(stats.orderCount)}
                sub={`${stats.cancelledCount} abgelehnt`}
                color="bg-blue-100"
              />
              <StatCard
                icon={<TrendingUp size={20} className="text-purple-700" />}
                label="Ø Bestellwert"
                value={`${stats.avgOrderValue.toFixed(2)} €`}
                color="bg-purple-100"
              />
              <StatCard
                icon={<Users size={20} className="text-orange-700" />}
                label="Lieferquote"
                value={stats.orderCount > 0 ? `${Math.round(stats.deliveredCount / stats.orderCount * 100)}%` : '–'}
                sub={`${stats.deliveredCount} von ${stats.orderCount}`}
                color="bg-orange-100"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Top Produkte */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-base mb-4">🍦 Top Produkte</h2>
                {stats.topProducts.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-8">Noch keine Daten</div>
                ) : (
                  <div>
                    {stats.topProducts.map(p => (
                      <SimpleBar
                        key={p.name}
                        label={p.name}
                        value={p.qty}
                        max={maxProductQty}
                        color="bg-green-400"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tageszeiten / Tagesverlauf */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-base mb-4">
                  {period === 'today' ? '🕐 Bestellungen nach Uhrzeit' : '📅 Umsatz pro Tag'}
                </h2>
                {period === 'today' ? (
                  stats.hourlyData.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center py-8">Noch keine Bestellungen heute</div>
                  ) : (
                    <div>
                      {stats.hourlyData.map(h => (
                        <SimpleBar
                          key={h.hour}
                          label={`${String(h.hour).padStart(2, '0')}:00 Uhr`}
                          value={h.orders}
                          max={maxHourlyOrders}
                          color="bg-blue-400"
                        />
                      ))}
                    </div>
                  )
                ) : (
                  stats.dailyData.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center py-8">Noch keine Daten</div>
                  ) : (
                    <div>
                      {stats.dailyData.map(d => (
                        <div key={d.date} className="mb-2">
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-gray-700">{d.date}</span>
                            <span className="text-gray-500">{d.revenue.toFixed(2)} €</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-2 rounded-full bg-green-400 transition-all"
                              style={{ width: `${Math.round((d.revenue / maxDailyRevenue) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Zusammenfassung */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-base mb-4">📊 Zusammenfassung</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="font-black text-lg text-green-600">{stats.totalRevenue.toFixed(2)} €</div>
                  <div className="text-gray-500 text-xs">Gesamtumsatz</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="font-black text-lg">{stats.deliveredCount}</div>
                  <div className="text-gray-500 text-xs">Geliefert</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="font-black text-lg text-red-500">{stats.cancelledCount}</div>
                  <div className="text-gray-500 text-xs">Abgelehnt</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="font-black text-lg text-blue-600">{stats.avgOrderValue.toFixed(2)} €</div>
                  <div className="text-gray-500 text-xs">Ø Bestellwert</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}