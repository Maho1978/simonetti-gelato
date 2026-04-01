import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

type Feature = {
  id: string
  name: string
  label: string
  beschreibung: string | null
  aktiv: boolean
  nur_admin: boolean
  modul: string
  sortierung: number
}

const MODUL_LABEL: Record<string, string> = {
  mitarbeiter: '📱 Mitarbeiter-App',
  inventar:    '🗄️ Inventar',
  ki:          '🤖 KI',
  haccp:       '🌡️ HACCP',
  telegram:    '📨 Telegram',
  allgemein:   '⚙️ Allgemein',
}

export default function SystemFeaturesAdmin({ session }: { session: Session | null }) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState('')
  const [saving, setSaving]     = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('features')
        .select('*')
        .order('modul')
        .order('sortierung')
      setFeatures(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  async function toggle(f: Feature) {
    setSaving(f.id)
    const neuerWert = !f.aktiv
    const { error } = await supabase
      .from('features')
      .update({ aktiv: neuerWert })
      .eq('id', f.id)
    if (!error) {
      setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, aktiv: neuerWert } : x))
      showToast(`${f.label} ${neuerWert ? 'aktiviert ✅' : 'deaktiviert ⏸️'}`)
    } else {
      showToast('❌ Fehler beim Speichern')
    }
    setSaving(null)
  }

  const module = [...new Set(features.map(f => f.modul))]
  const aktiv_count = features.filter(f => f.aktiv).length

  return (
    <AdminLayout session={session}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">🤖 System Features</h1>
          <span className="text-sm text-gray-400">{aktiv_count} / {features.length} aktiv</span>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          Masterplan-Module ein/ausschalten — Mitarbeiter-App, KI, HACCP, Telegram-Alarme.{' '}
          <a href="/admin/features" className="text-[#C4973A] underline">Shop-Features →</a>
        </p>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Lädt…</div>
        ) : (
          <div className="space-y-6">
            {module.map(modul => {
              const items = features.filter(f => f.modul === modul)
              const aktiv = items.filter(f => f.aktiv).length
              return (
                <div key={modul} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">
                      {MODUL_LABEL[modul] || modul}
                    </span>
                    <span className="text-xs text-gray-400">{aktiv}/{items.length} aktiv</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map(f => (
                      <div key={f.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{f.label}</p>
                            {f.nur_admin && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                                Admin only
                              </span>
                            )}
                          </div>
                          {f.beschreibung && (
                            <p className="text-xs text-gray-400 mt-0.5">{f.beschreibung}</p>
                          )}
                          <p className="text-xs text-gray-300 mt-0.5 font-mono">{f.name}</p>
                        </div>
                        <button
                          onClick={() => toggle(f)}
                          disabled={saving === f.id}
                          className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${
                            f.aktiv ? 'bg-[#C4973A]' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            f.aktiv ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}