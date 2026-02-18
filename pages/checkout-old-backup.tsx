import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '@/components/Navbar'

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
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      setCart(parsedCart)
      createPaymentIntent(parsedCart)
    } else {
      router.push('/')
    }
  }, [])

  const createPaymentIntent = async (cartItems: CartItem[]) => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + DELIVERY_FEE

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: total,
          metadata: {
            items: JSON.stringify(cartItems),
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
  const grandTotal = total + DELIVERY_FEE

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Kasse</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <div className="card">
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
                <div className="flex justify-between font-bold text-2xl pt-3 border-t-2">
                  <span>Gesamt:</span>
                  <span className="text-primary">{grandTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm 
                  session={session} 
                  isGuest={isGuest}
                  cart={cart}
                  total={grandTotal}
                />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutForm({ 
  session, 
  isGuest, 
  cart, 
  total 
}: { 
  session: Session | null
  isGuest: boolean
  cart: CartItem[]
  total: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState(session?.user?.email || '')
  const [street, setStreet] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    try {
      // Confirm payment
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
        delivery_address: {
          name,
          street,
          zip,
          city,
        },
        payment_intent_id: paymentIntent?.id,
      }

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      // Clear cart
      localStorage.removeItem('cart')

      // Redirect to success page
      router.push('/order-success')
    } catch (error: any) {
      setError(error.message || 'Zahlung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <h2 className="text-2xl font-display font-bold">
        {isGuest ? 'Gast-Checkout' : 'Zahlung & Lieferung'}
      </h2>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

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
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Straße & Hausnummer
            </label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">PLZ</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
                className="input"
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Zahlungsinformationen</h3>
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full btn-secondary text-lg"
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
