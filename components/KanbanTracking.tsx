// ============================================================
// Kanban Fahrer-Tracking – additive Erweiterungen
// Wird in pages/admin/kanban.tsx eingebunden.
// Nichts hier verändert bestehende Kanban-Logik.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Navigation, RefreshCw, X, Users, Edit3 } from 'lucide-react'

// ---------- Helpers ----------

function timeAgo(iso?: string | null): string {
  if (!iso) return '–'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return 'gerade eben'
  const s = Math.floor(diff / 1000)
  if (s < 60) return `vor ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `vor ${m} Min`
  const h = Math.floor(m / 60)
  if (h < 24) return `vor ${h} Std`
  const d = Math.floor(h / 24)
  return `vor ${d} Tg`
}

function freshnessColor(iso?: string | null): string {
  if (!iso) return 'text-gray-400'
  const ageMin = (Date.now() - new Date(iso).getTime()) / 60000
  if (ageMin < 2)  return 'text-green-600'
  if (ageMin < 10) return 'text-yellow-600'
  return 'text-red-600'
}

async function fetchDriverLocation(driverId: string): Promise<any | null> {
  const { data } = await supabase
    .from('driver_locations')
    .select('*')
    .eq('driver_id', driverId)
    .maybeSingle()
  return data || null
}

async function fetchAllActiveLocations(): Promise<any[]> {
  const { data } = await supabase
    .from('driver_locations')
    .select('*')
  return data || []
}

// ---------- 1) Wo ist Fahrer? – Button + Modal ----------

export function WhereIsDriverButton({ driverId, driverName }: { driverId: string; driverName?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(true) }}
        className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-1"
        title="Aktuelle Fahrer-Position anzeigen"
      >
        <Navigation size={12} /> Wo ist Fahrer?
      </button>
      {open && (
        <DriverLocationModal
          driverId={driverId}
          driverName={driverName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function DriverLocationModal({
  driverId, driverName, onClose,
}: { driverId: string; driverName?: string; onClose: () => void }) {
  const [loc, setLoc] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchDriverLocation(driverId)
    setLoc(data)
    setLoading(false)
  }, [driverId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const iv = setInterval(() => { load(); setTick(t => t + 1) }, 10000)
    return () => clearInterval(iv)
  }, [load])

  const hasCoords = loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  const lat = hasCoords ? loc.latitude : null
  const lng = hasCoords ? loc.longitude : null

  const bboxDelta = 0.006
  const osmSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - bboxDelta},${lat - bboxDelta},${lng + bboxDelta},${lat + bboxDelta}&layer=mapnik&marker=${lat},${lng}`
    : ''
  const gmapsHref = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : '#'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" />
            <h3 className="font-bold text-base">
              Fahrer-Position{driverName ? ` · ${driverName}` : ''}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Aktualisieren"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {loading && !loc ? (
            <div className="text-center text-gray-400 py-12 text-sm">Lade Position …</div>
          ) : !hasCoords ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📍❓</div>
              <div className="font-semibold text-gray-700">Keine Position verfügbar</div>
              <div className="text-xs text-gray-500 mt-2">
                Der Fahrer hat noch keine GPS-Daten gesendet.<br />
                Das Tracking startet sobald die Fahrer-App geöffnet wird.
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className={`font-semibold ${freshnessColor(loc.updated_at)}`}>
                  ● Aktualisiert {timeAgo(loc.updated_at)}
                </div>
                <div className="text-gray-500">
                  {typeof loc.speed === 'number' && (
                    <span className="mr-3">🚗 {Math.round(loc.speed * 3.6)} km/h</span>
                  )}
                  {typeof loc.accuracy === 'number' && (
                    <span>± {Math.round(loc.accuracy)}m</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 aspect-[16/10]">
                <iframe
                  key={`${lat}-${lng}-${tick}`}
                  src={osmSrc}
                  className="w-full h-full"
                  loading="lazy"
                  title="Fahrer-Position"
                />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <a
                  href={gmapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition"
                >
                  🗺️ In Google Maps öffnen
                </a>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-mono text-gray-700">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </div>
              </div>
              <div className="text-[10px] text-gray-400 text-center mt-2">
                Automatische Aktualisierung alle 10 Sekunden
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- 2) Tracking-Übersicht – Button + Modal ----------

export function TrackingOverviewButton({ drivers }: { drivers: any[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:border-indigo-500 transition"
        title="Tracking-Übersicht aller Fahrer"
      >
        <Navigation size={15} /> Tracking
      </button>
      {open && <TrackingOverviewModal drivers={drivers} onClose={() => setOpen(false)} />}
    </>
  )
}

function TrackingOverviewModal({
  drivers, onClose,
}: { drivers: any[]; onClose: () => void }) {
  const [locations, setLocations] = useState<Record<string, any>>({})
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [focusDriver, setFocusDriver] = useState<{ id: string; name: string } | null>(null)

  const load = useCallback(async () => {
    const [locs, ordersRes] = await Promise.all([
      fetchAllActiveLocations(),
      supabase.from('orders').select('id, driver_id, status').eq('status', 'AN_FAHRER'),
    ])
    const locMap: Record<string, any> = {}
    locs.forEach(l => { if (l.driver_id) locMap[l.driver_id] = l })
    setLocations(locMap)
    const cnt: Record<string, number> = {}
    ;(ordersRes.data || []).forEach((o: any) => {
      if (o.driver_id) cnt[o.driver_id] = (cnt[o.driver_id] || 0) + 1
    })
    setOrderCounts(cnt)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [load])

  const activeDrivers = drivers.filter(d => d.is_active !== false)
  const sorted = [...activeDrivers].sort((a, b) => {
    const aOn = (orderCounts[a.id] || 0) > 0 ? 1 : 0
    const bOn = (orderCounts[b.id] || 0) > 0 ? 1 : 0
    if (aOn !== bOn) return bOn - aOn
    const aT = locations[a.id]?.updated_at ? new Date(locations[a.id].updated_at).getTime() : 0
    const bT = locations[b.id]?.updated_at ? new Date(locations[b.id].updated_at).getTime() : 0
    return bT - aT
  })

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            <h3 className="font-bold text-base">Tracking-Übersicht</h3>
            <span className="text-xs text-gray-500">
              {activeDrivers.length} Fahrer · {Object.values(orderCounts).reduce((a, b) => a + b, 0)} aktive Lieferungen
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Aktualisieren">
              <RefreshCw size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400 py-12 text-sm">Lade Daten …</div>
          ) : sorted.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">Keine aktiven Fahrer.</div>
          ) : (
            <div className="space-y-2">
              {sorted.map(d => {
                const loc = locations[d.id]
                const orders = orderCounts[d.id] || 0
                const hasLoc = loc && typeof loc.latitude === 'number'
                return (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border-2 ${orders > 0 ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${orders > 0 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {(d.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-gray-900 truncate">{d.name}</div>
                        <div className="text-xs flex items-center gap-2 flex-wrap">
                          {orders > 0 ? (
                            <span className="font-semibold text-indigo-700">{orders} Lieferung{orders === 1 ? '' : 'en'}</span>
                          ) : (
                            <span className="text-gray-500">frei</span>
                          )}
                          <span className={`${freshnessColor(loc?.updated_at)}`}>
                            ● {hasLoc ? `GPS ${timeAgo(loc.updated_at)}` : 'kein GPS'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasLoc && (
                        <a
                          href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border-2 border-gray-200 hover:border-black transition"
                          title="In Google Maps öffnen"
                        >
                          🗺️
                        </a>
                      )}
                      <button
                        onClick={() => setFocusDriver({ id: d.id, name: d.name })}
                        disabled={!hasLoc}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${hasLoc ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        Karte
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {focusDriver && (
        <DriverLocationModal
          driverId={focusDriver.id}
          driverName={focusDriver.name}
          onClose={() => setFocusDriver(null)}
        />
      )}
    </div>
  )
}

// ---------- 3) Fahrer ändern (Dropdown auf bereits zugewiesener Karte) ----------

export function ChangeDriverDropdown({
  orderId, currentDriverId, drivers, onAssign,
}: { orderId: string; currentDriverId?: string; drivers: any[]; onAssign: (orderId: string, driverId: string) => void }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(true) }}
        className="w-full py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition flex items-center justify-center gap-1"
        title="Anderen Fahrer zuweisen"
      >
        <Edit3 size={10} /> Fahrer ändern
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <select
        autoFocus
        defaultValue={currentDriverId || ''}
        onChange={e => {
          const v = e.target.value
          if (v && v !== currentDriverId) onAssign(orderId, v)
          setOpen(false)
        }}
        onBlur={() => setOpen(false)}
        className="flex-1 text-xs border-2 border-gray-200 rounded-lg px-2 py-1 focus:border-black focus:outline-none"
      >
        <option value="">Fahrer wählen …</option>
        {drivers.map((d: any) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="p-1 text-gray-400 hover:text-gray-700"
        title="Abbrechen"
      >
        <X size={12} />
      </button>
    </div>
  )
}
