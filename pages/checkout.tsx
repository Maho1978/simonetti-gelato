import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '@/components/Navbar'
import { searchStreets, isValidLangenfeldAddress } from '@/lib/langenfeld-streets'
import { Clock, MapPin, CreditCard, AlertCircle, ChevronLeft, ShieldCheck, User, UserCheck, LogIn, Plus, Check } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  selectedFlavors?: string[]
  selectedExtras?: any[]
  totalPrice?: number
  cartId?: string
}

interface SavedAddress {
  id: string
  label: string
  street: string
  house_number: string
  zip: string
  city: string
  is_default: boolean
}

// ── Checkout Mode Selector ────────────────────────────────────
function CheckoutModeSelector({ session, mode, onSelect }: {
  session: Session | null
  mode: 'guest' | 'login' | 'loggedin' | null
  onSelect: (m: 'guest' | 'login') => void
}) {
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  if (session) return null // already logged in, no selector needed

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    if (error) setLoginError('Ungültige Email oder Passwort')
    setLoginLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegLoading(true)
    setRegError('')
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: { data: { full_name: regName } }
    })
    if (error) setRegError(error.message)
    else alert('✅ Bestätigungsmail gesendet! Bitte Email bestätigen.')
    setRegLoading(false)
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
      <h2 className="text-2xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>
        Wie möchtest du bestellen?
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Gast */}
        <button
          onClick={() => onSelect('guest')}
          className={`p-5 rounded-2xl border-2 text-left transition-all ${
            mode === 'guest' ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <User size={24} className="mb-2" style={{ color: '#4a5d54' }} />
          <div className="font-bold text-base" style={{ color: '#4a5d54' }}>Als Gast</div>
          <div className="text-xs text-gray-400 mt-1">Schnell bestellen ohne Konto</div>
        </button>

        {/* Einloggen */}
        <button
          onClick={() => onSelect('login')}
          className={`p-5 rounded-2xl border-2 text-left transition-all ${
            mode === 'login' ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <UserCheck size={24} className="mb-2" style={{ color: '#4a5d54' }} />
          <div className="font-bold text-base" style={{ color: '#4a5d54' }}>Einloggen</div>
          <div className="text-xs text-gray-400 mt-1">Adresse speichern & Vorteile</div>
        </button>
      </div>

      {/* Login Formular */}
      {mode === 'login' && (
        <div className="border-t border-gray-100 pt-6">
          {!showRegister ? (
            <>
              <h3 className="font-bold text-lg mb-4" style={{ color: '#4a5d54' }}>
                <LogIn size={18} className="inline mr-2" />Einloggen
              </h3>
              <form onSubmit={handleLogin} className="space-y-3">
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="Email" className="input-simonetti" />
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Passwort" className="input-simonetti" />
                {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
                <button type="submit" disabled={loginLoading}
                  className="w-full py-3 rounded-2xl font-bold text-white transition disabled:opacity-50"
                  style={{ backgroundColor: '#4a5d54' }}>
                  {loginLoading ? 'Einloggen...' : 'Einloggen'}
                </button>
              </form>
              <p className="text-center text-sm mt-4 text-gray-500">
                Noch kein Konto?{' '}
                <button onClick={() => setShowRegister(true)} className="font-bold underline" style={{ color: '#4a5d54' }}>
                  Jetzt registrieren
                </button>
              </p>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg mb-4" style={{ color: '#4a5d54' }}>Konto erstellen</h3>
              <form onSubmit={handleRegister} className="space-y-3">
                <input type="text" required value={regName} onChange={e => setRegName(e.target.value)}
                  placeholder="Vollständiger Name" className="input-simonetti" />
                <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="Email" className="input-simonetti" />
                <input type="password" required minLength={6} value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  placeholder="Passwort (min. 6 Zeichen)" className="input-simonetti" />
                {regError && <p className="text-red-500 text-xs font-bold">{regError}</p>}
                <button type="submit" disabled={regLoading}
                  className="w-full py-3 rounded-2xl font-bold text-white transition disabled:opacity-50"
                  style={{ backgroundColor: '#4a5d54' }}>
                  {regLoading ? 'Registrieren...' : 'Konto erstellen'}
                </button>
              </form>
              <p className="text-center text-sm mt-4 text-gray-500">
                Bereits ein Konto?{' '}
                <button onClick={() => setShowRegister(false)} className="font-bold underline" style={{ color: '#4a5d54' }}>
                  Einloggen
                </button>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Saved Address Picker ──────────────────────────────────────
function SavedAddressPicker({ userId, onSelect }: {
  userId: string
  onSelect: (addr: SavedAddress) => void
}) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('saved_addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAddresses(data)
          const def = data.find(a => a.is_default) || data[0]
          setSelected(def.id)
          onSelect(def)
        }
      })
  }, [userId])

  if (addresses.length === 0) return null

  return (
    <div className="mb-4">
      <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-2 ml-1">
        Gespeicherte Adressen
      </label>
      <div className="space-y-2">
        {addresses.map(addr => (
          <button key={addr.id} type="button"
            onClick={() => { setSelected(addr.id); onSelect(addr) }}
            className={`w-full p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              selected === addr.id ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-100 hover:border-gray-200'
            }`}>
            <div>
              <span className="font-bold text-sm" style={{ color: '#4a5d54' }}>{addr.label}</span>
              <p className="text-xs text-gray-500">{addr.street} {addr.house_number}, {addr.zip} {addr.city}</p>
            </div>
            {selected === addr.id && <Check size={18} style={{ color: '#4a5d54' }} />}
          </button>
        ))}
        <button type="button"
          onClick={() => { setSelected(null); onSelect({ id: '', label: '', street: '', house_number: '', zip: '40764', city: 'Langenfeld', is_default: false }) }}
          className={`w-full p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2 ${
            selected === null ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-100 hover:border-gray-200'
          }`}>
          <Plus size={16} style={{ color: '#4a5d54' }} />
          <span className="font-bold text-sm" style={{ color: '#4a5d54' }}>Neue Adresse</span>
        </button>
      </div>
    </div>
  )
}

// ── Main Checkout Page ────────────────────────────────────────
export default function Checkout({ session }: { session: Session | null }) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [tip, setTip] = useState(0)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [settings, setSettings] = useState({ delivery_fee: 3.0, min_order_value: 15.0 })
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<string[]>([])
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'login' | null>(session ? null : null)

  const isLoggedIn = !!session

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('shop_settings').select('*').eq('id', 'main').single()
      if (data) setSettings({ delivery_fee: data.delivery_fee, min_order_value: data.min_order_value })
    }
    const fetchFeatureToggles = async () => {
      const { data } = await supabase.from('feature_toggles').select('id, enabled').in('id', ['card', 'sepa', 'giropay', 'sofort', 'paypal'])
      if (data) {
        const methods: string[] = []
        data.forEach(f => {
          if (f.enabled) {
            if (f.id === 'card') methods.push('card')
            if (f.id === 'sepa') methods.push('sepa_debit')
            if (f.id === 'giropay') methods.push('giropay')
            if (f.id === 'sofort') methods.push('sofort')
          }
        })
        setEnabledPaymentMethods(methods.length > 0 ? methods : ['card'])
      }
    }
    fetchSettings()
    fetchFeatureToggles()
    const savedCart = localStorage.getItem('simonetti-cart') || localStorage.getItem('cart')
    const savedTip = localStorage.getItem('orderTip')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      setCart(parsedCart)
      setTip(parseFloat(savedTip || '0'))
    } else {
      router.push('/')
    }
  }, [])

  useEffect(() => {
    const shouldCreate = isLoggedIn ? cart.length > 0 : (checkoutMode === 'guest' && cart.length > 0)
    if (shouldCreate && enabledPaymentMethods.length > 0) {
      createPaymentIntent(cart, tip)
    }
  }, [cart, enabledPaymentMethods, checkoutMode, isLoggedIn])

  const createPaymentIntent = async (cartItems: CartItem[], tipAmount: number) => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0)
    const total = subtotal + settings.delivery_fee + tipAmount
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          payment_method_types: enabledPaymentMethods,
          metadata: {
            items: JSON.stringify(cartItems.map(i => ({ name: i.name, qty: i.quantity }))),
            tip: tipAmount.toFixed(2),
          }
        }),
      })
      const data = await response.json()
      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0)
  const grandTotal = subtotal + settings.delivery_fee + tip

  // Show form only if logged in OR guest mode selected
  const showForm = isLoggedIn || checkoutMode === 'guest'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#8da399] font-bold text-sm mb-6 hover:text-[#4a5d54] transition-colors">
          <ChevronLeft size={18} /> ZURÜCK ZUM WARENKORB
        </button>

        <h1 className="text-5xl font-display font-bold italic mb-10" style={{ color: '#4a5d54' }}>Kasse</h1>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-0">

            {/* LOGIN / GAST SELECTOR */}
            {!isLoggedIn && (
              <CheckoutModeSelector
                session={session}
                mode={checkoutMode}
                onSelect={setCheckoutMode}
              />
            )}

            {/* Eingeloggt Badge */}
            {isLoggedIn && (
              <div className="bg-[#f0f9f4] border border-[#8da399] rounded-2xl px-5 py-3 mb-6 flex items-center gap-3">
                <UserCheck size={20} style={{ color: '#4a5d54' }} />
                <div>
                  <span className="font-bold text-sm" style={{ color: '#4a5d54' }}>Eingeloggt als </span>
                  <span className="text-sm text-gray-600">{session.user.email}</span>
                </div>
              </div>
            )}

            {/* ZAHLUNGSMETHODE */}
            {showForm && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
                <h2 className="text-2xl font-display font-bold italic mb-6 flex items-center gap-3" style={{ color: '#4a5d54' }}>
                  <CreditCard /> Zahlungsmethode
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setPaymentMethod('stripe')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'stripe' ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="font-bold text-lg" style={{ color: '#4a5d54' }}>Karte / SEPA</div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">
                      {enabledPaymentMethods.map(m => {
                        if (m === 'card') return 'Kreditkarte'
                        if (m === 'sepa_debit') return 'SEPA'
                        if (m === 'giropay') return 'giropay'
                        if (m === 'sofort') return 'Sofort'
                        return m
                      }).join(', ')}
                    </div>
                  </button>
                  <button onClick={() => setPaymentMethod('paypal')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'paypal' ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="font-bold text-lg" style={{ color: '#4a5d54' }}>PayPal</div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">Schnell & sicher</div>
                  </button>
                </div>
              </div>
            )}

            {/* STRIPE FORM */}
            {showForm && paymentMethod === 'stripe' && clientSecret && (
              <Elements stripe={stripePromise} options={{
                clientSecret,
                appearance: {
                  theme: 'flat',
                  variables: { colorPrimary: '#4a5d54', borderRadius: '12px', fontFamily: 'system-ui, sans-serif', fontSizeBase: '16px' },
                  rules: {
                    '.Input': { border: '2px solid #f3f4f6', padding: '14px 18px', fontSize: '0.95rem', fontWeight: '600' },
                    '.Input:focus': { borderColor: '#4a5d54', boxShadow: '0 0 0 4px rgba(74,93,84,0.05)' },
                    '.Tab': { border: '2px solid #f3f4f6', borderRadius: '12px', padding: '12px 16px', fontWeight: '600' },
                    '.Tab--selected': { borderColor: '#4a5d54', backgroundColor: '#f9f8f4' },
                  }
                }
              }}>
                <StripeCheckoutForm
                  session={session}
                  isGuest={checkoutMode === 'guest'}
                  cart={cart}
                  total={grandTotal}
                  subtotal={subtotal}
                  deliveryFee={settings.delivery_fee}
                  tip={tip}
                />
              </Elements>
            )}

            {showForm && paymentMethod === 'paypal' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center py-16">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="font-bold text-xl mb-2">PayPal folgt in Kürze</h3>
                <p className="text-gray-400 max-w-xs mx-auto">Bitte nutze vorerst die Kartenzahlung.</p>
              </div>
            )}

            {/* Hint wenn noch kein Modus gewählt */}
            {!showForm && !isLoggedIn && (
              <div className="bg-[#f9f8f4] rounded-2xl p-6 text-center text-gray-400">
                <p className="text-sm">Wähle oben wie du bestellen möchtest 👆</p>
              </div>
            )}
          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-28">
              <h2 className="text-2xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>Übersicht</h2>
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.cartId || item.id} className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm">
                        <span className="font-bold text-[#4a5d54]">{item.quantity}x</span> {item.name}
                      </div>
                      <div className="font-bold text-sm">{(item.totalPrice || item.price * item.quantity).toFixed(2)} €</div>
                    </div>
                    {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                      <div className="text-xs text-gray-500 ml-4">🍦 {item.selectedFlavors.join(', ')}</div>
                    )}
                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <div className="text-xs text-gray-500 ml-4">➕ {item.selectedExtras.map((e: any) => e.name).join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-6 border-t border-gray-50">
                <div className="flex justify-between text-gray-400 text-sm font-medium">
                  <span>Zwischensumme</span><span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm font-medium">
                  <span>Liefergebühr</span><span>{settings.delivery_fee.toFixed(2)} €</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-[#8da399] text-sm font-bold">
                    <span>Trinkgeld</span><span>+{tip.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4">
                  <span className="font-display font-bold text-xl italic" style={{ color: '#4a5d54' }}>Gesamt</span>
                  <span className="font-bold text-3xl" style={{ color: '#4a5d54' }}>{grandTotal.toFixed(2)} €</span>
                </div>
              </div>
              <div className="mt-8 p-4 bg-[#f9f8f4] rounded-2xl flex items-center gap-3">
                <ShieldCheck className="text-[#4a5d54]" size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8da399]">Sichere SSL-Verschlüsselung</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .font-display { font-family: 'Playfair Display', serif; }
        .input-simonetti {
          width: 100%;
          padding: 14px 18px;
          border-radius: 16px;
          border: 2px solid #f3f4f6;
          background-color: #ffffff;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        .input-simonetti:focus {
          outline: none;
          border-color: #4a5d54;
          box-shadow: 0 0 0 4px rgba(74, 93, 84, 0.05);
        }
      `}</style>
    </div>
  )
}

// ── Stripe Checkout Form ──────────────────────────────────────
function StripeCheckoutForm({ session, isGuest, cart, total, subtotal, deliveryFee, tip }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: session?.user?.user_metadata?.full_name || '',
    email: session?.user?.email || '',
    phone: '',
    street: '',
    houseNumber: '',
    zip: '40764',
    city: 'Langenfeld',
    deliveryTime: 'asap',
    notes: '',
    saveAddress: false,
    addressLabel: 'Zuhause'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streetSuggestions, setStreetSuggestions] = useState<any[]>([])
  const [addressError, setAddressError] = useState('')
  const [usingSavedAddress, setUsingSavedAddress] = useState(false)

  const handleSavedAddressSelect = (addr: SavedAddress) => {
    if (!addr.street) {
      setUsingSavedAddress(false)
      setFormData(prev => ({ ...prev, street: '', houseNumber: '' }))
      return
    }
    setUsingSavedAddress(true)
    setFormData(prev => ({
      ...prev,
      street: addr.street,
      houseNumber: addr.house_number,
      zip: addr.zip,
      city: addr.city
    }))
  }

  const handleStreetInput = (value: string) => {
    setFormData({ ...formData, street: value })
    setAddressError('')
    setUsingSavedAddress(false)
    if (value.length >= 2) setStreetSuggestions(searchStreets(value))
    else setStreetSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    if (!isValidLangenfeldAddress(formData.street, formData.zip)) {
      setAddressError('Diese Straße liegt leider nicht in unserem Liefergebiet (Langenfeld).')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })
      if (stripeError) throw new Error(stripeError.message)

      const deliveryAddress = `${formData.street} ${formData.houseNumber}, ${formData.zip} ${formData.city}`

      // Adresse speichern falls gewünscht
      if (session && formData.saveAddress && formData.street) {
        await supabase.from('saved_addresses').insert({
          user_id: session.user.id,
          label: formData.addressLabel,
          street: formData.street,
          house_number: formData.houseNumber,
          zip: formData.zip,
          city: formData.city,
          is_default: false
        })
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.name,
          customer_email: isGuest ? formData.email : session?.user?.email,
          customer_phone: formData.phone || '',
          delivery_address: deliveryAddress,
          notes: formData.notes,
          items: cart.map((item: CartItem) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            flavors: item.selectedFlavors || [],
            extras: item.selectedExtras || []
          })),
          subtotal,
          delivery_fee: deliveryFee,
          total,
          tip: tip || 0,
          status: 'OFFEN',
          payment_method: 'stripe',
          payment_intent_id: paymentIntent?.id,
          user_id: session?.user?.id || null
        })
        .select()
        .single()

      if (orderError) throw new Error('Bestellung konnte nicht erstellt werden')

      // Email senden
      try {
        await fetch('/api/emails/send-order-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order_confirmed',
            order: { ...order, customer_email: isGuest ? formData.email : session?.user?.email },
            recipientEmail: isGuest ? formData.email : session?.user?.email
          })
        })
      } catch (emailError) {
        console.log('Email non-critical error', emailError)
      }

      localStorage.removeItem('simonetti-cart')
      localStorage.removeItem('cart')
      localStorage.removeItem('orderTip')
      router.push(`/order-success?order_id=${order.id}`)
    } catch (error: any) {
      setError(error.message || 'Zahlung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* LIEFERADRESSE */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-display font-bold italic mb-6 flex items-center gap-3" style={{ color: '#4a5d54' }}>
          <MapPin /> Lieferadresse
        </h2>

        {/* Gespeicherte Adressen (nur eingeloggte Kunden) */}
        {session && (
          <SavedAddressPicker userId={session.user.id} onSelect={handleSavedAddressSelect} />
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Vollständiger Name</label>
            <input type="text" required className="input-simonetti" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Max Mustermann" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Telefonnummer</label>
            <input type="tel" required className="input-simonetti" value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="0173 1234567" />
          </div>
        </div>

        {/* Email (nur Gäste) */}
        {isGuest && (
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">E-Mail für Bestätigung</label>
            <input type="email" required className="input-simonetti" value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="max@beispiel.de" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2 relative">
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Straße</label>
            <input type="text" required className={`input-simonetti ${usingSavedAddress ? 'bg-[#f9f8f4]' : ''}`}
              value={formData.street} onChange={e => handleStreetInput(e.target.value)} placeholder="Straße" />
            {streetSuggestions.length > 0 && (
              <div className="absolute z-20 w-full bg-white border-2 border-gray-100 rounded-2xl mt-1 shadow-xl overflow-hidden">
                {streetSuggestions.map((s, i) => (
                  <button key={i} type="button"
                    onClick={() => { setFormData({ ...formData, street: s.name }); setStreetSuggestions([]) }}
                    className="w-full text-left px-4 py-3 hover:bg-[#f9f8f4] text-sm font-semibold transition-colors border-b last:border-0 border-gray-50">
                    {s.name} <span className="text-[10px] text-gray-400 ml-2">{s.district}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Nr.</label>
            <input type="text" required className="input-simonetti" value={formData.houseNumber}
              onChange={e => setFormData({ ...formData, houseNumber: e.target.value })} placeholder="1a" />
          </div>
        </div>

        {addressError && (
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
            <AlertCircle size={14} /> {addressError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">PLZ</label>
            <input disabled className="input-simonetti bg-gray-50 text-gray-400" value={formData.zip} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Stadt</label>
            <input disabled className="input-simonetti bg-gray-50 text-gray-400" value={formData.city} />
          </div>
        </div>

        {/* Adresse speichern (nur eingeloggte Kunden) */}
        {session && !usingSavedAddress && (
          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.saveAddress}
                onChange={e => setFormData({ ...formData, saveAddress: e.target.checked })}
                className="w-4 h-4" />
              <span className="text-sm font-semibold text-gray-600">Adresse speichern</span>
            </label>
            {formData.saveAddress && (
              <div className="mt-3">
                <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Bezeichnung</label>
                <div className="flex gap-2">
                  {['Zuhause', 'Arbeit', 'Andere'].map(label => (
                    <button key={label} type="button"
                      onClick={() => setFormData({ ...formData, addressLabel: label })}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${formData.addressLabel === label ? 'border-[#4a5d54] bg-[#f9f8f4] text-[#4a5d54]' : 'border-gray-100 text-gray-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIEFERZEIT */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-display font-bold italic mb-6 flex items-center gap-3" style={{ color: '#4a5d54' }}>
          <Clock /> Lieferzeit & Details
        </h2>
        <div className="space-y-4">
          <select className="input-simonetti appearance-none" value={formData.deliveryTime}
            onChange={e => setFormData({ ...formData, deliveryTime: e.target.value })}>
            <option value="asap">So schnell wie möglich (ca. 30-45 Min)</option>
            {generateTimeSlots().map(slot => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
          <textarea className="input-simonetti" rows={3}
            placeholder="Anmerkungen (z.B. 2. Etage, Klingel Name...)"
            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
        </div>
      </div>

      {/* ZAHLUNG */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>Zahlungsinformationen</h2>
        <PaymentElement />
        {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}
      </div>

      <button type="submit" disabled={loading || !stripe}
        className="w-full py-6 rounded-3xl font-bold text-white text-xl shadow-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none"
        style={{ backgroundColor: '#4a5d54' }}>
        {loading ? 'Wird verarbeitet...' : `Jetzt kostenpflichtig bestellen (${total.toFixed(2)} €)`}
      </button>
    </form>
  )
}

function generateTimeSlots() {
  const slots = []
  const now = new Date()
  let hour = now.getHours()
  for (let h = Math.max(hour + 1, 14); h <= 21; h++) {
    for (let m of [0, 30]) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      slots.push({ value: time, label: `Heute um ${time} Uhr` })
    }
  }
  return slots.slice(0, 8)
}