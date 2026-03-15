import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [ready, setReady]             = useState(false)

  useEffect(() => {
    // Supabase setzt die Session automatisch aus dem URL-Hash
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Fehler: ' + error.message)
      setLoading(false)
    } else {
      setDone(true)
      setLoading(false)
      setTimeout(() => router.push('/account'), 3000)
    }
  }

  const strength = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 6)  s++
    if (password.length >= 10) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const strengthLabel = ['', 'Sehr schwach', 'Schwach', 'Mittel', 'Stark', 'Sehr stark'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600'][strength]

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

          {done ? (
            /* Erfolg */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Passwort geändert!</h2>
              <p className="text-gray-400 text-sm mb-4">
                Dein Passwort wurde erfolgreich aktualisiert.
              </p>
              <p className="text-xs text-gray-400">Weiterleitung zu deinem Account...</p>
            </div>

          ) : !ready ? (
            /* Warten auf Session */
            <div className="text-center py-8">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-[#C4973A] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Link wird geprüft...</p>
              <p className="text-xs text-gray-300 mt-2">
                Falls diese Seite hängt, klicke den Link aus der E-Mail erneut.
              </p>
            </div>

          ) : (
            /* Formular */
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={26} className="text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Neues Passwort</h2>
                <p className="text-gray-400 text-sm mt-1">Wähle ein sicheres neues Passwort.</p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-5">
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Neues Passwort */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Neues Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#C4973A] focus:outline-none transition text-sm"
                      placeholder="Mindestens 6 Zeichen"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Stärke-Anzeige */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Passwort bestätigen */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Passwort bestätigen
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition text-sm ${
                        confirm && confirm !== password
                          ? 'border-red-300 focus:border-red-400'
                          : confirm && confirm === password
                          ? 'border-green-300 focus:border-green-400'
                          : 'border-gray-200 focus:border-[#C4973A]'
                      }`}
                      placeholder="Passwort wiederholen"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwörter stimmen nicht überein</p>
                  )}
                  {confirm && confirm === password && (
                    <p className="text-xs text-green-600 mt-1">✓ Passwörter stimmen überein</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (!!confirm && confirm !== password)}
                  className="w-full py-3.5 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Speichert...
                    </>
                  ) : (
                    <>
                      <Lock size={17} />
                      Passwort speichern
                    </>
                  )}
                </button>
              </form>
            </>
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