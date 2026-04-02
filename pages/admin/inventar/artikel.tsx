import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

type Kategorie  = { id: string; name: string }
type Lieferant  = { id: string; name: string; kategorie: string }
type Zutat      = { id: string; name: string }

type FormData = {
  name: string; artikelnummer: string; ean: string; hersteller: string
  kategorie_id: string; lieferant_id: string; einheit: string
  inhalt_pro_pkg: string; mindestbestand: string; sollbestand: string
  einkaufspreis: string; lagerbereich: string; lagerort: string
  zutaten_id: string; notizen: string; aktiv: boolean
}

const EINHEITEN = ['kg','g','l','ml','Stk','Pkg','Karton','Flasche','Dose','Beutel']
const LAGERBEREICHE: Record<string,string> = {
  trocken:'📦 Trocken', kuehlhaus:'❄️ Kühlhaus', theke:'🛒 Theke',
  tiefkuehl:'🧊 Tiefkühl', sonstiges:'📋 Sonstiges',
}
const EMPTY: FormData = {
  name:'', artikelnummer:'', ean:'', hersteller:'', kategorie_id:'', lieferant_id:'',
  einheit:'kg', inhalt_pro_pkg:'', mindestbestand:'0', sollbestand:'',
  einkaufspreis:'', lagerbereich:'trocken', lagerort:'Hauptlager',
  zutaten_id:'', notizen:'', aktiv:true,
}

async function sucheEAN(ean: string): Promise<Partial<FormData>|null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`)
    const data = await res.json()
    if (data.status === 1 && data.product) {
      const p = data.product
      return {
        name: p.product_name_de || p.product_name || '',
        hersteller: p.brands || '',
        einheit: p.quantity?.includes('kg') ? 'kg'
               : p.quantity?.includes('g')  ? 'g'
               : p.quantity?.includes('l')  ? 'l'
               : p.quantity?.includes('ml') ? 'ml' : 'Stk',
      }
    }
  } catch {}
  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`)
    const data = await res.json()
    if (data.code === 'OK' && data.items?.length > 0) {
      return { name: data.items[0].title || '', hersteller: data.items[0].brand || '' }
    }
  } catch {}
  return null
}

export default function InventarArtikelForm({ session }: { session: Session | null }) {
  const router = useRouter()
  const { id } = router.query
  const [form, setForm] = useState<FormData>(EMPTY)
  const [kategorien, setKategorien] = useState<Kategorie[]>([])
  const [lieferanten, setLieferanten] = useState<Lieferant[]>([])
  const [zutaten, setZutaten] = useState<Zutat[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(!!id)
  const [fehler, setFehler] = useState('')
  const [toast, setToast] = useState('')
  const [eanInput, setEanInput] = useState('')
  const [eanLoading, setEanLoading] = useState(false)
  const [eanErgebnis, setEanErgebnis] = useState<string|null>(null)
  const [scannerOffen, setScannerOffen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream|null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const set = (key: keyof FormData, val: string|boolean) => setForm(prev => ({ ...prev, [key]: val }))

  const fetchStammdaten = useCallback(async () => {
    const [{ data: kat }, { data: lief }, { data: zut }] = await Promise.all([
      supabase.from('inventar_kategorien').select('id, name').order('sortierung'),
      supabase.from('inventar_lieferanten').select('id, name, kategorie').eq('aktiv', true).order('name'),
      supabase.from('zutaten').select('id, name').order('name'),
    ])
    setKategorien(kat || []); setLieferanten(lief || []); setZutaten(zut || [])
  }, [])

  const fetchArtikel = useCallback(async (artikelId: string) => {
    const { data, error } = await supabase.from('inventar_artikel').select('*').eq('id', artikelId).single()
    if (error || !data) { setFehler('Artikel nicht gefunden.'); return }
    setForm({
      name: data.name||'', artikelnummer: data.artikelnummer||'', ean: data.ean||'',
      hersteller: data.hersteller||'', kategorie_id: data.kategorie_id||'',
      lieferant_id: data.lieferant_id||'', einheit: data.einheit||'kg',
      inhalt_pro_pkg: data.inhalt_pro_pkg?.toString()||'',
      mindestbestand: data.mindestbestand?.toString()||'0',
      sollbestand: data.sollbestand?.toString()||'',
      einkaufspreis: data.einkaufspreis?.toString()||'',
      lagerbereich: data.lagerbereich||'trocken', lagerort: data.lagerort||'Hauptlager',
      zutaten_id: data.zutaten_id||'', notizen: data.notizen||'', aktiv: data.aktiv??true,
    })
    setPageLoading(false)
  }, [])

  useEffect(() => {
    fetchStammdaten()
    if (id && typeof id === 'string') fetchArtikel(id)
  }, [id, fetchStammdaten, fetchArtikel])

  async function eanSuchen(ean: string) {
    if (!ean || ean.length < 8) return
    setEanLoading(true); setEanErgebnis(null)
    const ergebnis = await sucheEAN(ean)
    setEanLoading(false)
    if (ergebnis) {
      setForm(prev => ({ ...prev, ean, name: ergebnis.name||prev.name, hersteller: ergebnis.hersteller||prev.hersteller, einheit: ergebnis.einheit||prev.einheit }))
      setEanErgebnis(`✅ Gefunden: ${ergebnis.name || 'Produkt'}`)
    } else {
      setForm(prev => ({ ...prev, ean }))
      setEanErgebnis('⚠️ Nicht gefunden — bitte manuell ausfüllen')
    }
  }

  async function scannerStarten() {
    setScannerOffen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128'] })
        const scan = async () => {
          if (!videoRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue
              scannerStoppen(); setEanInput(code); await eanSuchen(code); return
            }
          } catch {}
          requestAnimationFrame(scan)
        }
        videoRef.current?.addEventListener('loadedmetadata', () => scan())
      }
    } catch { setScannerOffen(false); showToast('Kamera nicht verfügbar') }
  }

  function scannerStoppen() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; setScannerOffen(false)
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  async function speichern() {
    if (!form.name.trim()) { setFehler('Name ist Pflichtfeld.'); return }
    setLoading(true); setFehler('')
    const payload = {
      name: form.name.trim(), artikelnummer: form.artikelnummer||null, ean: form.ean||null,
      hersteller: form.hersteller||null, kategorie_id: form.kategorie_id||null,
      lieferant_id: form.lieferant_id||null, einheit: form.einheit,
      inhalt_pro_pkg: form.inhalt_pro_pkg ? parseFloat(form.inhalt_pro_pkg) : null,
      mindestbestand: parseFloat(form.mindestbestand)||0,
      sollbestand: form.sollbestand ? parseFloat(form.sollbestand) : null,
      einkaufspreis: form.einkaufspreis ? parseFloat(form.einkaufspreis) : null,
      lagerbereich: form.lagerbereich, lagerort: form.lagerort||'Hauptlager',
      zutaten_id: form.zutaten_id||null, notizen: form.notizen||null, aktiv: form.aktiv,
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

  async function loeschen() {
    if (!id || typeof id !== 'string') return
    if (!confirm(`Artikel "${form.name}" wirklich deaktivieren?`)) return
    await supabase.from('inventar_artikel').update({ aktiv: false }).eq('id', id)
    router.push('/admin/inventar')
  }

  if (pageLoading) return <AdminLayout session={session}><div className="flex items-center justify-center h-64 text-gray-400">Lädt…</div></AdminLayout>

  const isEdit = !!id
  return (
    <AdminLayout session={session}>
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">{toast}</div>}

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push('/admin/inventar')} className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">← Inventar</button>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}</h1>
          </div>
          {isEdit && <button onClick={loeschen} className="px-4 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition">Deaktivieren</button>}
        </div>

        {fehler && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{fehler}</div>}

        <div className="space-y-4">

          {/* EAN Scanner */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-3">🔍 EAN / Barcode</h2>
            {scannerOffen && (
              <div className="mb-4 relative rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-24 border-2 border-[#C4973A] rounded-lg opacity-75" />
                </div>
                <button onClick={scannerStoppen} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg">Abbrechen</button>
                <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs">Barcode in den Rahmen halten</p>
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={eanInput} onChange={e => setEanInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && eanSuchen(eanInput)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] font-mono"
                placeholder="EAN eingeben oder scannen…" />
              <button onClick={() => eanSuchen(eanInput)} disabled={eanLoading || !eanInput}
                className="px-4 py-2.5 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition">
                {eanLoading ? '⏳' : '🔍'}
              </button>
              <button onClick={scannerOffen ? scannerStoppen : scannerStarten}
                className="px-4 py-2.5 text-sm font-bold rounded-xl text-white transition"
                style={{ background: '#C4973A' }}>📷</button>
            </div>
            {eanErgebnis && <p className={`text-xs mt-2 font-medium ${eanErgebnis.startsWith('✅') ? 'text-green-600' : 'text-amber-600'}`}>{eanErgebnis}</p>}
            <p className="text-xs text-gray-400 mt-1">Sucht in Open Food Facts + UPC Item DB. Felder werden automatisch befüllt.</p>
          </div>

          {/* Stammdaten */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Stammdaten</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="z.B. Pistazienpaste" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Hersteller</label>
                  <input type="text" value={form.hersteller} onChange={e => set('hersteller', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" placeholder="z.B. Comprital" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Artikelnummer</label>
                  <input type="text" value={form.artikelnummer} onChange={e => set('artikelnummer', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" placeholder="optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Kategorie</label>
                  <select value={form.kategorie_id} onChange={e => set('kategorie_id', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]">
                    <option value="">— keine —</option>
                    {kategorien.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Lieferant</label>
                  <select value={form.lieferant_id} onChange={e => set('lieferant_id', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]">
                    <option value="">— keiner —</option>
                    {lieferanten.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Verknüpfung Kalkulation</label>
                <select value={form.zutaten_id} onChange={e => set('zutaten_id', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]">
                  <option value="">— keine —</option>
                  {zutaten.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Lager */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Lager</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">Lagerbereich</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(LAGERBEREICHE).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => set('lagerbereich', key)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition ${form.lagerbereich === key ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Lagerort (genau)</label>
                <input type="text" value={form.lagerort} onChange={e => set('lagerort', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]"
                  placeholder="z.B. Regal 2, Fach 3" />
              </div>
            </div>
          </div>

          {/* Mengen & Preise */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Mengen & Preise</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Einheit</label>
                  <select value={form.einheit} onChange={e => set('einheit', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]">
                    {EINHEITEN.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Inhalt pro Packung</label>
                  <input type="number" min="0" step="0.001" value={form.inhalt_pro_pkg} onChange={e => set('inhalt_pro_pkg', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" placeholder="z.B. 5" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Mindestbestand</label>
                  <input type="number" min="0" step="0.01" value={form.mindestbestand} onChange={e => set('mindestbestand', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Sollbestand</label>
                  <input type="number" min="0" step="0.01" value={form.sollbestand} onChange={e => set('sollbestand', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" placeholder="optional" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Einkaufspreis €</label>
                  <input type="number" min="0" step="0.01" value={form.einkaufspreis} onChange={e => set('einkaufspreis', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>

          {/* Notizen + Aktiv */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-3">Notizen</h2>
            <textarea value={form.notizen} onChange={e => set('notizen', e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] resize-none"
              placeholder="Interne Notizen…" />
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Artikel aktiv</p>
                <p className="text-xs text-gray-400">Inaktive Artikel erscheinen nicht im Inventar</p>
              </div>
              <button onClick={() => set('aktiv', !form.aktiv)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.aktiv ? 'bg-[#C4973A]' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.aktiv ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => router.push('/admin/inventar')}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition">
              Abbrechen
            </button>
            <button onClick={speichern} disabled={loading}
              className="px-6 py-2.5 text-white text-sm font-bold rounded-xl hover:bg-[#a87b20] disabled:opacity-50 transition"
              style={{ background: '#C4973A' }}>
              {loading ? 'Speichere…' : isEdit ? 'Speichern' : 'Anlegen'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}