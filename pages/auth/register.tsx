import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) throw error
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'Registrierung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4a5d54] to-[#2d3a33] flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="inline-block bg-white rounded-full p-4 mb-2">
              <div className="text-6xl">🍦</div>
            </div>
            <h1 className="text-4xl font-display font-bold italic text-white">
              SIMONETTI
            </h1>
          </Link>
          <p className="text-white/80 mt-1">Konto erstellen</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#4a5d54] focus:outline-none transition text-sm"
                placeholder="Dein Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#4a5d54] focus:outline-none transition text-sm"
                placeholder="deine@email.de"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#4a5d54] focus:outline-none transition text-sm"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Mit der Registrierung akzeptieren Sie unsere{' '}
              <Link href="/datenschutz" className="text-[#4a5d54] font-semibold hover:underline">
                Datenschutzerklärung
              </Link>
              .
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#4a5d54] text-white font-bold text-base rounded-xl hover:bg-[#3a4d44] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrieren...' : 'Registrieren'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-600 text-sm">
            Bereits ein Konto?{' '}
            <Link href="/auth/login" className="text-[#4a5d54] font-semibold hover:underline">
              Jetzt anmelden
            </Link>
          </div>
        </div>

        <div className="text-center mt-8 text-white/60 text-sm">
          <p>Eiscafé Simonetti © 2026</p>
          <p className="mt-1">Konrad-Adenauer-Platz 2, 40764 Langenfeld</p>
        </div>

      </div>
    </div>
  )
}
