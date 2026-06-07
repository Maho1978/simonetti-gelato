import { useEffect, useMemo, useRef, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'
import { DEFAULT_CONFIG } from '@/lib/watermark-config'
import type { WatermarkConfig } from '@/lib/watermark-config'
import { Save, AlertTriangle, Check, ImageOff } from 'lucide-react'

const POSITION_LABELS: Record<WatermarkConfig['position'], string> = {
  'center':       'Zentral',
  'bottom-right': 'Unten rechts',
  'top-left':     'Oben links',
  'tile':         'Kachel-Muster',
}

// ── Form-Helfer ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Slider({
  value, min, max, step = 1, onChange, display,
}: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; display: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-2 accent-[#4a5d54] cursor-pointer"
      />
      <span className="text-sm font-mono text-gray-700 w-14 text-right">{display}</span>
    </div>
  )
}

// ── Hauptkomponente ────────────────────────────────────────────────────────

export default function WatermarkSettingsPage() {
  // Live config (updated immediately on every input)
  const [cfg, setCfg]             = useState<WatermarkConfig>(DEFAULT_CONFIG)
  // Debounced snapshot used to build the preview URL
  const [debouncedCfg, setDebouncedCfg] = useState<WatermarkConfig>(DEFAULT_CONFIG)
  // Incrementing key forces img reload when debounce fires
  const [cbKey, setCbKey]         = useState(0)

  const [token, setToken]         = useState<string | null>(null)
  const [testImg, setTestImg]     = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [productCount, setCount]  = useState(0)
  const [showDialog, setDialog]   = useState(false)
  const [copied, setCopied]       = useState(false)
  const [previewErr, setPreviewErr] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        setToken(session.access_token)

        // Load config — sync debouncedCfg immediately (no 300ms wait on page open)
        const res = await fetch('/api/admin/watermark-config')
        if (res.ok) {
          const dbConfig: WatermarkConfig = await res.json()
          setCfg(dbConfig)
          setDebouncedCfg(dbConfig)
          setCbKey(k => k + 1)
        }

        // First product with an image as test subject
        const { data: prods } = await supabase
          .from('products')
          .select('image_url')
          .not('image_url', 'is', null)
          .neq('image_url', '')
          .order('name')
          .limit(1)
        if (prods?.[0]?.image_url) setTestImg(prods[0].image_url)

        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .not('image_url', 'is', null)
        setCount(count ?? 0)
      } catch (err) {
        console.error('[watermark-settings] init error:', err)
      }
    }
    init()
  }, [])

  // ── debounce: update snapshot 300ms after last config change ──────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedCfg(cfg)
      setCbKey(k => k + 1)
      setPreviewErr(false)
    }, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [cfg])

  // ── preview URL — computed, never stale ────────────────────────────────────
  const previewUrl = useMemo<string | null>(() => {
    if (!token || !testImg) return null
    const p = new URLSearchParams({
      imageUrl:             testImg,
      token,
      wm_text:              debouncedCfg.text,
      wm_font_size_percent: String(debouncedCfg.font_size_percent),
      wm_opacity:           String(debouncedCfg.opacity),
      wm_position:          debouncedCfg.position,
      wm_rotation:          String(debouncedCfg.rotation),
      wm_color:             debouncedCfg.color,
      wm_shadow_enabled:    String(debouncedCfg.shadow_enabled),
      wm_shadow_color:      debouncedCfg.shadow_color,
      wm_font_weight:       debouncedCfg.font_weight,
      _cb:                  String(cbKey),
    })
    return `/api/admin/watermark-preview?${p}`
  }, [token, testImg, debouncedCfg, cbKey])

  // ── helpers ────────────────────────────────────────────────────────────────
  function set<K extends keyof WatermarkConfig>(k: K, v: WatermarkConfig[K]) {
    setCfg(prev => ({ ...prev, [k]: v }))
  }

  async function handleSave() {
    if (!token) return
    setSaving(true); setSaved(false)
    const res = await fetch('/api/admin/watermark-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(cfg),
    })
    setSaving(false)
    if (res.ok) {
      setCfg(await res.json())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function copyCommand() {
    navigator.clipboard.writeText('npx tsx scripts/watermark-existing.ts')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Wasserzeichen-Einstellungen</h1>
            <p className="text-sm text-gray-500 mt-1">
              Vorschau aktualisiert 300 ms nach der letzten Änderung. Erst nach Speichern wirken
              Einstellungen auf neue Uploads.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition"
              style={{ backgroundColor: '#4a5d54' }}
            >
              {saved
                ? <><Check size={16} /> Gespeichert</>
                : <><Save size={16} /> {saving ? 'Speichern…' : 'Speichern'}</>}
            </button>
            <button
              onClick={() => setDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
            >
              <AlertTriangle size={16} />
              Auf alle Produkte anwenden
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── FORM ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

            <Field label="Wasserzeichen-Text">
              <input
                type="text" value={cfg.text}
                onChange={e => set('text', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5d54]"
              />
            </Field>

            <Field label={`Größe – ${cfg.font_size_percent}% der Bildbreite`}>
              <Slider
                value={cfg.font_size_percent} min={1} max={20} step={0.5}
                onChange={v => set('font_size_percent', v)}
                display={`${cfg.font_size_percent}%`}
              />
            </Field>

            <Field label={`Transparenz – ${Math.round(cfg.opacity * 100)}%`}>
              <Slider
                value={Math.round(cfg.opacity * 100)} min={0} max={100}
                onChange={v => set('opacity', Math.round(v) / 100)}
                display={`${Math.round(cfg.opacity * 100)}%`}
              />
            </Field>

            <Field label="Position">
              <select
                value={cfg.position}
                onChange={e => set('position', e.target.value as WatermarkConfig['position'])}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5d54]"
              >
                {(Object.keys(POSITION_LABELS) as WatermarkConfig['position'][]).map(k => (
                  <option key={k} value={k}>{POSITION_LABELS[k]}</option>
                ))}
              </select>
            </Field>

            <Field label={`Rotation – ${cfg.rotation}°`}>
              <Slider
                value={cfg.rotation} min={-90} max={90}
                onChange={v => set('rotation', v)}
                display={`${cfg.rotation}°`}
              />
            </Field>

            <Field label="Textfarbe">
              <div className="flex items-center gap-3">
                <input
                  type="color" value={cfg.color}
                  onChange={e => set('color', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <span className="font-mono text-sm text-gray-600">{cfg.color.toUpperCase()}</span>
              </div>
            </Field>

            <Field label="Schatten">
              <div className="flex items-center gap-3">
                <button
                  type="button" role="switch" aria-checked={cfg.shadow_enabled}
                  onClick={() => set('shadow_enabled', !cfg.shadow_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    cfg.shadow_enabled ? 'bg-[#4a5d54]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    cfg.shadow_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm text-gray-600">{cfg.shadow_enabled ? 'An' : 'Aus'}</span>
              </div>
            </Field>

            {cfg.shadow_enabled && (
              <Field label="Schattenfarbe">
                <div className="flex items-center gap-3">
                  <input
                    type="color" value={cfg.shadow_color}
                    onChange={e => set('shadow_color', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <span className="font-mono text-sm text-gray-600">{cfg.shadow_color.toUpperCase()}</span>
                </div>
              </Field>
            )}

            <Field label="Schriftstärke">
              <select
                value={cfg.font_weight}
                onChange={e => set('font_weight', e.target.value as WatermarkConfig['font_weight'])}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5d54]"
              >
                <option value="bold">Fett</option>
                <option value="normal">Normal</option>
              </select>
            </Field>
          </div>

          {/* ── LIVE-VORSCHAU ── */}
          <div className="space-y-4 sticky top-20">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Live-Vorschau
              {!token && <span className="text-red-400 ml-2 font-normal normal-case">(nicht eingeloggt)</span>}
              {token && !testImg && <span className="text-amber-500 ml-2 font-normal normal-case">(kein Produkt mit Bild)</span>}
            </div>

            {testImg ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-gray-400 font-medium text-center">Original</div>
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <img src={testImg} alt="Original" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-center" style={{ color: '#4a5d54' }}>
                    Mit Wasserzeichen
                  </div>
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    {previewUrl && !previewErr ? (
                      // key forces unmount/remount → new network request even if URL diff is only _cb
                      <img
                        key={previewUrl}
                        src={previewUrl}
                        alt="Vorschau"
                        className="w-full h-full object-cover"
                        onError={() => setPreviewErr(true)}
                      />
                    ) : previewErr ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
                        <ImageOff size={28} />
                        <span className="text-xs">Vorschau fehlgeschlagen</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#4a5d54] rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border border-gray-200">
                <div className="text-center">
                  <ImageOff size={32} className="mx-auto mb-2 opacity-40" />
                  <div className="text-sm">
                    {token ? 'Kein Produkt mit Bild gefunden' : 'Nicht eingeloggt'}
                  </div>
                </div>
              </div>
            )}

            {previewUrl && (
              <p className="text-xs text-gray-400 break-all">
                <span className="font-medium">URL:</span> {previewUrl.substring(0, 80)}…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── APPLY-ALL DIALOG ── */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">
                Alle {productCount} Produktbilder überschreiben?
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              Fügt das Wasserzeichen zu allen bestehenden Produktbildern hinzu und
              <strong> überschreibt die Originale</strong>. Nicht rückgängig machbar.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              ✅ Einstellungen zuerst speichern — das Batch-Script liest die Config aus der Datenbank.
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-500 mb-1.5 font-medium">Im Webshop-Verzeichnis ausführen:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-gray-800">
                  npx tsx scripts/watermark-existing.ts
                </code>
                <button
                  onClick={copyCommand}
                  className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition flex-shrink-0"
                >
                  {copied ? '✓ Kopiert' : 'Kopieren'}
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Tipp: zuerst <code className="bg-gray-100 px-1 rounded">--limit 3</code> zum Testen
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setDialog(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
