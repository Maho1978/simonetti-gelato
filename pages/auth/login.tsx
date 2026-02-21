import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4a5d54] to-[#2d3a33] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-4 mb-4">
            <div className="text-6xl">🍦</div>
          </div>
          <h1 className="text-4xl font-display font-bold italic text-white mb-2">
            SIMONETTI
          </h1>
          <p className="text-white/80">
            Admin Login
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          
          <h2 className="text-2xl font-bold mb-6 text-center">Anmelden</h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#4a5d54] focus:outline-none transition"
                placeholder="admin@simonetti.de"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Passwort
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#4a5d54] focus:outline-none transition"
                placeholder="••••••••"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#4a5d54] text-white font-bold text-lg rounded-lg hover:bg-[#3a4d44] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>

          </form>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="text-sm text-gray-600 hover:text-[#4a5d54] transition"
            >
              ← Zurück zur Startseite
            </Link>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/60 text-sm">
          <p>Eiscafe Simonetti © 2026</p>
          <p className="mt-1">Konrad-Adenauer-Platz 2, 40764 Langenfeld</p>
        </div>

      </div>
    </div>
  )
}