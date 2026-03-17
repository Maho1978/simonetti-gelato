import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'

export default function CustomerLoginPage() {
  const router = useRouter()
  const { redirect } = router.query

  const [tab, setTab]           = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-Mail oder Passwort falsch.')
      setLoading(false)
    } else {
      router.push((redirect as string) || '/account')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      setError('Fehler: ' + error.message)
      setLoading(false)
    } else {
      setSuccess('✅ Bestätigungs-E-Mail gesendet! Bitte prüfe dein Postfach.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-block bg-[#C4973A] rounded-full p-4 mb-4 shadow-xl cursor-pointer hover:scale-105 transition-transform">
              <div className="text-5xl">🍦</div>
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase mb-1">
            Simonetti
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">
            G E L A T E R I A · L A N G E N F E L D
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Tab Toggle */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTab('login'); setError(''); setSuccess('') }}
              className={`flex-1 py-4 text-sm font-bold transition ${
                tab === 'login'
                  ? 'text-[#1a1a1a] border-b-2 border-[#C4973A]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); setSuccess('') }}
              className={`flex-1 py-4 text-sm font-bold transition ${
                tab === 'register'
                  ? 'text-[#1a1a1a] border-b-2 border-[#C4973A]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Registrieren
            </button>
          </div>

          <div className="p-8">

            {/* Fehler / Erfolg */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-5">
                <p className="text-red-700 text-sm font-semibold">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-5">
                <p className="text-green-700 text-sm font-semibold">{success}</p>
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">E-Mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#C4973A] focus:outline-none transition text-sm"
                      placeholder="deine@email.de"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Passwort</label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-[#C4973A] hover:text-[#a87c2a] font-semibold transition"
                    >
                      Vergessen?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[#C4973A] focus:outline-none transition text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Anmelden...</>
                  ) : 'Anmelden'}
                </button>

                <p className="text-center text-sm text-gray-400">
                  Noch kein Konto?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('register'); setError('') }}
                    className="text-[#C4973A] font-bold hover:text-[#a87c2a] transition"
                  >
                    Jetzt registrieren
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTRIEREN ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Dein Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#C4973A] focus:outline-none transition text-sm"
                    placeholder="Max Mustermann"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">E-Mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#C4973A] focus:outline-none transition text-sm"
                      placeholder="deine@email.de"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Passwort</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[#C4973A] focus:outline-none transition text-sm"
                      placeholder="Mindestens 6 Zeichen"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                  Mit der Registrierung stimmst du unseren{' '}
                  <Link href="/agb" className="text-[#C4973A] font-semibold hover:underline">AGB</Link>
                  {' '}und der{' '}
                  <Link href="/datenschutz" className="text-[#C4973A] font-semibold hover:underline">Datenschutzerklärung</Link>
                  {' '}zu.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#C4973A] text-white font-bold rounded-xl hover:bg-[#a87c2a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registrieren...</>
                  ) : 'Konto erstellen'}
                </button>

                <p className="text-center text-sm text-gray-400">
                  Bereits registriert?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError('') }}
                    className="text-[#C4973A] font-bold hover:text-[#a87c2a] transition"
                  >
                    Anmelden
                  </button>
                </p>
              </form>
            )}

          </div>
        </div>

        {/* Zurück */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition text-sm font-semibold"
          >
            <ArrowLeft size={15} />
            Zurück zur Startseite
          </Link>
        </div>

        <div className="text-center mt-4 text-gray-600 text-xs">
          <p>Eiscafé Simonetti © {new Date().getFullYear()}</p>
          <p className="mt-1">Konrad-Adenauer-Platz 2 · 40764 Langenfeld</p>
        </div>

      </div>
    </div>
  )
}