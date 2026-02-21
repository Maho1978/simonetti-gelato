import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,   // immer true, nicht änderbar
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const consent = localStorage.getItem('simonetti-cookie-consent')
    if (!consent) {
      // Kurze Verzögerung damit die Seite erst lädt
      setTimeout(() => setVisible(true), 800)
    }
  }, [])

  const saveConsent = (type: 'all' | 'necessary' | 'custom') => {
    const consent = {
      timestamp: new Date().toISOString(),
      necessary: true,
      analytics: type === 'all' ? true : type === 'custom' ? preferences.analytics : false,
      marketing: type === 'all' ? true : type === 'custom' ? preferences.marketing : false,
    }
    localStorage.setItem('simonetti-cookie-consent', JSON.stringify(consent))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Overlay (leicht) */}
      <div className="fixed inset-0 bg-black/20 z-[998] pointer-events-none" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[999] p-4 md:p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-start gap-4 p-6 pb-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Cookie size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                Wir verwenden Cookies 🍪
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Diese Website verwendet Cookies, um dir das beste Erlebnis zu bieten. 
                Notwendige Cookies sind für den Betrieb der Seite erforderlich. 
                Weitere Informationen findest du in unserer{' '}
                <Link href="/datenschutz" className="text-[#4a5d54] underline hover:no-underline font-medium">
                  Datenschutzerklärung
                </Link>.
              </p>
            </div>
          </div>

          {/* Details (aufklappbar) */}
          {showDetails && (
            <div className="px-6 pb-4 space-y-3 border-t border-gray-100 pt-4">
              {/* Notwendige Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-sm text-gray-800">Notwendige Cookies</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Session, Warenkorb, Sicherheit – immer aktiv
                  </div>
                </div>
                <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end pr-1 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>

              {/* Analyse Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-sm text-gray-800">Analyse Cookies</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Helfen uns die Website zu verbessern (anonymisiert)
                  </div>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                    preferences.analytics ? 'bg-[#4a5d54] justify-end pr-1' : 'bg-gray-300 justify-start pl-1'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-sm text-gray-800">Marketing Cookies</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Personalisierte Werbung und Social Media
                  </div>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                    preferences.marketing ? 'bg-[#4a5d54] justify-end pr-1' : 'bg-gray-300 justify-start pl-1'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 px-6 pb-6 pt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition order-last sm:order-first sm:mr-auto"
            >
              {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {showDetails ? 'Weniger anzeigen' : 'Details anzeigen'}
            </button>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => saveConsent('necessary')}
                className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition whitespace-nowrap"
              >
                Nur notwendige
              </button>

              {showDetails && (
                <button
                  onClick={() => saveConsent('custom')}
                  className="px-5 py-2.5 border-2 border-[#4a5d54] rounded-xl text-sm font-semibold text-[#4a5d54] hover:bg-[#4a5d54] hover:text-white transition whitespace-nowrap"
                >
                  Auswahl speichern
                </button>
              )}

              <button
                onClick={() => saveConsent('all')}
                className="px-5 py-2.5 bg-[#4a5d54] text-white rounded-xl text-sm font-bold hover:bg-[#3a4d44] transition whitespace-nowrap"
              >
                Alle akzeptieren ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}