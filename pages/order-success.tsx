import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CheckCircle } from 'lucide-react'
import ReviewForm from '@/components/ReviewForm'

export default function OrderSuccess() {
  const router = useRouter()
  const [showReview, setShowReview]       = useState(false)
  const [reviewsEnabled, setReviewsEnabled] = useState(false)
  const [reviewDone, setReviewDone]       = useState(false)

  // Kundendaten aus Query-Params (vom Checkout weitergegeben)
  const customerName  = router.query.name  as string | undefined
  const customerEmail = router.query.email as string | undefined
  const orderId       = router.query.order as string | undefined

  useEffect(() => {
    // Prüfen ob Bewertungssystem aktiv
    fetch('/api/features/reviews')
      .then(r => r.json())
      .then(d => setReviewsEnabled(d.enabled))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 animate-fade-in">
          <div className="mb-8">
            <CheckCircle size={100} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-5xl font-display font-bold text-gray-900 mb-4">
              Bestellung erfolgreich!
            </h1>
            <p className="text-xl text-gray-600">
              Vielen Dank für deine Bestellung. Wir bereiten dein Eis jetzt zu! 🍦
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-2">⏱️</div>
                <div className="font-bold text-lg mb-1">Lieferzeit</div>
                <div className="text-gray-600">30-45 Minuten</div>
              </div>
              <div>
                <div className="text-4xl mb-2">📧</div>
                <div className="font-bold text-lg mb-1">Bestätigung</div>
                <div className="text-gray-600">Per E-Mail</div>
              </div>
              <div>
                <div className="text-4xl mb-2">🚚</div>
                <div className="font-bold text-lg mb-1">Status</div>
                <div className="text-gray-600">Live-Tracking</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div className="text-left">
                <h3 className="font-bold text-lg mb-1">Gut zu wissen</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Du erhältst eine Bestätigungs-Email</li>
                  <li>✓ Unser Fahrer ruft dich an, falls nötig</li>
                  <li>✓ Bezahlung bereits abgeschlossen</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <Link
              href="/"
              className="block w-full px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all duration-300 text-center text-lg shadow-lg"
            >
              🏠 Zurück zur Startseite
            </Link>
            <Link
              href="/account"
              className="block w-full px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all duration-300 text-center"
            >
              📦 Meine Bestellungen ansehen
            </Link>
          </div>

          {/* Bewertungsformular – nur wenn Feature aktiv */}
          {reviewsEnabled && !reviewDone && (
            <div className="border-t border-gray-200 pt-8">
              {!showReview ? (
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-3">Hat alles geklappt?</p>
                  <button
                    onClick={() => setShowReview(true)}
                    className="px-6 py-3 bg-yellow-50 border-2 border-yellow-200 text-yellow-700 font-bold rounded-xl hover:bg-yellow-100 transition text-sm"
                  >
                    ⭐ Jetzt bewerten
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-lg mb-4 text-gray-900">Wie war dein Eis? 🍦</h3>
                  <ReviewForm
                    customerName={customerName}
                    customerEmail={customerEmail}
                    orderId={orderId}
                    onSuccess={() => setReviewDone(true)}
                  />
                </div>
              )}
            </div>
          )}

          {reviewDone && (
            <div className="border-t border-gray-200 pt-8 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm text-gray-500">Danke für deine Bewertung!</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Fragen? Schreib uns an{' '}
              <a href="mailto:info@eiscafe-simonetti.de" className="text-green-600 hover:underline font-semibold">
                info@eiscafe-simonetti.de
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .font-display {
          font-family: 'Playfair Display', serif;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}