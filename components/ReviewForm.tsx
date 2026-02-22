// components/ReviewForm.tsx
import { useState } from 'react'
import { Star } from 'lucide-react'

interface ReviewFormProps {
  customerName?: string
  customerEmail?: string
  orderId?: string
  onSuccess?: () => void
}

export default function ReviewForm({ customerName, customerEmail, orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [comment, setComment] = useState('')
  const [name, setName]       = useState(customerName || '')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError('Bitte wähle eine Sternebewertung'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name:  name,
        customer_email: customerEmail || null,
        rating,
        comment:        comment || null,
        order_id:       orderId || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Fehler beim Senden')
    } else {
      setDone(true)
      onSuccess?.()
    }
    setLoading(false)
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">🎉</div>
      <h3 className="font-bold text-lg text-gray-900">Vielen Dank!</h3>
      <p className="text-gray-500 text-sm mt-1">Deine Bewertung wird geprüft und bald veröffentlicht.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dein Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder="Max Mustermann"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-gray-900 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Bewertung *</label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`transition-colors ${
                  i <= (hover || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 fill-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            {['', 'Sehr schlecht', 'Schlecht', 'Okay', 'Gut', 'Ausgezeichnet'][rating]}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kommentar (optional)</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="Wie war dein Eis? 🍦"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-gray-900 transition resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Wird gesendet...' : 'Bewertung abschicken ⭐'}
      </button>
    </form>
  )
}