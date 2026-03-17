import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError('Fehler: ' + error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#C4973A] rounded-full p-4 mb-4 shadow-xl">
            <div className="text-5xl">🍦</div>
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase mb-1">
            Simonetti
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">
            G E L A T E R I A · L A N G E N F E L D
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={26} className="text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Passwort vergessen?</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Gib deine E-Mail-Adresse ein – wir schicken dir einen Reset-Link.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-5">
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#C4973A] focus:outline-none transition text-sm"
                    placeholder="deine@email.de"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sendet...
                    </>
                  ) : (
                    <>
                      <Mail size={17} />
                      Reset-Link senden
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Erfolg */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">E-Mail gesendet!</h2>
              <p className="text-gray-500 text-sm mb-2">
                Wir haben einen Reset-Link an
              </p>
              <p className="font-bold text-gray-800 text-sm mb-4">{email}</p>
              <p className="text-gray-400 text-xs">
                Bitte prüfe auch deinen Spam-Ordner. Der Link ist 1 Stunde gültig.
              </p>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition font-semibold"
            >
              <ArrowLeft size={15} />
              Zurück zum Login
            </Link>
          </div>

        </div>

        <div className="text-center mt-6 text-gray-500 text-xs">
          <p>Eiscafé Simonetti © {new Date().getFullYear()}</p>
          <p className="mt-1">Konrad-Adenauer-Platz 2 · 40764 Langenfeld</p>
        </div>

      </div>
    </div>
  )
}