import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

type Kategorie  = { id: string; name: string; farbe: string | null }
type Lieferant  = { id: string; name: string }
type Zutat      = { id: string; name: string }

type FormData = {
  name:           string
  artikelnummer:  string
  kategorie_id:   string
  lieferant_id:   string
  einheit:        string
  inhalt_pro_pkg: string
  mindestbestand: string
  sollbestand:    string
  einkaufspreis:  string
  lagerort:       string
  zutaten_id:     string
  notizen:        string
  aktiv:          boolean
}

const EINHEITEN = ['kg', 'g', 'l', 'ml', 'Stk', 'Pkg', 'Karton', 'Flasche', 'Dose', 'Beutel']

const EMPTY: FormData = {
  name: '', artikelnummer: '', kategorie_id: '', lieferant_id: '',
  einheit: 'kg', inhalt_pro_pkg: '', mindestbestand: '0', sollbestand: '',
  einkaufspreis: '', lagerort: 'Hauptlager', zutaten_id: '', notizen: '', aktiv: true,
}

export default function InventarArtikelForm({ session }: { session: Session | null }) {
  const router  = useRouter()
  const { id }  = router.query   // vorhanden = Bearbeiten, fehlt = Neu

  const [form, setForm]           = useState<FormData>(EMPTY)
  const [kategorien, setKategorien] = useState<Kategorie[]>([])
  const [lieferanten, setLieferanten] = useState<Lieferant[]>([])
  const [zutaten, setZutaten]     = useState<Zutat[]>([])
  const [loading, setLoading]     = useState(false)
  const [pageLoading, setPageLoading] = useState(!!id)
  const [fehler, setFehler]       = useState('')
  const [toast, setToast]         = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const set = (key: keyof FormData, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }))

  // ── Stammdaten laden ─────────────────────────────────────────
  const fetchStammdaten = useCallback(async () => {
    const [{ data: kat }, { data: lief }, { data: zut }] = await Promise.all([
      supabase.from('inventar_kategorien').select('id, name, farbe').order('sortierung'),
      supabase.from('inventar_lieferanten').select('id, name').eq('aktiv', true).order('name'),
      supabase.from('zutaten').select('id, name').order('name'),
    ])
    setKategorien(kat || [])
    setLieferanten(lief || [])
    setZutaten(zut || [])
  }, [])

  // ── Artikel laden (Bearbeiten) ───────────────────────────────
  const fetchArtikel = useCallback(async (artikelId: string) => {
    const { data, error } = await supabase
      .from('inventar_artikel')
      .select('*')
      .eq('id', artikelId)
      .single()
    if (error || !data) { setFehler('Artikel nicht gefunden.'); return }
    setForm({
      name:           data.name           || '',
      artikelnummer:  data.artikelnummer  || '',
      kategorie_id:   data.kategorie_id   || '',
      lieferant_id:   data.lieferant_id   || '',
      einheit:        data.einheit        || 'kg',
      inhalt_pro_pkg: data.inhalt_pro_pkg?.toString() || '',
      mindestbestand: data.mindestbestand?.toString() || '0',
      sollbestand:    data.sollbestand?.toString()    || '',
      einkaufspreis:  data.einkaufspreis?.toString()  || '',
      lagerort:       data.lagerort       || 'Hauptlager',
      zutaten_id:     data.zutaten_id     || '',
      notizen:        data.notizen        || '',
      aktiv:          data.aktiv ?? true,
    })
    setPageLoading(false)
  }, [])

  useEffect(() => {
    fetchStammdaten()
    if (id && typeof id === 'string') fetchArtikel(id)
  }, [id, fetchStammdaten, fetchArtikel])

  // ── Speichern ────────────────────────────────────────────────
  async function speichern() {
    if (!form.name.trim()) { setFehler('Name ist Pflichtfeld.'); return }
    setLoading(true)
    setFehler('')

    const payload = {
      name:           form.name.trim(),
      artikelnummer:  form.artikelnummer || null,
      kategorie_id:   form.kategorie_id  || null,
      lieferant_id:   form.lieferant_id  || null,
      einheit:        form.einheit,
      inhalt_pro_pkg: form.inhalt_pro_pkg ? parseFloat(form.inhalt_pro_pkg) : null,
      mindestbestand: parseFloat(form.mindestbestand) || 0,
      sollbestand:    form.sollbestand ? parseFloat(form.sollbestand) : null,
      einkaufspreis:  form.einkaufspreis ? parseFloat(form.einkaufspreis) : null,
      lagerort:       form.lagerort || 'Hauptlager',
      zutaten_id:     form.zutaten_id || null,
      notizen:        form.notizen   || null,
      aktiv:          form.aktiv,
    }

    let error
    if (id && typeof id === 'string') {
      ;({ error } = await supabase.from('inventar_artikel').update(payload).eq('id', id))
    } else {
      ;({ error } = await supabase.from('inventar_artikel').insert(payload))
    }

    setLoading(false)
    if (error) { setFehler('Fehler: ' + error.message); return }
    showToast(id ? 'Gespeichert!' : 'Artikel angelegt!')
    setTimeout(() => router.push('/admin/inventar'), 1000)
  }

  // ── Löschen ──────────────────────────────────────────────────
  async function loeschen() {
    if (!id || typeof id !== 'string') return
    if (!confirm(`Artikel "${form.name}" wirklich löschen?`)) return
    await supabase.from('inventar_artikel').update({ aktiv: false }).eq('id', id)
    router.push('/admin/inventar')
  }

  if (pageLoading) {
    return (
      <AdminLayout session={session}>
        <div className="flex items-center justify-center h-64 text-gray-400">Lädt…</div>
      </AdminLayout>
    )
  }

  const isEdit = !!id

  return (
    <AdminLayout session={session}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/admin/inventar')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1"
            >
              ← Inventar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}
            </h1>
          </div>
          {isEdit && (
            <button
              onClick={loeschen}
              className="px-4 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition"
            >
              Deaktivieren
            </button>
          )}
        </div>

        {fehler && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
            {fehler}
          </div>
        )}

        {/* Formular */}
        <div className="space-y-4">

          {/* Stammdaten */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Stammdaten</h2>
            <div className="space-y-3">

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                  Name *
                </label>
                <input
                  type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="z.B. Pistazienpaste"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Artikelnummer
                  </label>
                  <input
                    type="text" value={form.artikelnummer} onChange={e => set('artikelnummer', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Lagerort
                  </label>
                  <input
                    type="text" value={form.lagerort} onChange={e => set('lagerort', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                    placeholder="Hauptlager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Kategorie
                  </label>
                  <select
                    value={form.kategorie_id} onChange={e => set('kategorie_id', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  >
                    <option value="">— keine —</option>
                    {kategorien.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Lieferant
                  </label>
                  <select
                    value={form.lieferant_id} onChange={e => set('lieferant_id', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  >
                    <option value="">— keiner —</option>
                    {lieferanten.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                  Verknüpfung Kalkulation (Zutat)
                </label>
                <select
                  value={form.zutaten_id} onChange={e => set('zutaten_id', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                >
                  <option value="">— keine Verknüpfung —</option>
                  {zutaten.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Optional: Artikel mit Zutat aus der Kalkulation verknüpfen</p>
              </div>
            </div>
          </div>

          {/* Mengen & Preise */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Mengen & Preise</h2>
            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Einheit
                  </label>
                  <select
                    value={form.einheit} onChange={e => set('einheit', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  >
                    {EINHEITEN.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Inhalt pro Packung
                  </label>
                  <input
                    type="number" min="0" step="0.001"
                    value={form.inhalt_pro_pkg} onChange={e => set('inhalt_pro_pkg', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                    placeholder="z.B. 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Mindestbestand
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.mindestbestand} onChange={e => set('mindestbestand', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Sollbestand
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.sollbestand} onChange={e => set('sollbestand', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">
                    Einkaufspreis (€)
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.einkaufspreis} onChange={e => set('einkaufspreis', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notizen */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Notizen</h2>
            <textarea
              value={form.notizen} onChange={e => set('notizen', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] resize-none"
              placeholder="Interne Notizen zum Artikel…"
            />
          </div>

          {/* Aktiv Toggle */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Artikel aktiv</p>
              <p className="text-xs text-gray-400">Inaktive Artikel erscheinen nicht im Inventar</p>
            </div>
            <button
              onClick={() => set('aktiv', !form.aktiv)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.aktiv ? 'bg-[#C4973A]' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.aktiv ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Speichern */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => router.push('/admin/inventar')}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Abbrechen
            </button>
            <button
              onClick={speichern}
              disabled={loading}
              className="px-6 py-2.5 text-white text-sm font-bold rounded-xl hover:bg-[#a87b20] disabled:opacity-50 transition"
              style={{ background: '#C4973A' }}
            >
              {loading ? 'Speichere…' : isEdit ? 'Speichern' : 'Anlegen'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}