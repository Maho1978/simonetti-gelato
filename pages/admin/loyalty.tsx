import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'

interface Tier {
  id: string
  name: string
  points_from: number
  points_to: number | null
  reward_label: string
  reward_type: string
  reward_value: number
  redeem_points: number
  icon: string
  sort_order: number
}

export default function LoyaltyAdmin({ session }: { session: Session | null }) {
  const [tiers, setTiers]   = useState<Tier[]>([])
  const [editing, setEditing] = useState<Tier | null>(null)
  const [toast, setToast]   = useState('')
  const [stats, setStats]   = useState<{ total_users: number; total_points: number; avg_points: number } | null>(null)

  useEffect(() => { fetchTiers(); fetchStats() }, [])

  const fetchTiers = async () => {
    const { data } = await supabase.from('loyalty_tiers').select('*').order('sort_order')
    setTiers(data || [])
  }

  const fetchStats = async () => {
    const { data } = await supabase.from('customer_profiles').select('loyalty_points').gt('loyalty_points', 0)
    if (data) {
      const total = data.reduce((s, r) => s + r.loyalty_points, 0)
      setStats({ total_users: data.length, total_points: total, avg_points: Math.round(total / data.length) })
    }
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const saveTier = async () => {
    if (!editing) return
    await supabase.from('loyalty_tiers').update({
      reward_label:  editing.reward_label,
      reward_value:  editing.reward_value,
      redeem_points: editing.redeem_points,
      points_from:   editing.points_from,
      points_to:     editing.points_to,
    }).eq('id', editing.id)
    await fetchTiers()
    setEditing(null)
    showToast('Gespeichert!')
  }

  const givePoints = async (userId: string, points: number) => {
    await supabase.from('loyalty_transactions').insert({ user_id: userId, points, reason: 'manual' })
    showToast(`${points} Punkte vergeben!`)
  }

  return (
    <AdminLayout session={session}>
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">{toast}</div>}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Treuepunkte-System</h1>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-[#C4973A]">{stats.total_users}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Aktive Kunden</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-[#C4973A]">{stats.total_points}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Punkte gesamt</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-[#C4973A]">{stats.avg_points}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Durchschnitt</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Stufen bearbeiten</h2>
          <div className="space-y-3">
            {tiers.map(tier => (
              <div key={tier.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="font-bold text-gray-700 w-20">{tier.name}</div>
                <div className="text-sm text-gray-400 flex-1">
                  {tier.points_from} - {tier.points_to ?? 'inf'} Punkte erreichen |
                  {tier.redeem_points} Punkte einloesen
                </div>
                <div className="text-sm font-semibold text-[#C4973A]">{tier.reward_label}</div>
                <div className="text-sm text-gray-500">{tier.reward_value} EUR</div>
                <button onClick={() => setEditing({ ...tier })}
                  className="px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-lg hover:bg-black transition">
                  Bearbeiten
                </button>
              </div>
            ))}
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="font-bold text-gray-900 text-lg mb-4">{editing.name} bearbeiten</h3>
              <div className="space-y-3">
                {[
                  { label: 'Belohnungs-Label', key: 'reward_label', type: 'text' },
                  { label: 'Wert (EUR)',        key: 'reward_value', type: 'number' },
                  { label: 'Punkte zum Einloesen', key: 'redeem_points', type: 'number' },
                  { label: 'Punkte ab (Stufe erreichen)', key: 'points_from', type: 'number' },
                  { label: 'Punkte bis',        key: 'points_to',    type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">{f.label}</label>
                    <input type={f.type} value={(editing as any)[f.key] || ''}
                      onChange={e => setEditing(prev => ({ ...prev!, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end mt-5">
                <button onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl">Abbrechen</button>
                <button onClick={saveTier} className="px-5 py-2 bg-[#C4973A] text-white text-sm font-bold rounded-xl hover:bg-[#a87b20]">Speichern</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <p className="font-bold mb-1">Punkte manuell vergeben</p>
          <p className="text-amber-600">Gehe zu <a href="/admin/customers" className="underline font-bold">Kunden</a> und waehle einen Kunden aus um Punkte manuell zu vergeben.</p>
        </div>
      </div>
    </AdminLayout>
  )
}