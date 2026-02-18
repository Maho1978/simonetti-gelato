import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import Navbar from '@/components/Navbar'
import { searchStreets, isValidLangenfeldAddress } from '@/lib/langenfeld-streets'
import { Clock, MapPin, CreditCard, AlertCircle } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

const DELIVERY_FEE = 3.00
const MINIMUM_ORDER = 15.00

export default function Checkout({ session }: { session: Session | null }) {
  const router = useRouter()
  const { guest } = router.query
  const isGuest = guest === 'true'

  const [cart, setCart] = useState<CartItem[]>([])
  const [tip, setTip] = useState(0)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    const savedTip = localStorage.getItem('orderTip')
    
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      setCart(parsedCart)
      setTip(parseFloat(savedTip || '0'))
      
      const subtotal = parsedCart.reduce((sum: number, item: CartItem) => 
        sum + item.price * item.quantity, 0)
      
      if (subtotal < MINIMUM_ORDER) {
        alert('Mindestbestellwert nicht erreicht!')
        router.push('/')
        return
      }
      
      createPaymentIntent(parsedCart, parseFloat(savedTip || '0'))
    } else {
      router.push('/')
    }
  }, [])

  const createPaymentIntent = async (cartItems: CartItem[], tipAmount: number) => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = subtotal + DELIVERY_FEE + tipAmount

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: total,
          payment_method_types: ['card', 'sepa_debit', 'giropay', 'sofort'],
          metadata: {
            items: JSON.stringify(cartItems),
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

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const grandTotal = total + DELIVERY_FEE + tip

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Kasse</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="card sticky top-24">
              <h2 className="text-2xl font-display font-bold mb-4">
                Bestellübersicht
              </h2>

              <div className="space-y-3 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between py-2 border-b">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold">
                      {(item.price * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-lg">
                <div className="flex justify-between">
                  <span>Zwischensumme:</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Lieferung:</span>
                  <span>{DELIVERY_FEE.toFixed(2)} €</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>Trinkgeld:</span>
                    <span>+{tip.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-2xl pt-3 border-t-2">
                  <span>Gesamt:</span>
                  <span className="text-primary">{grandTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-3">
            {/* Payment Method Selection */}
            <div className="card mb-6">
              <h2 className="text-2xl font-display font-bold mb-4 flex items-center">
                <CreditCard className="mr-2" />
                Zahlungsmethode wählen
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-primary bg-primary bg-opacity-5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl font-bold mb-2">Karte / SEPA</div>
                  <div className="text-sm text-gray-600">
                    Kreditkarte, SEPA, giropay, Sofort
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-primary bg-primary bg-opacity-5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl font-bold mb-2">PayPal</div>
                  <div className="text-sm text-gray-600">
                    Schnell & sicher
                  </div>
                </button>
              </div>
            </div>

            {/* Stripe Checkout */}
            {paymentMethod === 'stripe' && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCheckoutForm 
                  session={session} 
                  isGuest={isGuest}
                  cart={cart}
                  total={grandTotal}
                  tip={tip}
                />
              </Elements>
            )}

            {/* PayPal Checkout */}
            {paymentMethod === 'paypal' && (
              <PayPalScriptProvider options={{ 
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
                currency: 'EUR'
              }}>
                <PayPalCheckoutForm
                  session={session}
                  isGuest={isGuest}
                  cart={cart}
                  total={grandTotal}
                  tip={tip}
                />
              </PayPalScriptProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StripeCheckoutForm({ 
  session, 
  isGuest, 
  cart, 
  total,
  tip
}: { 
  session: Session | null
  isGuest: boolean
  cart: CartItem[]
  total: number
  tip: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState(session?.user?.email || '')
  const [street, setStreet] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [zip, setZip] = useState('40764')
  const [city, setCity] = useState('Langenfeld')
  const [deliveryTime, setDeliveryTime] = useState('asap')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streetSuggestions, setStreetSuggestions] = useState<any[]>([])
  const [addressError, setAddressError] = useState('')

  const handleStreetInput = (value: string) => {
    setStreet(value)
    setAddressError('')
    
    if (value.length >= 2) {
      const suggestions = searchStreets(value)
      setStreetSuggestions(suggestions)
    } else {
      setStreetSuggestions([])
    }
  }

  const selectStreet = (streetName: string) => {
    setStreet(streetName)
    setStreetSuggestions([])
  }

  const validateAddress = () => {
    if (zip !== '40764') {
      setAddressError('Lieferung nur nach Langenfeld (PLZ 40764) möglich!')
      return false
    }
    
    if (!isValidLangenfeldAddress(street, zip)) {
      setAddressError('Diese Straße ist nicht in unserem Liefergebiet in Langenfeld.')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return
    if (!validateAddress()) return

    setLoading(true)
    setError('')

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // Create order in database
      const orderData = {
        user_id: session?.user?.id || null,
        guest_email: isGuest ? email : null,
        items: cart,
        total,
        tip,
        delivery_address: {
          name,
          street: `${street} ${houseNumber}`,
          zip,
          city,
        },
        delivery_time: deliveryTime,
        notes,
        payment_intent_id: paymentIntent?.id,
      }

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      localStorage.removeItem('cart')
      localStorage.removeItem('orderTip')
      router.push('/order-success')
    } catch (error: any) {
      setError(error.message || 'Zahlung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const deliveryTimeOptions = [
    { value: 'asap', label: 'So schnell wie möglich (~30 Min)' },
    ...generateTimeSlots()
  ]

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <h2 className="text-2xl font-display font-bold flex items-center">
        <MapPin className="mr-2" />
        {isGuest ? 'Gast-Checkout' : 'Lieferung'}
      </h2>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
        <div className="flex items-start space-x-2">
          <MapPin className="text-blue-600 flex-shrink-0 mt-1" size={20} />
          <div className="text-sm text-blue-900">
            <strong>Liefergebiet:</strong> Wir liefern nur innerhalb von Langenfeld (PLZ 40764)
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Lieferadresse</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
              placeholder="Max Mustermann"
            />
          </div>

          {isGuest && (
            <div>
              <label className="block text-sm font-semibold mb-2">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="max@beispiel.de"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 relative">
              <label className="block text-sm font-semibold mb-2">Straße</label>
              <input
                type="text"
                value={street}
                onChange={(e) => handleStreetInput(e.target.value)}
                onBlur={() => setTimeout(() => setStreetSuggestions([]), 200)}
                required
                className={`input ${addressError ? 'border-red-500' : ''}`}
                placeholder="Hauptstraße"
              />
              
              {streetSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border-2 border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {streetSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectStreet(suggestion.name)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-semibold">{suggestion.name}</div>
                      {suggestion.district && (
                        <div className="text-sm text-gray-600">{suggestion.district}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Nr.</label>
              <input
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                required
                className="input"
                placeholder="42"
              />
            </div>
          </div>

          {addressError && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">{addressError}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">PLZ</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value)
                  setAddressError('')
                }}
                required
                className={`input ${zip !== '40764' ? 'border-red-500' : ''}`}
                placeholder="40764"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Stadt</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="input"
                placeholder="Langenfeld"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Time */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center">
          <Clock className="mr-2" size={20} />
          Lieferzeit
        </h3>
        <select
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          className="input"
        >
          {deliveryTimeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Anmerkungen (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows={3}
          placeholder="z.B. Klingel defekt, bitte anrufen"
        />
      </div>

      {/* Payment Element */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Zahlungsinformationen</h3>
        <PaymentElement />
      </div>

      <div className="bg-gray-50 p-4 rounded-xl">
        <div className="flex justify-between text-2xl font-bold">
          <span>Gesamtbetrag:</span>
          <span className="text-primary">{total.toFixed(2)} €</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading || !!addressError}
        className={`w-full text-lg ${
          !stripe || loading || addressError
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed py-4 px-6 rounded-xl'
            : 'btn-secondary'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="spinner !w-5 !h-5 !border-2 !border-dark"></div>
            <span>Zahlung wird verarbeitet...</span>
          </div>
        ) : (
          `Jetzt bezahlen ${total.toFixed(2)} €`
        )}
      </button>
    </form>
  )
}

function PayPalCheckoutForm({
  session,
  isGuest,
  cart,
  total,
  tip
}: {
  session: Session | null
  isGuest: boolean
  cart: CartItem[]
  total: number
  tip: number
}) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: session?.user?.email || '',
    street: '',
    houseNumber: '',
    zip: '40764',
    city: 'Langenfeld',
    deliveryTime: 'asap',
    notes: '',
  })

  // Similar form as Stripe but with PayPal button at the end
  return (
    <div className="card">
      <h2 className="text-2xl font-display font-bold mb-6">
        PayPal Checkout
      </h2>
      
      <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl mb-6">
        <p className="text-sm text-yellow-900">
          PayPal-Integration folgt in Kürze. Bitte nutzen Sie vorerst die Kreditkarten-Zahlung.
        </p>
      </div>

      {/* Form fields similar to Stripe... */}
    </div>
  )
}

function generateTimeSlots() {
  const slots = []
  const now = new Date()
  const startHour = now.getHours() + 1
  
  for (let hour = startHour; hour <= 22; hour++) {
    for (let minute of [0, 30]) {
      if (hour === 22 && minute === 30) continue
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push({
        value: time,
        label: `Heute um ${time} Uhr`
      })
    }
  }
  
  return slots.slice(0, 10) // Max 10 slots
}
