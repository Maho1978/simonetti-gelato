import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

type Lieferant = {
  id: string
  name: string
  kategorie: 'trocken' | 'eis' | 'theke' | 'sonstiges'
  telefon: string | null
  email: string | null
  webseite: string | null
  kontakt: string | null
  lieferzeit_tage: number | null
  notizen: string | null
  aktiv: boolean
}

const EMPTY = {
  name: '', kategorie: 'trocken' as Lieferant['kategorie'], telefon: '', email: '',
  webseite: '', kontakt: '', lieferzeit_tage: '1', notizen: '', aktiv: true,
}

const KAT_LABEL: Record<string, string> = {
  trocken:   '📦 Trocken',
  eis:       '🍦 Eis',
  theke:     '🥐 Theke',
  sonstiges: '📋 Sonstiges',
}
const KAT_CLASS: Record<string, string> = {
  trocken:   'bg-amber-50 text-amber-800 border-amber-200',
  eis:       'bg-blue-50 text-blue-800 border-blue-200',
  theke:     'bg-pink-50 text-pink-800 border-pink-200',
  sonstiges: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function InventarLieferanten({ session }: { session: Session | null }) {
  const [lieferanten, setLieferanten] = useState<Lieferant[]>([])
  const [loading, setLoading]         = useState(true)
  const [toast, setToast]             = useState('')
  const [editing, setEditing]         = useState<Lieferant | null>(null)
  const [isNeu, setIsNeu]             = useState(false)
  const [form, setForm]               = useState(EMPTY)
  const [saving, setSaving]           = useState(false)
  const [fehler, setFehler]           = useState('')
  const [katFilter, setKatFilter]     = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const set = (key: keyof typeof EMPTY, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const fetchLieferanten = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('inventar_lieferanten')
      .select('*')
      .order('kategorie')
      .order('name')
    setLieferanten(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLieferanten() }, [fetchLieferanten])

  function oeffneNeu() {
    setForm(EMPTY)
    setEditing(null)
    setIsNeu(true)
    setFehler('')
  }

  function oeffneEdit(l: Lieferant) {
    setForm({
      name:            l.name,
      kategorie:       l.kategorie || 'trocken',
      telefon:         l.telefon    || '',
      email:           l.email      || '',
      webseite:        l.webseite   || '',
      kontakt:         l.kontakt    || '',
      lieferzeit_tage: l.lieferzeit_tage?.toString() || '1',
      notizen:         l.notizen    || '',
      aktiv:           l.aktiv,
    })
    setEditing(l)
    setIsNeu(false)
    setFehler('')
  }

  function schliessen() { setEditing(null); setIsNeu(false); setFehler('') }

  async function speichern() {
    if (!form.name.trim()) { setFehler('Name ist Pflichtfeld.'); return }
    setSaving(true)
    setFehler('')

    const payload = {
      name:            form.name.trim(),
      kategorie:       form.kategorie,
      telefon:         form.telefon   || null,
      email:           form.email     || null,
      webseite:        form.webseite  || null,
      kontakt:         form.kontakt   || null,
      lieferzeit_tage: form.lieferzeit_tage ? parseInt(form.lieferzeit_tage) : null,
      notizen:         form.notizen   || null,
      aktiv:           form.aktiv,
    }

    let error
    if (isNeu) {
      ;({ error } = await supabase.from('inventar_lieferanten').insert(payload))
    } else if (editing) {
      ;({ error } = await supabase.from('inventar_lieferanten').update(payload).eq('id', editing.id))
    }

    setSaving(false)
    if (error) { setFehler('Fehler: ' + error.message); return }
    showToast(isNeu ? 'Lieferant angelegt!' : 'Gespeichert!')
    schliessen()
    await fetchLieferanten()
  }

  async function toggleAktiv(l: Lieferant) {
    await supabase.from('inventar_lieferanten').update({ aktiv: !l.aktiv }).eq('id', l.id)
    setLieferanten(prev => prev.map(x => x.id === l.id ? { ...x, aktiv: !l.aktiv } : x))
    showToast(!l.aktiv ? `${l.name} aktiviert` : `${l.name} deaktiviert`)
  }

  const gefiltert = katFilter
    ? lieferanten.filter(l => l.kategorie === katFilter)
    : lieferanten

  const kategorien = ['trocken', 'eis', 'theke', 'sonstiges'] as const

  return (
    <AdminLayout session={session}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏭 Lieferanten</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {lieferanten.filter(l => l.aktiv).length} aktive Lieferanten
            </p>
          </div>
          <button onClick={oeffneNeu}
            className="px-4 py-2 text-sm font-bold text-white rounded-xl hover:bg-[#a87b20] transition"
            style={{ background: '#C4973A' }}>
            + Lieferant
          </button>
        </div>

        {/* Stats nach Kategorie */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {kategorien.map(k => {
            const count = lieferanten.filter(l => l.kategorie === k && l.aktiv).length
            return (
              <button key={k}
                onClick={() => setKatFilter(katFilter === k ? '' : k)}
                className={`rounded-xl p-3 text-center border transition ${
                  katFilter === k ? KAT_CLASS[k] + ' border' : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}>
                <div className="text-xl font-black text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 mt-0.5">{KAT_LABEL[k].split(' ')[1]}</div>
              </button>
            )
          })}
        </div>

        {/* Liste */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Lädt…</div>
          ) : gefiltert.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-400 mb-3">Noch keine Lieferanten</p>
              <button onClick={oeffneNeu} className="text-sm font-bold" style={{ color: '#C4973A' }}>
                Ersten Lieferanten anlegen →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {gefiltert.map(l => (
                <div key={l.id} className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition ${!l.aktiv ? 'opacity-40' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{l.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${KAT_CLASS[l.kategorie]}`}>
                        {KAT_LABEL[l.kategorie]}
                      </span>
                      {!l.aktiv && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">inaktiv</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {l.telefon  && <span className="text-xs text-gray-400">📞 {l.telefon}</span>}
                      {l.email    && <span className="text-xs text-gray-400">✉️ {l.email}</span>}
                      {l.lieferzeit_tage && <span className="text-xs text-gray-400">🚚 {l.lieferzeit_tage} Tag{l.lieferzeit_tage > 1 ? 'e' : ''}</span>}
                      {l.kontakt  && <span className="text-xs text-gray-300 italic">{l.kontakt}</span>}
                    </div>
                    {l.notizen && <p className="text-xs text-gray-300 mt-0.5 italic">{l.notizen}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => oeffneEdit(l)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border transition hover:bg-amber-50"
                      style={{ borderColor: '#C4973A', color: '#C4973A' }}>
                      Bearbeiten
                    </button>
                    <button onClick={() => toggleAktiv(l)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                      {l.aktiv ? 'Aus' : 'An'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {(isNeu || editing) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) schliessen() }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4">
              {isNeu ? 'Neuer Lieferant' : `${editing?.name} bearbeiten`}
            </h3>

            {fehler && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-2 mb-3">{fehler}</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="z.B. Metro" autoFocus />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Kategorie</label>
                <div className="grid grid-cols-4 gap-2">
                  {kategorien.map(k => (
                    <button key={k} type="button"
                      onClick={() => set('kategorie', k)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition ${
                        form.kategorie === k ? KAT_CLASS[k] + ' border' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {KAT_LABEL[k]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Telefon</label>
                  <input type="tel" value={form.telefon} onChange={e => set('telefon', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                    placeholder="optional" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Lieferzeit (Tage)</label>
                  <input type="number" min="0" max="30" value={form.lieferzeit_tage}
                    onChange={e => set('lieferzeit_tage', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">E-Mail</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="optional" />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Ansprechpartner</label>
                <input type="text" value={form.kontakt} onChange={e => set('kontakt', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="z.B. Herr Müller" />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Notizen</label>
                <textarea value={form.notizen} onChange={e => set('notizen', e.target.value)}
                  rows={2} placeholder="interne Notizen…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] resize-none" />
              </div>

              {/* Aktiv Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-gray-700">Aktiv</span>
                <button onClick={() => set('aktiv', !form.aktiv)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.aktiv ? 'bg-[#C4973A]' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.aktiv ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={schliessen}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">
                Abbrechen
              </button>
              <button onClick={speichern} disabled={saving}
                className="px-5 py-2 text-white text-sm font-bold rounded-xl hover:bg-[#a87b20] disabled:opacity-50 transition"
                style={{ background: '#C4973A' }}>
                {saving ? 'Speichere…' : isNeu ? 'Anlegen' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}