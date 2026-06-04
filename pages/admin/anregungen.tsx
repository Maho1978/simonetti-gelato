import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

export default function AnregungenAdmin({ session }: { session: Session | null }) {
  const [tab, setTab]               = useState<'feedback' | 'suggestions' | 'allergies'>('feedback')
  const [feedback, setFeedback]     = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [allergies, setAllergies]   = useState<any[]>([])

  useEffect(() => {
    supabase.from('customer_feedback').select('*').order('created_at', { ascending: false }).then(({ data }) => setFeedback(data || []))
    supabase.from('customer_suggestions').select('*').order('created_at', { ascending: false }).then(({ data }) => setSuggestions(data || []))
    supabase.from('customer_profiles').select('id, first_name, last_name, allergies, dietary_notes').not('allergies', 'eq', '{}').then(({ data }) => setAllergies(data || []))
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('customer_suggestions').update({ status }).eq('id', id)
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  const MOOD_LABELS: Record<string, string> = { fantastic: 'Fantastisch', good: 'Gut', ok: 'Geht so', bad: 'Nicht gut' }
  const STATUS_COLORS: Record<string, string> = { open: 'bg-yellow-100 text-yellow-700', planned: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }

  return (
    <AdminLayout session={session}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Feedback & Anregungen</h1>
        <div className="flex gap-2 mb-6">
          {[
            { key: 'feedback',    label: 'Bewertungen' },
            { key: 'suggestions', label: 'Wünsche' },
            { key: 'allergies',   label: 'Allergien' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${tab === t.key ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-gray-200 text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'feedback' && (
          <div className="space-y-3">
            {feedback.length === 0 && <p className="text-gray-400 text-sm">Noch kein Feedback</p>}
            {feedback.map(f => (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => <span key={n} className={n <= f.rating ? 'text-[#C4973A]' : 'text-gray-200'}>★</span>)}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString('de-DE')}</span>
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-1">{MOOD_LABELS[f.mood] || f.mood}</div>
                {f.message && <p className="text-sm text-gray-700">{f.message}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'suggestions' && (
          <div className="space-y-3">
            {suggestions.length === 0 && <p className="text-gray-400 text-sm">Noch keine Wünsche</p>}
            {suggestions.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium">{s.suggestion}</p>
                  <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('de-DE')}</span>
                </div>
                <select value={s.status || 'open'} onChange={e => updateStatus(s.id, e.target.value)}
                  className={`text-xs font-bold px-2 py-1 rounded-full border-0 ${STATUS_COLORS[s.status || 'open']}`}>
                  <option value="open">Offen</option>
                  <option value="planned">Geplant</option>
                  <option value="done">Umgesetzt</option>
                  <option value="rejected">Abgelehnt</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === 'allergies' && (
          <div className="space-y-3">
            {allergies.length === 0 && <p className="text-gray-400 text-sm">Keine Allergie-Profile</p>}
            {allergies.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="font-semibold text-gray-900 text-sm mb-2">{a.first_name} {a.last_name}</div>
                <div className="flex flex-wrap gap-2">
                  {(a.allergies || []).map((al: string) => (
                    <span key={al} className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-200">{al}</span>
                  ))}
                </div>
                {a.dietary_notes && <p className="text-xs text-gray-400 mt-2">{a.dietary_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}