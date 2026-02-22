import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '@/components/Navbar'
import { AlertCircle } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  selectedFlavors?: string[]
  selectedExtras?: any[]
  totalPrice?: number
}

const DELIVERY_FEE = 3.00
const MINIMUM_ORDER = 15.00

export default function Checkout({ session }: { session: Session | null }) {
  const router = useRouter()
  const { guest } = router.query
  const isGuest = guest === 'true'

  const [cart, setCart] = useState<CartItem[]>([])
  const [clientSecret, setClientSecret] = useState('')
  const [shopOpen, setShopOpen] = useState<boolean | null>(null)
  const [shopMessage, setShopMessage] = useState('')

  useEffect(() => {
    fetch('/api/shop-status')
      .then(r => r.json())
      .then(data => {
        setShopOpen(data.isOpen)
        setShopMessage(data.message || '')
      })
      .catch(() => setShopOpen(true))

    const savedCart = localStorage.getItem('simonetti-cart') || localStorage.getItem('cart')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      setCart(parsedCart)
      createPaymentIntent(parsedCart)
    } else {
      router.push('/')
    }
  }, [])

  const createPaymentIntent = async (cartItems: CartItem[]) => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0)
    const total = subtotal + DELIVERY_FEE

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          metadata: { items: JSON.stringify(cartItems) }
        }),
      })
      const data = await response.json()
      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0)
  const grandTotal = subtotal + DELIVERY_FEE

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Kasse</h1>

        {/* ── Shop geschlossen ── */}
        {shopOpen === false && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center mb-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Shop momentan geschlossen</h2>
            <p className="text-red-600">{shopMessage || 'Wir nehmen gerade keine Bestellungen an.'}</p>
            <p className="text-sm text-red-400 mt-2">Bitte schau zu unseren Öffnungszeiten wieder vorbei!</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 px-6 py-3 bg-white border-2 border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition"
            >
              ← Zurück zum Shop
            </button>
          </div>
        )}

        {/* ── Checkout ── */}
        {shopOpen !== false && (
          <div className="grid md:grid-cols-2 gap-8">

            {/* Bestellübersicht */}
            <div>
              <div className="card">
                <h2 className="text-2xl font-display font-bold mb-4">Bestellübersicht</h2>

                <div className="space-y-3 mb-6">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 border-b">
                      <div>
                        <span>{item.quantity}x {item.name}</span>
                        {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                          <div className="text-xs text-gray-400 mt-0.5">🍦 {item.selectedFlavors.join(', ')}</div>
                        )}
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <div className="text-xs text-gray-400">➕ {item.selectedExtras.map((e: any) => e.name || e).join(', ')}</div>
                        )}
                      </div>
                      <span className="font-semibold">
                        {(item.totalPrice || item.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-lg">
                  <div className="flex justify-between">
                    <span>Zwischensumme:</span>
                    <span>{subtotal.toFixed(2)} €</span>
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

            {/* Zahlungsformular */}
            <div>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    session={session}
                    isGuest={isGuest}
                    cart={cart}
                    total={grandTotal}
                    shopOpen={shopOpen}
                    subtotal={subtotal}
                    minimumOrder={MINIMUM_ORDER}
                  />
                </Elements>
              ) : (
                <div className="card text-center text-gray-400 py-12">
                  <div className="text-4xl mb-3 animate-pulse">🍦</div>
                  Zahlung wird vorbereitet...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckoutForm({
  session, isGuest, cart, total, shopOpen, subtotal, minimumOrder
}: {
  session: Session | null
  isGuest: boolean
  cart: CartItem[]
  total: number
  shopOpen: boolean | null
  subtotal: number
  minimumOrder: number
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

  const isBlocked = shopOpen === false || subtotal < minimumOrder

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const statusRes = await fetch('/api/shop-status')
      const statusData = await statusRes.json()
      if (!statusData.isOpen) {
        setError('Der Shop ist momentan geschlossen. Bitte versuche es zu den Öffnungszeiten.')
        return
      }
    } catch {}

    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (stripeError) throw new Error(stripeError.message)

      const orderData = {
        user_id: session?.user?.id || null,
        guest_email: isGuest ? email : null,
        customer_name: name,
        customer_email: isGuest ? email : session?.user?.email,
        items: cart,
        total,
        delivery_address: { name, street, zip, city },
        payment_intent_id: paymentIntent?.id,
        status: 'OFFEN',
      }

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      localStorage.removeItem('simonetti-cart')
      localStorage.removeItem('cart')
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
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Lieferadresse */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Lieferadresse</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input" />
          </div>

          {isGuest && (
            <div>
              <label className="block text-sm font-semibold mb-2">E-Mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Straße & Hausnummer</label>
            <input type="text" value={street} onChange={e => setStreet(e.target.value)} required className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">PLZ</label>
              <input type="text" value={zip} onChange={e => setZip(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Stadt</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} required className="input" />
            </div>
          </div>
        </div>
      </div>

      {/* Zahlung */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Zahlungsinformationen</h3>
        <PaymentElement />
      </div>

      {/* Mindestbestellwert Hinweis */}
      {subtotal < minimumOrder && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700 flex items-center gap-2">
          <AlertCircle size={15} />
          Mindestbestellwert: {minimumOrder.toFixed(2)} € (noch {(minimumOrder - subtotal).toFixed(2)} € fehlen)
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || isBlocked}
        className={`w-full text-lg transition ${isBlocked ? 'opacity-40 cursor-not-allowed btn-secondary' : 'btn-secondary'}`}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="spinner !w-5 !h-5 !border-2 !border-dark"></div>
            <span>Zahlung wird verarbeitet...</span>
          </div>
        ) : shopOpen === false
          ? '🔒 Shop geschlossen – keine Bestellung möglich'
          : subtotal < minimumOrder
          ? `Mindestbestellwert ${minimumOrder.toFixed(2)} € nicht erreicht`
          : `Jetzt bezahlen ${total.toFixed(2)} €`
        }
      </button>

      {/* Zurück zum Shop */}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="w-full text-sm text-gray-400 hover:text-gray-600 transition text-center"
      >
        ← Zurück zum Shop
      </button>
    </form>
  )
}