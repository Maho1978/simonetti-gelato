import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '@/components/Navbar'
import { AlertCircle, Tag, X, Check, Loader2 } from 'lucide-react'

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

interface AppliedVoucher {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discountAmount: number
}

const DELIVERY_FEE  = 3.00
const MINIMUM_ORDER = 15.00
const TIP_OPTIONS   = [0, 5, 10, 15] // Prozent

// ── Gutschein validieren ──────────────────────────────────────
async function validateVoucher(
  code: string,
  subtotal: number
): Promise<{ voucher: AppliedVoucher | null; error: string | null }> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (error || !data) return { voucher: null, error: 'Ungültiger Gutscheincode.' }

  if (data.valid_until && new Date(data.valid_until) < new Date())
    return { voucher: null, error: 'Dieser Gutschein ist abgelaufen.' }

  if (data.current_uses >= data.max_uses)
    return { voucher: null, error: 'Dieser Gutschein wurde bereits zu oft eingelöst.' }

  if (subtotal < data.min_order_value)
    return { voucher: null, error: `Mindestbestellwert für diesen Gutschein: ${data.min_order_value.toFixed(2)} €` }

  const discountAmount = data.discount_type === 'percentage'
    ? Math.min(subtotal * (data.discount_value / 100), subtotal)
    : Math.min(data.discount_value, subtotal)

  return {
    voucher: {
      id:             data.id,
      code:           data.code,
      discount_type:  data.discount_type,
      discount_value: data.discount_value,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
    },
    error: null,
  }
}

// ── Gutschein-Widget ──────────────────────────────────────────
function VoucherInput({ subtotal, onApply }: {
  subtotal: number
  onApply: (v: AppliedVoucher | null) => void
}) {
  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [applied, setApplied]   = useState<AppliedVoucher | null>(null)

  const handleApply = async () => {
    if (!code.trim()) return
    setLoading(true); setError('')
    const { voucher, error: err } = await validateVoucher(code, subtotal)
    if (err || !voucher) {
      setError(err || 'Fehler beim Prüfen des Gutscheins.')
    } else {
      setApplied(voucher)
      onApply(voucher)
    }
    setLoading(false)
  }

  const handleRemove = () => {
    setApplied(null)
    setCode('')
    setError('')
    onApply(null)
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-green-700">
          <Check size={16} />
          <span className="font-bold">{applied.code}</span>
          <span className="text-sm">
            − {applied.discount_type === 'percentage'
              ? `${applied.discount_value}%`
              : `${applied.discount_value.toFixed(2)} €`
            } Rabatt
          </span>
        </div>
        <button onClick={handleRemove} className="text-green-600 hover:text-red-500 transition">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            placeholder="GUTSCHEINCODE"
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold tracking-wider focus:border-black focus:outline-none uppercase"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-900 disabled:opacity-40 transition flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Einlösen'}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  )
}

// ── Trinkgeld-Widget ──────────────────────────────────────────
function TipSelector({ subtotal, onTipChange }: {
  subtotal: number
  onTipChange: (amount: number) => void
}) {
  const [selected, setSelected] = useState<number>(0)
  const [custom, setCustom]     = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleSelect = (pct: number) => {
    setSelected(pct)
    setShowCustom(false)
    setCustom('')
    const amount = pct === 0 ? 0 : parseFloat((subtotal * pct / 100).toFixed(2))
    onTipChange(amount)
  }

  const handleCustom = (val: string) => {
    setCustom(val)
    const amount = parseFloat(val) || 0
    onTipChange(parseFloat(amount.toFixed(2)))
  }

  return (
    <div>
      <h3 className="font-semibold text-base mb-3">Trinkgeld 🙏</h3>
      <div className="grid grid-cols-5 gap-2 mb-2">
        {TIP_OPTIONS.map(pct => (
          <button
            key={pct}
            type="button"
            onClick={() => handleSelect(pct)}
            className={`py-2 rounded-xl text-sm font-bold border-2 transition ${
              selected === pct && !showCustom
                ? 'border-black bg-black text-white'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {pct === 0 ? 'Kein' : `${pct}%`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setShowCustom(true); setSelected(-1) }}
          className={`py-2 rounded-xl text-sm font-bold border-2 transition ${
            showCustom ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          ✏️
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            min="0"
            step="0.50"
            value={custom}
            onChange={e => handleCustom(e.target.value)}
            placeholder="Betrag in €"
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
          <span className="text-sm text-gray-500 font-semibold">€</span>
        </div>
      )}
      {selected > 0 && !showCustom && (
        <div className="text-xs text-gray-500 mt-1">
          = {(subtotal * selected / 100).toFixed(2)} € Trinkgeld
        </div>
      )}
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────
export default function Checkout({ session }: { session: Session | null }) {
  const router  = useRouter()
  const { guest } = router.query
  const isGuest = guest === 'true'

  const [cart, setCart]           = useState<CartItem[]>([])
  const [clientSecret, setClientSecret] = useState('')
  const [shopOpen, setShopOpen]   = useState<boolean | null>(null)
  const [shopMessage, setShopMessage] = useState('')
  const [voucher, setVoucher]     = useState<AppliedVoucher | null>(null)
  const [tip, setTip]             = useState(0)

  useEffect(() => {
    fetch('/api/shop-status')
      .then(r => r.json())
      .then(data => { setShopOpen(data.isOpen); setShopMessage(data.message || '') })
      .catch(() => setShopOpen(true))

    const savedCart = localStorage.getItem('simonetti-cart') || localStorage.getItem('cart')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      setCart(parsedCart)
      createPaymentIntent(parsedCart, null, 0)
    } else {
      router.push('/')
    }
  }, [])

  const subtotal   = cart.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0)
  const discount   = voucher?.discountAmount || 0
  const grandTotal = parseFloat(Math.max(0, subtotal - discount + DELIVERY_FEE + tip).toFixed(2))

  const createPaymentIntent = async (
    cartItems: CartItem[],
    appliedVoucher: AppliedVoucher | null,
    tipAmount: number
  ) => {
    const sub   = cartItems.reduce((sum, i) => sum + (i.totalPrice || i.price * i.quantity), 0)
    const disc  = appliedVoucher?.discountAmount || 0
    const total = parseFloat(Math.max(0, sub - disc + DELIVERY_FEE + tipAmount).toFixed(2))

    try {
      const res = await fetch('/api/stripe/create-payment-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:   total,
          metadata: {
            items:        JSON.stringify(cartItems),
            voucher_code: appliedVoucher?.code   || null,
            voucher_id:   appliedVoucher?.id      || null,
            discount:     disc,
            tip:          tipAmount,
          },
        }),
      })
      const data = await res.json()
      setClientSecret(data.clientSecret)
    } catch (err) {
      console.error('PaymentIntent error:', err)
    }
  }

  const handleVoucherApply = (applied: AppliedVoucher | null) => {
    setVoucher(applied)
    setClientSecret('')
    createPaymentIntent(cart, applied, tip)
  }

  const handleTipChange = (amount: number) => {
    setTip(amount)
    setClientSecret('')
    createPaymentIntent(cart, voucher, amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Kasse</h1>

        {shopOpen === false && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center mb-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Shop momentan geschlossen</h2>
            <p className="text-red-600">{shopMessage || 'Wir nehmen gerade keine Bestellungen an.'}</p>
            <p className="text-sm text-red-400 mt-2">Bitte schau zu unseren Öffnungszeiten wieder vorbei!</p>
            <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-white border-2 border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition">
              ← Zurück zum Shop
            </button>
          </div>
        )}

        {shopOpen !== false && (
          <div className="grid md:grid-cols-2 gap-8">

            {/* ── Linke Spalte: Übersicht + Gutschein + Trinkgeld ── */}
            <div className="space-y-4">
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
                      <span className="font-semibold">{(item.totalPrice || item.price * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>

                {/* Preisübersicht */}
                <div className="space-y-2 text-base">
                  <div className="flex justify-between text-gray-600">
                    <span>Zwischensumme:</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>🎟️ Gutschein ({voucher?.code}):</span>
                      <span>− {discount.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Lieferung:</span>
                    <span>{DELIVERY_FEE.toFixed(2)} €</span>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Trinkgeld:</span>
                      <span>{tip.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-2xl pt-3 border-t-2">
                    <span>Gesamt:</span>
                    <span className="text-primary">{grandTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Gutschein */}
              <div className="card">
                <h3 className="font-semibold text-base mb-3">🎟️ Gutscheincode</h3>
                <VoucherInput subtotal={subtotal} onApply={handleVoucherApply} />
              </div>

              {/* Trinkgeld */}
              <div className="card">
                <TipSelector subtotal={subtotal} onTipChange={handleTipChange} />
              </div>
            </div>

            {/* ── Rechte Spalte: Zahlung ── */}
            <div>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    session={session}
                    isGuest={isGuest}
                    cart={cart}
                    total={grandTotal}
                    subtotal={subtotal}
                    shopOpen={shopOpen}
                    minimumOrder={MINIMUM_ORDER}
                    voucher={voucher}
                    tip={tip}
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

// ── Checkout Formular ─────────────────────────────────────────
function CheckoutForm({
  session, isGuest, cart, total, subtotal, shopOpen, minimumOrder, voucher, tip
}: {
  session: Session | null
  isGuest: boolean
  cart: CartItem[]
  total: number
  subtotal: number
  shopOpen: boolean | null
  minimumOrder: number
  voucher: AppliedVoucher | null
  tip: number
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const router   = useRouter()

  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState(session?.user?.email || '')
  const [phone,   setPhone]   = useState('')
  const [street,  setStreet]  = useState('')
  const [zip,     setZip]     = useState('')
  const [city,    setCity]    = useState('')
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const isBlocked = shopOpen === false || subtotal < minimumOrder

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const statusRes  = await fetch('/api/shop-status')
      const statusData = await statusRes.json()
      if (!statusData.isOpen) {
        setError('Der Shop ist momentan geschlossen.')
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

      // Gutschein-Nutzung inkrementieren
      if (voucher?.id) {
        await supabase.rpc('increment_voucher_uses', { voucher_id: voucher.id })
      }

      const orderData = {
        user_id:           session?.user?.id || null,
        guest_email:       isGuest ? email : null,
        customer_name:     name,
        customer_email:    isGuest ? email : session?.user?.email,
        customer_phone:    phone || null,
        items:             cart,
        subtotal,
        discount:          voucher?.discountAmount || 0,
        voucher_code:      voucher?.code || null,
        voucher_id:        voucher?.id   || null,
        delivery_fee:      3.00,
        tip,
        total,
        delivery_address:  { name, street, zip, city },
        notes:             notes || null,
        payment_intent_id: paymentIntent?.id,
        status:            'OFFEN',
      }

      await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(orderData),
      })

      localStorage.removeItem('simonetti-cart')
      localStorage.removeItem('cart')
      router.push('/order-success')

    } catch (err: any) {
      setError(err.message || 'Zahlung fehlgeschlagen')
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
            <label className="block text-sm font-semibold mb-2">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input" />
          </div>

          {isGuest && (
            <div>
              <label className="block text-sm font-semibold mb-2">E-Mail *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Telefon (optional)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+49 ..." />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Straße & Hausnummer *</label>
            <input type="text" value={street} onChange={e => setStreet(e.target.value)} required className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">PLZ *</label>
              <input type="text" value={zip} onChange={e => setZip(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Stadt *</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} required className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Anmerkungen (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="z.B. Klingel defekt, 2. Stock links..."
              className="input resize-none"
            />
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

      <button type="button" onClick={() => router.push('/')}
        className="w-full text-sm text-gray-400 hover:text-gray-600 transition text-center">
        ← Zurück zum Shop
      </button>
    </form>
  )
}