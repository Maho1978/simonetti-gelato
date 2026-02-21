import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '@/components/Navbar'
import { searchStreets, isValidLangenfeldAddress } from '@/lib/langenfeld-streets'
import { Clock, MapPin, CreditCard, AlertCircle, ChevronLeft, ShieldCheck } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function Checkout({ session }: { session: Session | null }) {
  const router = useRouter()
  const { guest } = router.query
  const isGuest = guest === 'true'

  const [cart, setCart] = useState<CartItem[]>([])
  const [tip, setTip] = useState(0)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [loading, setLoading] = useState(false)
  
  // Dynamische Shop-Einstellungen
  const [settings, setSettings] = useState({ delivery_fee: 3.0, min_order_value: 15.0 })
  
  // ✅ NEU: Feature Toggles laden
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<string[]>([])

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('shop_settings').select('*').eq('id', 'main').single()
      if (data) setSettings({ delivery_fee: data.delivery_fee, min_order_value: data.min_order_value })
    }
    
    // ✅ NEU: Feature Toggles laden
    const fetchFeatureToggles = async () => {
      const { data } = await supabase
        .from('feature_toggles')
        .select('id, enabled')
        .in('id', ['card', 'sepa', 'giropay', 'sofort', 'paypal'])
      
      if (data) {
        const methods: string[] = []
        
        // Stripe Payment Methods
        data.forEach(feature => {
          if (feature.enabled) {
            if (feature.id === 'card') methods.push('card')
            if (feature.id === 'sepa') methods.push('sepa_debit')
            if (feature.id === 'giropay') methods.push('giropay')
            if (feature.id === 'sofort') methods.push('sofort')
          }
        })
        
        setEnabledPaymentMethods(methods)
        
        // PayPal separat prüfen
        const paypalEnabled = data.find(f => f.id === 'paypal')?.enabled
        if (!paypalEnabled && paymentMethod === 'paypal') {
          setPaymentMethod('stripe') // Fallback auf Stripe wenn PayPal deaktiviert
        }
      }
    }
    
    fetchSettings()
    fetchFeatureToggles()

    const savedCart = localStorage.getItem('simonetti-cart') || localStorage.getItem('cart')
    const savedTip = localStorage.getItem('orderTip')
    
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      setCart(parsedCart)
      const tipVal = parseFloat(savedTip || '0')
      setTip(tipVal)
      
      const subtotal = parsedCart.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)
      
      if (subtotal < settings.min_order_value) {
        // Optional: Warnung oder Redirect
      }
    } else {
      router.push('/')
    }
  }, [])

  // ✅ NEU: Payment Intent erst erstellen wenn Payment Methods geladen sind
  useEffect(() => {
    if (cart.length > 0 && enabledPaymentMethods.length > 0) {
      createPaymentIntent(cart, tip)
    }
  }, [cart, enabledPaymentMethods])

  const createPaymentIntent = async (cartItems: CartItem[], tipAmount: number) => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = subtotal + settings.delivery_fee + tipAmount

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: total,
          // ✅ FIXED: Dynamische Payment Methods aus Feature Toggles
          payment_method_types: enabledPaymentMethods.length > 0 
            ? enabledPaymentMethods 
            : ['card'], // Fallback auf Karte
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#8da399] font-bold text-sm mb-6 hover:text-[#4a5d54] transition-colors">
          <ChevronLeft size={18} /> ZURÜCK ZUM WARENKORB
        </button>

        <h1 className="text-5xl font-display font-bold italic mb-10" style={{ color: '#4a5d54' }}>Kasse</h1>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-display font-bold italic mb-6 flex items-center gap-3" style={{ color: '#4a5d54' }}>
                <CreditCard /> Zahlungsmethode
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${
                    paymentMethod === 'stripe'
                      ? 'border-[#4a5d54] bg-[#f9f8f4]'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg" style={{ color: '#4a5d54' }}>Karte / SEPA</div>
                  <div className="text-xs text-gray-400 mt-1 font-medium">
                    {/* ✅ NEU: Zeige verfügbare Methoden */}
                    {enabledPaymentMethods.map(m => {
                      if (m === 'card') return 'Kreditkarte'
                      if (m === 'sepa_debit') return 'SEPA'
                      if (m === 'giropay') return 'giropay'
                      if (m === 'sofort') return 'Sofort'
                      return m
                    }).join(', ')}
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${
                    paymentMethod === 'paypal'
                      ? 'border-[#4a5d54] bg-[#f9f8f4]'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg" style={{ color: '#4a5d54' }}>PayPal</div>
                  <div className="text-xs text-gray-400 mt-1 font-medium">Schnell & sicher bezahlen</div>
                </button>
              </div>
            </div>

            {paymentMethod === 'stripe' && clientSecret && (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'flat',
                    variables: { 
                      colorPrimary: '#4a5d54', 
                      borderRadius: '12px',
                      fontFamily: 'system-ui, sans-serif',
                      fontSizeBase: '16px',
                      spacingUnit: '4px',
                    },
                    rules: {
                      '.Input': {
                        border: '2px solid #f3f4f6',
                        padding: '14px 18px',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                      },
                      '.Input:focus': {
                        borderColor: '#4a5d54',
                        boxShadow: '0 0 0 4px rgba(74, 93, 84, 0.05)',
                      },
                      '.Tab': {
                        border: '2px solid #f3f4f6',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                      },
                      '.Tab:hover': {
                        borderColor: '#e5e7eb',
                      },
                      '.Tab--selected': {
                        borderColor: '#4a5d54',
                        backgroundColor: '#f9f8f4',
                      },
                    }
                  }
                }}
              >
                <StripeCheckoutForm 
                  session={session} 
                  isGuest={isGuest}
                  cart={cart}
                  total={grandTotal}
                  subtotal={subtotal}
                  deliveryFee={settings.delivery_fee}
                  tip={tip}
                />
              </Elements>
            )}

            {paymentMethod === 'paypal' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center py-16">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="font-bold text-xl mb-2">PayPal folgt in Kürze</h3>
                <p className="text-gray-400 max-w-xs mx-auto">Wir arbeiten an der PayPal-Integration. Bitte nutze vorerst die Kartenzahlung.</p>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
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
                    {/* Sorten anzeigen */}
                    {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                      <div className="text-xs text-gray-600 ml-4 mt-1">
                        🍦 {item.selectedFlavors.join(', ')}
                      </div>
                    )}
                    {/* Extras anzeigen */}
                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <div className="text-xs text-gray-600 ml-4 mt-1">
                        ➕ {item.selectedExtras.map(e => e.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-50">
                <div className="flex justify-between text-gray-400 text-sm font-medium">
                  <span>Zwischensumme</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm font-medium">
                  <span>Liefergebühr</span>
                  <span>{settings.delivery_fee.toFixed(2)} €</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-[#8da399] text-sm font-bold">
                    <span>Trinkgeld</span>
                    <span>+{tip.toFixed(2)} €</span>
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

function StripeCheckoutForm({ session, isGuest, cart, total, subtotal, deliveryFee, tip }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: session?.user?.email || '',
    phone: '',
    street: '',
    houseNumber: '',
    zip: '40764',
    city: 'Langenfeld',
    deliveryTime: 'asap',
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streetSuggestions, setStreetSuggestions] = useState<any[]>([])
  const [addressError, setAddressError] = useState('')

  const handleStreetInput = (value: string) => {
    setFormData({ ...formData, street: value })
    setAddressError('')
    if (value.length >= 2) {
      setStreetSuggestions(searchStreets(value))
    } else {
      setStreetSuggestions([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    
    // Validierung
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

      // Erstelle Order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.name,
          customer_email: isGuest ? formData.email : session?.user?.email,
          customer_phone: formData.phone || '',
          delivery_address: `${formData.street} ${formData.houseNumber}, ${formData.zip} ${formData.city}`,
          notes: formData.notes,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            flavors: item.selectedFlavors || [],
            extras: item.selectedExtras || []
          })),
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          tip: tip || 0,
          status: 'OFFEN',
          payment_method: 'STRIPE',
          payment_intent_id: paymentIntent?.id,
          user_id: session?.user?.id || null
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw new Error('Bestellung konnte nicht erstellt werden')
      }

      // Emails senden (optional - kann fehlschlagen ohne den Flow zu brechen)
      try {
        await fetch('/api/emails/send-order-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order_confirmed',
            order: { ...order, order_number: order.id },
            recipientEmail: isGuest ? formData.email : session?.user?.email
          })
        })
      } catch (emailError) {
        console.log('Email notification failed (non-critical)', emailError)
      }

      localStorage.removeItem('simonetti-cart')
      localStorage.removeItem('cart')
      localStorage.removeItem('orderTip')
      router.push(`/order-success?order_id=${order.id}`)
    } catch (error: any) {
      console.error('Checkout error:', error)
      setError(error.message || 'Zahlung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-display font-bold italic mb-6 flex items-center gap-3" style={{ color: '#4a5d54' }}>
          <MapPin /> Lieferadresse
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Vollständiger Name</label>
            <input type="text" required className="input-simonetti" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Max Mustermann" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Telefonnummer</label>
            <input type="tel" required className="input-simonetti" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0173 1234567" />
          </div>
        </div>

        {isGuest && (
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">E-Mail für Bestätigung</label>
            <input type="email" required className="input-simonetti" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="max@beispiel.de" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2 relative">
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Straße</label>
            <input type="text" required className="input-simonetti" value={formData.street} onChange={e => handleStreetInput(e.target.value)} placeholder="Straße" />
            {streetSuggestions.length > 0 && (
              <div className="absolute z-20 w-full bg-white border-2 border-gray-100 rounded-2xl mt-1 shadow-xl overflow-hidden">
                {streetSuggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => { setFormData({...formData, street: s.name}); setStreetSuggestions([]) }} className="w-full text-left px-4 py-3 hover:bg-[#f9f8f4] text-sm font-semibold transition-colors border-b last:border-0 border-gray-50">
                    {s.name} <span className="text-[10px] text-gray-400 ml-2">{s.district}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Nr.</label>
            <input type="text" required className="input-simonetti" value={formData.houseNumber} onChange={e => setFormData({...formData, houseNumber: e.target.value})} placeholder="1a" />
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
            <input type="text" disabled className="input-simonetti bg-gray-50 text-gray-400" value={formData.zip} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1">Stadt</label>
            <input type="text" disabled className="input-simonetti bg-gray-50 text-gray-400" value={formData.city} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-display font-bold italic mb-6 flex items-center gap-3" style={{ color: '#4a5d54' }}>
          <Clock /> Lieferzeit & Details
        </h2>
        <div className="space-y-4">
          <select className="input-simonetti appearance-none" value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})}>
            <option value="asap">So schnell wie möglich (ca. 30-45 Min)</option>
            {generateTimeSlots().map(slot => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
          <textarea className="input-simonetti" rows={3} placeholder="Anmerkungen zur Lieferung (z.B. 2. Etage, Klingel Name...)" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>Zahlungsinformationen</h2>
        {/* ✅ FIXED: PaymentElement mit verbessertem Styling */}
        <div className="stripe-payment-element">
          <PaymentElement />
        </div>
        {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-6 rounded-3xl font-bold text-white text-xl shadow-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none"
        style={{ backgroundColor: '#4a5d54' }}
      >
        {loading ? 'Wird verarbeitet...' : `Jetzt kostenpflichtig bestellen (${total.toFixed(2)} €)`}
      </button>
    </form>
  )
}

function generateTimeSlots() {
  const slots = []
  const now = new Date()
  let hour = now.getHours()
  let min = now.getMinutes() > 30 ? 0 : 30
  if (min === 0) hour++
  
  for (let h = Math.max(hour, 14); h <= 21; h++) {
    for (let m of [0, 30]) {
      if (h === hour && m < now.getMinutes() + 20) continue
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      slots.push({ value: time, label: `Heute um ${time} Uhr` })
    }
  }
  return slots.slice(0, 8)
}