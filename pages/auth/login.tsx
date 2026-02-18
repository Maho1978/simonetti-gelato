import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const { redirect } = router.query
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Redirect to intended page or home
      router.push(redirect ? String(redirect) : '/')
    } catch (error: any) {
      setError(error.message || 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <span className="text-6xl">🍕</span>
            <span className="text-4xl font-display font-extrabold text-white">
              FoodExpress
            </span>
          </Link>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Willkommen zurück!
          </h1>
          <p className="text-white text-opacity-90">
            Melde dich an, um fortzufahren
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="deine@email.de"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner !w-5 !h-5 !border-2"></div>
                  <span>Anmelden...</span>
                </div>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-600">
            Noch kein Konto?{' '}
            <Link
              href="/auth/register"
              className="text-primary font-semibold hover:underline"
            >
              Jetzt registrieren
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
