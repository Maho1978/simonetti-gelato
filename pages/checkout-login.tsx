import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { User, UserPlus, ShoppingBag, ArrowRight, Mail, Lock } from 'lucide-react'

export default function CheckoutLoginPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [mode, setMode] = useState<'select' | 'login' | 'register'>('select')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    name: '',
    phone: ''
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Bereits eingeloggt → direkt zu Checkout
        router.push('/checkout')
      }
      setSession(data.session)
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/checkout')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwörter stimmen nicht überein!')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        data: {
          name: registerData.name,
          phone: registerData.phone
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Direkt einloggen nach Registrierung
      router.push('/checkout')
    }
  }

  const handleGuestCheckout = () => {
    router.push('/checkout?guest=true')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {mode === 'select' && (
          <>
            <h1 className="font-display text-4xl font-bold mb-4 text-center">Zur Kasse</h1>
            <p className="text-center text-gray-600 mb-12">Wie möchtest du fortfahren?</p>

            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Als Gast bestellen */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-black transition">
                <div className="text-4xl mb-4">🛒</div>
                <h2 className="font-bold text-2xl mb-3">Als Gast bestellen</h2>
                <p className="text-gray-600 mb-6">
                  Schnell und einfach - keine Registrierung erforderlich
                </p>
                <button
                  onClick={handleGuestCheckout}
                  className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition flex items-center justify-center gap-2"
                >
                  Weiter als Gast
                  <ArrowRight size={20} />
                </button>
              </div>

              {/* Anmelden / Registrieren */}
              <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-8">
                <div className="text-4xl mb-4">👤</div>
                <h2 className="font-bold text-2xl mb-3">Mit Konto bestellen</h2>
                <p className="text-gray-600 mb-4">
                  Vorteile:
                </p>
                <ul className="text-sm text-gray-700 space-y-2 mb-6">
                  <li>✅ Bestellhistorie einsehen</li>
                  <li>✅ Schnellere Wiederbestellungen</li>
                  <li>✅ Gespeicherte Lieferadresse</li>
                  <li>✅ Exklusive Angebote</li>
                </ul>
                <div className="space-y-3">
                  <button
                    onClick={() => setMode('login')}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <User size={20} />
                    Anmelden
                  </button>
                  <button
                    onClick={() => setMode('register')}
                    className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
                  >
                    <UserPlus size={20} />
                    Registrieren
                  </button>
                </div>
              </div>

            </div>
          </>
        )}

        {mode === 'login' && (
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setMode('select')}
              className="text-gray-600 hover:text-black mb-6 transition flex items-center gap-2"
            >
              ← Zurück
            </button>

            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="font-bold text-2xl mb-6">Anmelden</h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                      placeholder="deine@email.de"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                      type="password"
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {loading ? 'Lädt...' : 'Anmelden'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-6">
                Noch kein Konto?{' '}
                <button onClick={() => setMode('register')} className="text-blue-600 hover:underline font-semibold">
                  Jetzt registrieren
                </button>
              </p>
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setMode('select')}
              className="text-gray-600 hover:text-black mb-6 transition flex items-center gap-2"
            >
              ← Zurück
            </button>

            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="font-bold text-2xl mb-6">Konto erstellen</h2>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    placeholder="Max Mustermann"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Telefon</label>
                  <input
                    type="tel"
                    required
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    placeholder="0173 1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">E-Mail</label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    placeholder="deine@email.de"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Passwort</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    placeholder="Mindestens 6 Zeichen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Passwort bestätigen</label>
                  <input
                    type="password"
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    placeholder="Passwort wiederholen"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {loading ? 'Erstellt Konto...' : 'Konto erstellen'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-6">
                Schon ein Konto?{' '}
                <button onClick={() => setMode('login')} className="text-blue-600 hover:underline font-semibold">
                  Jetzt anmelden
                </button>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}