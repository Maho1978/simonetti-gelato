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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) throw error

      // Redirect to home
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'Registrierung fehlgeschlagen')
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
            Konto erstellen
          </h1>
          <p className="text-white text-opacity-90">
            Registriere dich und starte deine Bestellung
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input"
                placeholder="Dein Name"
              />
            </div>

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
                minLength={6}
                className="input"
                placeholder="Mindestens 6 Zeichen"
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
                  <span>Registrieren...</span>
                </div>
              ) : (
                'Registrieren'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-600">
            Bereits ein Konto?{' '}
            <Link
              href="/auth/login"
              className="text-primary font-semibold hover:underline"
            >
              Jetzt anmelden
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
