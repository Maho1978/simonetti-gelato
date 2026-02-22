import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '@/components/Navbar'
import { AlertCircle, Tag, X, Check, Loader2, MapPin, CreditCard, User } from 'lucide-react'
import { searchStreets, type Street } from '@/lib/langenfeld-streets'

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
const TIP_OPTIONS   = [0, 5, 10, 15]

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

// ── Schönes Input-Feld ────────────────────────────────────────
function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

// Gemeinsame Input-Klasse
const inputClass =
  'w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/8'

// ── Gutschein-Widget ──────────────────────────────────────────
function VoucherInput({ subtotal, onApply }: {
  subtotal: number
  onApply: (v: AppliedVoucher | null) => void
}) {
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [applied, setApplied] = useState<AppliedVoucher | null>(null)

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
    setApplied(null); setCode(''); setError(''); onApply(null)
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
              : `${applied.discount_value.toFixed(2)} €`} Rabatt
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
          <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            placeholder="GUTSCHEINCODE"
            className={`${inputClass} pl-10 uppercase tracking-widest font-bold`}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-700 disabled:opacity-40 transition flex items-center gap-1.5"
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
  const [selected, setSelected]   = useState<number>(0)
  const [custom, setCustom]       = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleSelect = (pct: number) => {
    setSelected(pct); setShowCustom(false); setCustom('')
    onTipChange(pct === 0 ? 0 : parseFloat((subtotal * pct / 100).toFixed(2)))
  }

  const handleCustom = (val: string) => {
    setCustom(val)
    onTipChange(parseFloat((parseFloat(val) || 0).toFixed(2)))
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
            className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              selected === pct && !showCustom
                ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
            }`}
          >
            {pct === 0 ? 'Kein' : `${pct}%`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setShowCustom(true); setSelected(-1) }}
          className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
            showCustom
              ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
              : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
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
            className={inputClass}
          />
          <span className="text-sm text-gray-500 font-semibold">€</span>
        </div>
      )}
      {selected > 0 && !showCustom && (
        <p className="text-xs text-gray-400 mt-1.5">
          = {(subtotal * selected / 100).toFixed(2)} € Trinkgeld – danke! 🤍
        </p>
      )}
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────
export default function Checkout({ session }: { session: Session | null }) {
  const router  = useRouter()
  const { guest } = router.query
  const isGuest = guest === 'true'

  const [cart, setCart]                     = useState<CartItem[]>([])
  const [clientSecret, setClientSecret]     = useState('')
  const [shopOpen, setShopOpen]             = useState<boolean | null>(null)
  const [shopMessage, setShopMessage]       = useState('')
  const [voucher, setVoucher]               = useState<AppliedVoucher | null>(null)
  const [tip, setTip]                       = useState(0)
  const [showVoucher, setShowVoucher]       = useState(true)
  const [showTip, setShowTip]               = useState(true)

  useEffect(() => {
    fetch('/api/shop-status')
      .then(r => r.json())
      .then(data => { setShopOpen(data.isOpen); setShopMessage(data.message || '') })
      .catch(() => setShopOpen(true))

    // Feature-Toggles laden
    supabase
      .from('feature_toggles')
      .select('id, enabled')
      .in('id', ['vouchers', 'tip_option'])
      .then(({ data }) => {
        if (data) {
          const v = data.find(f => f.id === 'vouchers')
          const t = data.find(f => f.id === 'tip_option')
          if (v) setShowVoucher(v.enabled)
          if (t) setShowTip(t.enabled)
        }
      })

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
      const res  = await fetch('/api/stripe/create-payment-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:   total,
          metadata: {
            items:        JSON.stringify(cartItems),
            voucher_code: appliedVoucher?.code || null,
            voucher_id:   appliedVoucher?.id   || null,
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
    setVoucher(applied); setClientSecret('')
    createPaymentIntent(cart, applied, tip)
  }

  const handleTipChange = (amount: number) => {
    setTip(amount); setClientSecret('')
    createPaymentIntent(cart, voucher, amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition mb-4 font-medium"
          >
            ← Zurück zum Shop
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Deine Bestellung</h1>
          <p className="text-gray-400 mt-1 text-sm">Nur noch wenige Schritte bis zu deinem Eis 🍦</p>
        </div>

        {/* Shop geschlossen */}
        {shopOpen === false && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-10 text-center mb-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Shop momentan geschlossen</h2>
            <p className="text-red-600">{shopMessage || 'Wir nehmen gerade keine Bestellungen an.'}</p>
            <p className="text-sm text-red-400 mt-2">Bitte schau zu unseren Öffnungszeiten wieder vorbei!</p>
          </div>
        )}

        {shopOpen !== false && (
          <div className="grid lg:grid-cols-11 gap-6">

            {/* ── Links (3/5): Übersicht + Gutschein + Trinkgeld ── */}
            <div className="lg:col-span-6 space-y-5">

              {/* Bestellübersicht */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    🍦 Bestellübersicht
                  </h2>
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                    {cart.length} Artikel
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {cart.map((item, i) => (
                    <div key={i} className="py-3.5 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {item.quantity}×
                          </span>
                          <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
                        </div>
                        {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1 ml-8">
                            🍦 {item.selectedFlavors.join(', ')}
                          </p>
                        )}
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <p className="text-xs text-gray-400 ml-8">
                            ➕ {item.selectedExtras.map((e: any) => e.name || e).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 ml-4 text-sm">
                        {(item.totalPrice || item.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>

                {/* Preiszeilen */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Zwischensumme</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm font-semibold text-green-600">
                      <span>🎟️ Gutschein ({voucher?.code})</span>
                      <span>− {discount.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>🚗 Liefergebühr</span>
                    <span>{DELIVERY_FEE.toFixed(2)} €</span>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>💝 Trinkgeld</span>
                      <span>{tip.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-200">
                    <span className="text-gray-900">Gesamt</span>
                    <span className="text-gray-900">{grandTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Gutschein + Trinkgeld – nur wenn Feature aktiv */}
              {(showVoucher || showTip) && (
                <div className={`grid grid-cols-1 ${showVoucher && showTip ? 'sm:grid-cols-2' : ''} gap-4`}>
                  {showVoucher && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                      <h3 className="font-bold text-sm mb-3 text-gray-700 flex items-center gap-2">
                        🎟️ Gutscheincode
                      </h3>
                      <VoucherInput subtotal={subtotal} onApply={handleVoucherApply} />
                    </div>
                  )}
                  {showTip && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                      <TipSelector subtotal={subtotal} onTipChange={handleTipChange} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Rechts (2/5): Checkout-Formular ── */}
            <div className="lg:col-span-5">
              <div className="sticky top-6">
                {clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: { colorPrimary: '#111827', borderRadius: '12px' },
                      },
                    }}
                  >
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
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm text-center py-16">
                    <div className="text-5xl mb-3 animate-pulse">🍦</div>
                    <p className="text-sm text-gray-400">Zahlung wird vorbereitet...</p>
                  </div>
                )}
              </div>
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
  const [street,  setStreet]       = useState('')
  const [zip,     setZip]          = useState('40764')
  const [city,    setCity]         = useState('Langenfeld')
  const [streetSuggestions, setStreetSuggestions] = useState<Street[]>([])
  const [showSuggestions,   setShowSuggestions]   = useState(false)
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const isBlocked = shopOpen === false || subtotal < minimumOrder

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const statusRes  = await fetch('/api/shop-status')
      const statusData = await statusRes.json()
      if (!statusData.isOpen) { setError('Der Shop ist momentan geschlossen.'); return }
    } catch {}

    if (!stripe || !elements) return
    setLoading(true); setError('')

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })
      if (stripeError) throw new Error(stripeError.message)

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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 space-y-6">

      {/* Form Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white">
          <User size={18} />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{isGuest ? 'Gast-Checkout' : 'Zahlung & Lieferung'}</h2>
          <p className="text-xs text-gray-400">Sicher verschlüsselt via Stripe 🔒</p>
        </div>
      </div>

      {/* Fehler */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Lieferadresse */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <MapPin size={13} /> Lieferadresse
        </div>

        <Field label="Vollständiger Name" required>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Max Mustermann"
            className={inputClass}
          />
        </Field>

        {isGuest && (
          <Field label="E-Mail" required>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="max@email.de"
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Telefonnummer" required>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            placeholder="+49 170 1234567"
            className={inputClass}
          />
        </Field>

        <Field label="Straße & Hausnummer" required>
          <div className="relative">
            <input
              type="text"
              value={street}
              onChange={e => {
                setStreet(e.target.value)
                setStreetSuggestions(searchStreets(e.target.value))
                setShowSuggestions(true)
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => street.length >= 2 && setShowSuggestions(true)}
              required
              placeholder="z.B. Hauptstraße 5"
              className={inputClass}
              autoComplete="off"
            />
            {showSuggestions && streetSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {streetSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => {
                      setStreet(s.name + ' ')
                      setShowSuggestions(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-800">{s.name}</span>
                    {s.district && (
                      <span className="text-xs text-gray-400 ml-auto">{s.district}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>

        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2">
            <Field label="PLZ" required>
              <input
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                required
                readOnly
                className={`${inputClass} bg-gray-50 cursor-not-allowed text-gray-500`}
              />
            </Field>
          </div>
          <div className="col-span-3">
            <Field label="Stadt" required>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
                readOnly
                className={`${inputClass} bg-gray-50 cursor-not-allowed text-gray-500`}
              />
            </Field>
          </div>
        </div>

        <Field label="Anmerkungen">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="z.B. Klingel defekt, 2. Stock links..."
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>

      {/* Zahlung */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <CreditCard size={13} /> Zahlungsmethode
        </div>
        <div className="border-2 border-gray-100 rounded-2xl p-4">
          <PaymentElement />
        </div>
      </div>

      {/* Mindestbestellwert */}
      {subtotal < minimumOrder && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
          <AlertCircle size={15} />
          <span>
            Mindestbestellwert <b>{minimumOrder.toFixed(2)} €</b> – noch{' '}
            <b>{(minimumOrder - subtotal).toFixed(2)} €</b> fehlen
          </span>
        </div>
      )}

      {/* Bezahl-Button */}
      <button
        type="submit"
        disabled={!stripe || loading || isBlocked}
        className={`w-full py-4 text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
          isBlocked
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98] shadow-sm'
        }`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Zahlung wird verarbeitet...
          </>
        ) : shopOpen === false
          ? '🔒 Shop geschlossen'
          : subtotal < minimumOrder
          ? 'Mindestbestellwert nicht erreicht'
          : `✅ Jetzt bezahlen · ${total.toFixed(2)} €`
        }
      </button>
    </form>
  )
}