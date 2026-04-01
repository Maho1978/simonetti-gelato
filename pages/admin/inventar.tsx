import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────
type Artikel = {
  artikel_id: string
  artikel: string
  artikelnummer: string | null
  einheit: string
  kategorie: string | null
  lieferant: string | null
  bestand: number
  mindestbestand: number
  sollbestand: number | null
  status: 'ok' | 'niedrig' | 'kritisch' | 'leer'
  lagerwert: number
  letzte_inventur: string | null
  zutaten_id: string | null
}

type BuchungTyp = 'eingang' | 'verbrauch' | 'verlust' | 'inventur'
type Lieferant  = { id: string; name: string }

const STATUS_LABEL: Record<string, string> = {
  ok: 'OK', niedrig: 'Niedrig', kritisch: 'Kritisch', leer: 'Leer',
}
const STATUS_CLASS: Record<string, string> = {
  ok:       'bg-green-100 text-green-800',
  niedrig:  'bg-yellow-100 text-yellow-800',
  kritisch: 'bg-orange-100 text-orange-800',
  leer:     'bg-gray-100 text-gray-500',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────
export default function InventarAdmin({ session }: { session: Session | null }) {
  const [artikel, setArtikel]     = useState<Artikel[]>([])
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState('')

  // Filter
  const [suche, setSuche]               = useState('')
  const [katFilter, setKatFilter]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Buchungs-Modal
  const [buchungArtikel, setBuchungArtikel]     = useState<Artikel | null>(null)
  const [buchungTyp, setBuchungTyp]             = useState<BuchungTyp>('eingang')
  const [buchungMenge, setBuchungMenge]         = useState('')
  const [buchungNotiz, setBuchungNotiz]         = useState('')
  const [buchungLieferant, setBuchungLieferant] = useState('')
  const [buchungPreis, setBuchungPreis]         = useState('')
  const [lieferanten, setLieferanten]           = useState<Lieferant[]>([])
  const [buchungLoading, setBuchungLoading]     = useState(false)
  const [buchungFehler, setBuchungFehler]       = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // ── Daten laden ──────────────────────────────────────────────
  const fetchArtikel = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('inventar_bestand_uebersicht')
      .select('*')
    setArtikel(data || [])
    setLoading(false)
  }, [])

  const fetchLieferanten = useCallback(async () => {
    const { data } = await supabase
      .from('inventar_lieferanten')
      .select('id, name')
      .eq('aktiv', true)
      .order('name')
    setLieferanten(data || [])
  }, [])

  useEffect(() => { fetchArtikel(); fetchLieferanten() }, [fetchArtikel, fetchLieferanten])

  // ── Filter ───────────────────────────────────────────────────
  const gefiltert = artikel.filter(a =>
    (!suche        || a.artikel.toLowerCase().includes(suche.toLowerCase())) &&
    (!katFilter    || a.kategorie === katFilter) &&
    (!statusFilter || a.status === statusFilter)
  )

  const kategorien = [...new Set(artikel.map(a => a.kategorie).filter(Boolean))]

  // ── Stats ────────────────────────────────────────────────────
  const stats = {
    gesamt:    artikel.length,
    kritisch:  artikel.filter(a => a.status === 'kritisch').length,
    leer:      artikel.filter(a => a.status === 'leer').length,
    lagerwert: artikel.reduce((s, a) => s + (Number(a.lagerwert) || 0), 0),
  }

  // ── Buchung ──────────────────────────────────────────────────
  function buchungOeffnen(a: Artikel) {
    setBuchungArtikel(a)
    setBuchungTyp('eingang')
    setBuchungMenge('')
    setBuchungNotiz('')
    setBuchungLieferant('')
    setBuchungPreis('')
    setBuchungFehler('')
  }

  async function buchungAbschicken() {
    if (!buchungArtikel) return
    const menge = parseFloat(buchungMenge)
    if (!menge || menge <= 0) { setBuchungFehler('Ungültige Menge.'); return }
    setBuchungLoading(true)
    setBuchungFehler('')

    const { error } = await supabase.rpc('inventar_buchen', {
      p_artikel_id:      buchungArtikel.artikel_id,
      p_typ:             buchungTyp,
      p_menge:           menge,
      p_notiz:           buchungNotiz || null,
      p_lieferant_id:    buchungLieferant || null,
      p_einkaufspreis:   buchungPreis ? parseFloat(buchungPreis) : null,
      p_erstellt_von:    'admin',
    })

    setBuchungLoading(false)
    if (error) { setBuchungFehler('Fehler: ' + error.message); return }

    setBuchungArtikel(null)
    showToast('Buchung erfasst!')
    await fetchArtikel()
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <AdminLayout session={session}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">🗄 Inventar</h1>
          <div className="flex gap-2">
            <a
              href="/admin/inventar/bestellbedarf"
              className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            >
              Bestellbedarf
            </a>
            <a
              href="/admin/inventar/artikel-neu"
              className="px-4 py-2 text-sm font-bold text-white rounded-xl hover:bg-[#a87b20] transition"
              style={{ background: '#C4973A' }}
            >
              + Artikel
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Artikel gesamt', value: stats.gesamt,             color: 'text-[#C4973A]' },
            { label: 'Kritisch',       value: stats.kritisch,           color: 'text-orange-500' },
            { label: 'Leer',           value: stats.leer,               color: 'text-red-500' },
            { label: 'Lagerwert',      value: `€${stats.lagerwert.toFixed(2)}`, color: 'text-[#C4973A]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Artikel suchen…"
            value={suche}
            onChange={e => setSuche(e.target.value)}
            className="flex-1 min-w-[160px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C4973A]"
          />
          <select
            value={katFilter}
            onChange={e => setKatFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Alle Kategorien</option>
            {kategorien.map(k => <option key={k!} value={k!}>{k}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Alle Status</option>
            <option value="ok">OK</option>
            <option value="niedrig">Niedrig</option>
            <option value="kritisch">Kritisch</option>
            <option value="leer">Leer</option>
          </select>
        </div>

        {/* Tabelle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Artikel', 'Kategorie', 'Bestand', 'Einheit', 'Mindest', 'Status', 'Lagerwert', 'Letzte Inventur', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Lädt…</td></tr>
                ) : gefiltert.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Keine Artikel gefunden</td></tr>
                ) : gefiltert.map(a => (
                  <tr key={a.artikel_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold text-gray-900">{a.artikel}</td>
                    <td className="px-4 py-3">
                      {a.kategorie
                        ? <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100 font-medium">{a.kategorie.split(' /')[0]}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={`px-4 py-3 font-bold ${
                      a.status === 'leer'     ? 'text-red-500' :
                      a.status === 'kritisch' ? 'text-orange-500' : 'text-gray-900'
                    }`}>
                      {a.bestand}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{a.einheit}</td>
                    <td className="px-4 py-3 text-gray-400">{a.mindestbestand}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_CLASS[a.status]}`}>
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {a.lagerwert != null ? `€${Number(a.lagerwert).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmt(a.letzte_inventur)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => buchungOeffnen(a)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border transition hover:bg-amber-50"
                          style={{ borderColor: '#C4973A', color: '#C4973A' }}
                        >
                          Buchen
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/inventar/artikel?id=${a.artikel_id}`}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                        >
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Buchungs-Modal */}
      {buchungArtikel && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setBuchungArtikel(null) }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Buchung</h3>
            <p className="text-sm text-gray-400 mb-4">{buchungArtikel.artikel}</p>

            {buchungFehler && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-2 mb-3">
                {buchungFehler}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Typ</label>
                <select
                  value={buchungTyp}
                  onChange={e => setBuchungTyp(e.target.value as BuchungTyp)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                >
                  <option value="eingang">Eingang (Lieferung)</option>
                  <option value="verbrauch">Verbrauch</option>
                  <option value="verlust">Verlust / Schwund</option>
                  <option value="inventur">Inventur-Korrektur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                  Menge ({buchungArtikel.einheit})
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={buchungMenge}
                  onChange={e => setBuchungMenge(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {buchungTyp === 'eingang' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Lieferant</label>
                    <select
                      value={buchungLieferant}
                      onChange={e => setBuchungLieferant(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                    >
                      <option value="">— kein —</option>
                      {lieferanten.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Einkaufspreis (€)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={buchungPreis}
                      onChange={e => setBuchungPreis(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                      placeholder="optional"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Notiz</label>
                <input
                  type="text"
                  value={buchungNotiz}
                  onChange={e => setBuchungNotiz(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="z.B. Lieferschein Nr. 1234"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={() => setBuchungArtikel(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={buchungAbschicken}
                disabled={buchungLoading}
                className="px-5 py-2 text-white text-sm font-bold rounded-xl hover:bg-[#a87b20] disabled:opacity-50 transition"
                style={{ background: '#C4973A' }}
              >
                {buchungLoading ? 'Buche…' : 'Buchen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}