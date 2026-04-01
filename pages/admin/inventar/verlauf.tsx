import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

type Bewegung = {
  id: string
  typ: 'eingang' | 'verbrauch' | 'verlust' | 'inventur'
  menge: number
  menge_vorher: number | null
  menge_nachher: number | null
  lieferant_id: string | null
  lieferschein_nr: string | null
  einkaufspreis: number | null
  notiz: string | null
  erstellt_von: string
  erstellt_am: string
  inventar_lieferanten?: { name: string } | null
}

type ArtikelInfo = {
  artikel_id: string
  artikel: string
  einheit: string
  bestand: number
  status: string
  kategorie: string | null
}

const TYP_LABEL: Record<string, string> = {
  eingang:   'Eingang',
  verbrauch: 'Verbrauch',
  verlust:   'Verlust',
  inventur:  'Inventur',
}

const TYP_CLASS: Record<string, string> = {
  eingang:   'bg-green-100 text-green-800',
  verbrauch: 'bg-blue-100 text-blue-800',
  verlust:   'bg-red-100 text-red-800',
  inventur:  'bg-yellow-100 text-yellow-800',
}

const TYP_ICON: Record<string, string> = {
  eingang:   '↑',
  verbrauch: '↓',
  verlust:   '✕',
  inventur:  '≈',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function InventarVerlauf({ session }: { session: Session | null }) {
  const router = useRouter()
  const { id } = router.query

  const [artikel, setArtikel]       = useState<ArtikelInfo | null>(null)
  const [bewegungen, setBewegungen] = useState<Bewegung[]>([])
  const [loading, setLoading]       = useState(true)
  const [typFilter, setTypFilter]   = useState('')
  const [limit, setLimit]           = useState(50)

  // Buchungs-Modal (direkt von hier aus buchbar)
  const [buchungOffen, setBuchungOffen]         = useState(false)
  const [buchungTyp, setBuchungTyp]             = useState<'eingang'|'verbrauch'|'verlust'|'inventur'>('eingang')
  const [buchungMenge, setBuchungMenge]         = useState('')
  const [buchungNotiz, setBuchungNotiz]         = useState('')
  const [buchungLoading, setBuchungLoading]     = useState(false)
  const [buchungFehler, setBuchungFehler]       = useState('')
  const [toast, setToast]                       = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchDaten = useCallback(async (artikelId: string) => {
    setLoading(true)
    const [{ data: art }, { data: bew }] = await Promise.all([
      supabase
        .from('inventar_bestand_uebersicht')
        .select('artikel_id, artikel, einheit, bestand, status, kategorie')
        .eq('artikel_id', artikelId)
        .single(),
      supabase
        .from('inventar_bewegungen')
        .select('*, inventar_lieferanten(name)')
        .eq('artikel_id', artikelId)
        .order('erstellt_am', { ascending: false })
        .limit(limit),
    ])
    setArtikel(art)
    setBewegungen(bew || [])
    setLoading(false)
  }, [limit])

  useEffect(() => {
    if (id && typeof id === 'string') fetchDaten(id)
  }, [id, fetchDaten])

  const gefiltert = typFilter
    ? bewegungen.filter(b => b.typ === typFilter)
    : bewegungen

  // Summen
  const summen = {
    eingang:   bewegungen.filter(b => b.typ === 'eingang').reduce((s, b) => s + Math.abs(b.menge), 0),
    verbrauch: bewegungen.filter(b => b.typ === 'verbrauch').reduce((s, b) => s + Math.abs(b.menge), 0),
    verlust:   bewegungen.filter(b => b.typ === 'verlust').reduce((s, b) => s + Math.abs(b.menge), 0),
  }

  async function buchungAbschicken() {
    if (!id || typeof id !== 'string') return
    const menge = parseFloat(buchungMenge)
    if (!menge || menge <= 0) { setBuchungFehler('Ungültige Menge.'); return }
    setBuchungLoading(true)
    setBuchungFehler('')
    const { error } = await supabase.rpc('inventar_buchen', {
      p_artikel_id:   id,
      p_typ:          buchungTyp,
      p_menge:        menge,
      p_notiz:        buchungNotiz || null,
      p_erstellt_von: 'admin',
    })
    setBuchungLoading(false)
    if (error) { setBuchungFehler('Fehler: ' + error.message); return }
    setBuchungOffen(false)
    setBuchungMenge('')
    setBuchungNotiz('')
    showToast('Buchung erfasst!')
    await fetchDaten(id)
  }

  return (
    <AdminLayout session={session}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <button
              onClick={() => router.push('/admin/inventar')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1"
            >
              ← Inventar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {artikel ? artikel.artikel : 'Verlauf'}
            </h1>
            {artikel && (
              <p className="text-sm text-gray-400 mt-0.5">
                {artikel.kategorie} · Bestand: <span className="font-semibold text-gray-700">{artikel.bestand} {artikel.einheit}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/admin/inventar/artikel?id=${id}`)}
              className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            >
              Bearbeiten
            </button>
            <button
              onClick={() => { setBuchungOffen(true); setBuchungFehler('') }}
              className="px-4 py-2 text-sm font-bold text-white rounded-xl hover:bg-[#a87b20] transition"
              style={{ background: '#C4973A' }}
            >
              + Buchen
            </button>
          </div>
        </div>

        {/* Summen-Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Eingänge',  value: summen.eingang,   color: 'text-green-600' },
              { label: 'Verbrauch', value: summen.verbrauch, color: 'text-blue-600' },
              { label: 'Verlust',   value: summen.verlust,   color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className={`text-2xl font-black ${s.color}`}>
                  {s.value.toFixed(2)} <span className="text-sm font-normal text-gray-400">{artikel?.einheit}</span>
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <select
            value={typFilter} onChange={e => setTypFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Alle Typen</option>
            <option value="eingang">Eingang</option>
            <option value="verbrauch">Verbrauch</option>
            <option value="verlust">Verlust</option>
            <option value="inventur">Inventur</option>
          </select>
          <span className="text-xs text-gray-400">{gefiltert.length} Einträge</span>
        </div>

        {/* Bewegungsliste */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Lädt…</div>
          ) : gefiltert.length === 0 ? (
            <div className="p-10 text-center text-gray-400">Keine Buchungen vorhanden</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {gefiltert.map(b => (
                <div key={b.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition">

                  {/* Typ-Badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${TYP_CLASS[b.typ]}`}>
                      <span>{TYP_ICON[b.typ]}</span>
                      {TYP_LABEL[b.typ]}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="font-bold text-gray-900 text-base">
                        {b.menge > 0 ? '+' : ''}{b.menge} {artikel?.einheit}
                      </span>
                      {b.menge_vorher != null && b.menge_nachher != null && (
                        <span className="text-xs text-gray-400">
                          {b.menge_vorher} → {b.menge_nachher} {artikel?.einheit}
                        </span>
                      )}
                      {b.einkaufspreis && (
                        <span className="text-xs text-gray-400">
                          à €{Number(b.einkaufspreis).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {b.inventar_lieferanten?.name && (
                        <span className="text-xs text-gray-500">🏭 {b.inventar_lieferanten.name}</span>
                      )}
                      {b.lieferschein_nr && (
                        <span className="text-xs text-gray-500">LS: {b.lieferschein_nr}</span>
                      )}
                      {b.notiz && (
                        <span className="text-xs text-gray-500 italic">„{b.notiz}"</span>
                      )}
                    </div>
                  </div>

                  {/* Datum + User */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{fmt(b.erstellt_am)}</p>
                    <p className="text-xs text-gray-300">{b.erstellt_von}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mehr laden */}
        {!loading && bewegungen.length >= limit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setLimit(l => l + 50)}
              className="px-5 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            >
              Weitere laden
            </button>
          </div>
        )}
      </div>

      {/* Buchungs-Modal */}
      {buchungOffen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setBuchungOffen(false) }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Buchung</h3>
            <p className="text-sm text-gray-400 mb-4">{artikel?.artikel}</p>

            {buchungFehler && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-2 mb-3">
                {buchungFehler}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Typ</label>
                <select
                  value={buchungTyp} onChange={e => setBuchungTyp(e.target.value as any)}
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
                  Menge ({artikel?.einheit})
                </label>
                <input
                  type="number" min="0" step="0.01" autoFocus
                  value={buchungMenge} onChange={e => setBuchungMenge(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Notiz</label>
                <input
                  type="text"
                  value={buchungNotiz} onChange={e => setBuchungNotiz(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="optional"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setBuchungOffen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">
                Abbrechen
              </button>
              <button onClick={buchungAbschicken} disabled={buchungLoading}
                className="px-5 py-2 text-white text-sm font-bold rounded-xl hover:bg-[#a87b20] disabled:opacity-50 transition"
                style={{ background: '#C4973A' }}>
                {buchungLoading ? 'Buche…' : 'Buchen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}