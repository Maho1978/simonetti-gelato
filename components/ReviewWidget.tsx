import { useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ReviewWidgetProps {
  productId: string
  orderId?: string
  onSubmitted?: () => void
}

export default function ReviewWidget({ productId, orderId, onSubmitted }: ReviewWidgetProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Bitte wähle eine Sterne-Bewertung!')
      return
    }

    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Bitte melde dich an um eine Bewertung abzugeben!')
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('reviews').insert({
        user_id: session.user.id,
        product_id: productId,
        order_id: orderId || null,
        rating: rating,
        comment: comment.trim() || null,
        is_approved: false
      })

      if (error) throw error

      setSubmitted(true)
      if (onSubmitted) onSubmitted()
    } catch (error) {
      console.error('Review submission error:', error)
      alert('Fehler beim Absenden der Bewertung')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold text-lg mb-1" style={{ color: '#10b981' }}>
          Vielen Dank!
        </h3>
        <p className="text-sm text-gray-600">
          Deine Bewertung wird geprüft und bald veröffentlicht.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
      <h3 className="font-bold text-lg mb-4" style={{ color: '#4a5d54' }}>
        Wie hat es dir geschmeckt?
      </h3>

      {/* Sterne */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={40}
              fill={(hover || rating) >= star ? '#f59e0b' : 'none'}
              stroke={(hover || rating) >= star ? '#f59e0b' : '#d1d5db'}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <div className="text-sm font-semibold mb-3" style={{ color: '#8da399' }}>
          {rating === 1 && '😞 Nicht so gut'}
          {rating === 2 && '😕 Okay'}
          {rating === 3 && '😊 Gut'}
          {rating === 4 && '😄 Sehr gut'}
          {rating === 5 && '🤩 Mega lecker!'}
        </div>
      )}

      {/* Kommentar */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Teile deine Erfahrung (optional)..."
        rows={3}
        maxLength={500}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#4a5d54] focus:outline-none resize-none"
      />
      
      <div className="flex justify-between items-center mt-3">
        <div className="text-xs text-gray-400">
          {comment.length}/500 Zeichen
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="px-6 py-2 rounded-xl font-bold text-white transition hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          style={{ backgroundColor: rating > 0 ? '#4a5d54' : '#d1d5db' }}
        >
          {submitting ? 'Wird gesendet...' : 'Bewertung absenden'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Review Display Component
// ============================================================

interface ReviewDisplayProps {
  productId: string
  limit?: number
}

export function ReviewDisplay({ productId, limit = 5 }: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)

  useState(() => {
    fetchReviews()
  })

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (data) {
      setReviews(data)
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
        setAvgRating(avg)
      }
    }
    setLoading(false)
  }

  if (loading) return null
  if (reviews.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Durchschnitt */}
      <div className="flex items-center gap-3">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              size={20}
              fill={avgRating >= star ? '#f59e0b' : 'none'}
              stroke={avgRating >= star ? '#f59e0b' : '#d1d5db'}
            />
          ))}
        </div>
        <div className="text-sm font-semibold" style={{ color: '#4a5d54' }}>
          {avgRating.toFixed(1)} von 5 ({reviews.length} {reviews.length === 1 ? 'Bewertung' : 'Bewertungen'})
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {reviews.map(review => (
          <div key={review.id} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={14}
                  fill={review.rating >= star ? '#f59e0b' : 'none'}
                  stroke={review.rating >= star ? '#f59e0b' : '#d1d5db'}
                />
              ))}
              <span className="text-xs text-gray-400">
                {new Date(review.created_at).toLocaleDateString('de-DE')}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-700">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}