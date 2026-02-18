import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function OrderSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 animate-fade-in">
          <div className="mb-8">
            <CheckCircle size={100} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-5xl font-display font-bold text-gray-900 mb-4">
              Bestellung erfolgreich!
            </h1>
            <p className="text-xl text-gray-600">
              Vielen Dank für deine Bestellung. Wir bereiten dein Essen jetzt zu!
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-2">⏱️</div>
                <div className="font-bold text-lg mb-1">Lieferzeit</div>
                <div className="text-gray-600">20-30 Minuten</div>
              </div>
              <div>
                <div className="text-4xl mb-2">📧</div>
                <div className="font-bold text-lg mb-1">Bestätigung</div>
                <div className="text-gray-600">Per E-Mail</div>
              </div>
              <div>
                <div className="text-4xl mb-2">🚚</div>
                <div className="font-bold text-lg mb-1">Tracking</div>
                <div className="text-gray-600">Bald verfügbar</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="block w-full btn-primary text-lg"
            >
              Zurück zur Startseite
            </Link>
            <Link
              href="/account"
              className="block w-full px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all duration-300"
            >
              Meine Bestellungen ansehen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
