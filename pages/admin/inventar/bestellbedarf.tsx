import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

type Bedarf = {
  artikel_id: string
  artikel: string
  einheit: string
  kategorie: string | null
  lieferant: string | null
  bestand: number
  mindestbestand: number
  sollbestand: number | null
  bestellmenge: number
  status: 'leer' | 'kritisch'
}

export default function InventarBestellbedarf({ session }: { session: Session | null }) {
  const router = useRouter()
  const [bedarf, setBedarf]   = useState<Bedarf[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('inventar_bestellbedarf')
        .select('*')
      setBedarf(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  function exportCSV() {
    const header = 'Artikel;Kategorie;Lieferant;Bestand;Einheit;Mindestbestand;Bestellmenge;Status'
    const rows = bedarf.map(b =>
      `${b.artikel};${b.kategorie||''};${b.lieferant||''};${b.bestand};${b.einheit};${b.mindestbestand};${b.bestellmenge};${b.status}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `bestellbedarf_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exportiert!')
  }

  // Gruppiert nach Lieferant
  const lieferanten = [...new Set(bedarf.map(b => b.lieferant || '— kein Lieferant —'))]

  return (
    <AdminLayout session={session}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <button onClick={() => router.push('/admin/inventar')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">
              ← Inventar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Bestellbedarf</h1>
            <p className="text-sm text-gray-400 mt-0.5">Artikel unter Mindestbestand</p>
          </div>
          <button onClick={exportCSV}
            className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
            CSV Export
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="text-3xl font-black text-orange-500">
              {bedarf.filter(b => b.status === 'kritisch').length}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Kritisch</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="text-3xl font-black text-red-500">
              {bedarf.filter(b => b.status === 'leer').length}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Leer</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Lädt…</div>
        ) : bedarf.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-bold text-gray-700">Alles in Ordnung</p>
            <p className="text-sm text-gray-400 mt-1">Kein Artikel unter Mindestbestand</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lieferanten.map(lief => {
              const items = bedarf.filter(b => (b.lieferant || '— kein Lieferant —') === lief)
              return (
                <div key={lief} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">🏭 {lief}</span>
                    <span className="text-xs text-gray-400">{items.length} Artikel</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map(b => (
                      <div key={b.artikel_id}
                        className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => router.push(`/admin/inventar/verlauf?id=${b.artikel_id}`)}>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{b.artikel}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {b.kategorie} · Bestand: {b.bestand} {b.einheit} · Mindest: {b.mindestbestand} {b.einheit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#C4973A] text-lg">
                            {Number(b.bestellmenge).toFixed(2)} {b.einheit}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            b.status === 'leer' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {b.status}
                          </span>
                        </div>
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