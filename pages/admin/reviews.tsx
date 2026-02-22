// pages/admin/reviews.tsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Star, Check, X, Trash2, Eye, EyeOff } from 'lucide-react'

interface Review {
  id: string
  customer_name: string
  customer_email: string | null
  product_id: string | null
  product_name: string | null
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews]     = useState<Review[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'all' | 'pending' | 'approved'>('pending')
  const [enabled, setEnabled]     = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)

    // Feature-Toggle Status laden
    const { data: toggle } = await supabase
      .from('feature_toggles')
      .select('enabled')
      .eq('id', 'reviews')
      .single()
    if (toggle) setEnabled(toggle.enabled)

    // Reviews laden
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false })
    if (filter === 'pending')  query = query.eq('is_approved', false)
    if (filter === 'approved') query = query.eq('is_approved', true)

    const { data } = await query
    if (data) setReviews(data)
    setLoading(false)
  }, [filter])

  useEffect(() => { loadData() }, [loadData])

  const toggleFeature = async () => {
    setSavingToggle(true)
    const newVal = !enabled
    await supabase
      .from('feature_toggles')
      .upsert({ id: 'reviews', name: 'Bewertungssystem', enabled: newVal }, { onConflict: 'id' })
    setEnabled(newVal)
    setSavingToggle(false)
  }

  const approve = async (id: string) => {
    await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
    loadData()
  }

  const reject = async (id: string) => {
    await supabase.from('reviews').update({ is_approved: false }).eq('id', id)
    loadData()
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Bewertung löschen?')) return
    await supabase.from('reviews').delete().eq('id', id)
    loadData()
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '–'

  const pending  = reviews.filter(r => !r.is_approved).length
  const approved = reviews.filter(r =>  r.is_approved).length

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">⭐ Bewertungen</h1>
            <p className="text-gray-400 text-sm mt-0.5">{reviews.length} gesamt · Ø {avgRating} Sterne</p>
          </div>

          {/* Aktiv/Inaktiv Toggle */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div>
              <div className="font-bold text-sm">Bewertungssystem</div>
              <div className="text-xs text-gray-400">{enabled ? 'Kunden können bewerten' : 'Bewertungen deaktiviert'}</div>
            </div>
            <button
              onClick={toggleFeature}
              disabled={savingToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-black text-yellow-500">{avgRating}</div>
            <div className="text-xs text-gray-500 mt-0.5">Ø Bewertung</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-black text-orange-500">{pending}</div>
            <div className="text-xs text-gray-500 mt-0.5">Ausstehend</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-black text-green-600">{approved}</div>
            <div className="text-xs text-gray-500 mt-0.5">Freigegeben</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition ${filter === f ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}>
              {f === 'all' ? 'Alle' : f === 'pending' ? '⏳ Ausstehend' : '✅ Freigegeben'}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="text-5xl animate-pulse">🍦</div></div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-gray-400 py-16">Keine Bewertungen gefunden.</div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id}
                className={`bg-white rounded-2xl border-2 p-5 transition ${review.is_approved ? 'border-green-100' : 'border-orange-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <StarDisplay rating={review.rating} />
                      <span className="font-bold text-gray-900">{review.customer_name}</span>
                      {review.is_approved
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✅ Freigegeben</span>
                        : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">⏳ Ausstehend</span>
                      }
                    </div>
                    {review.product_name && (
                      <div className="text-xs text-gray-400 mb-2">Produkt: {review.product_name}</div>
                    )}
                    {review.comment && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{review.comment}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {review.customer_email && ` · ${review.customer_email}`}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!review.is_approved ? (
                      <button onClick={() => approve(review.id)}
                        className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition" title="Freigeben">
                        <Check size={16} />
                      </button>
                    ) : (
                      <button onClick={() => reject(review.id)}
                        className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition" title="Zurückziehen">
                        <EyeOff size={16} />
                      </button>
                    )}
                    <button onClick={() => deleteReview(review.id)}
                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition" title="Löschen">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}