import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import Navbar from '@/components/Navbar'
import { AlertCircle, Tag, X, Check, Loader2, MapPin, CreditCard, User, Clock, Plus, Minus, Trash2, Banknote, ShoppingBag } from 'lucide-react'
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
  cartId?: string
}

interface AppliedLoyalty {
  tier_id: string
  label: string
  type: string
  value: number
  points_used: number
  discountAmount: number
}

interface AppliedVoucher {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discountAmount: number
}

interface ShopTimes { isOpen: boolean; openFrom: string; openUntil: string }
interface ShopStatusData {
  isOpen: boolean
  isPreorder: boolean
  preorderHint: string
  delivery: ShopTimes
  pickup: ShopTimes
  message: string
}

const TIP_OPTIONS = [0, 5, 10, 15]

async function validateVoucher(code: string, subtotal: number): Promise<{ voucher: AppliedVoucher | null; error: string | null }> {
  const { data, error } = await supabase.from('vouchers').select('*').eq('code', code.toUpperCase().trim()).eq('is_active', true).single()
  if (error || !data) return { voucher: null, error: 'Ungültiger Gutscheincode.' }
  if (data.valid_until && new Date(data.valid_until) < new Date()) return { voucher: null, error: 'Dieser Gutschein ist abgelaufen.' }
  if (data.current_uses >= data.max_uses) return { voucher: null, error: 'Dieser Gutschein wurde bereits zu oft eingelöst.' }
  if (subtotal < data.min_order_value) return { voucher: null, error: `Mindestbestellwert für diesen Gutschein: ${data.min_order_value.toFixed(2)} €` }
  const raw = data.discount_type === 'percentage' ? Math.min(subtotal * (data.discount_value / 100), subtotal) : Math.min(data.discount_value, subtotal)
  const discountAmount = Math.round(raw * 10) / 10
  return { voucher: { id: data.id, code: data.code, discount_type: data.discount_type, discount_value: data.discount_value, discountAmount: parseFloat(discountAmount.toFixed(2)) }, error: null }
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/8'

function VoucherInput({ subtotal, onApply }: { subtotal: number; onApply: (v: AppliedVoucher | null) => void }) {
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [applied, setApplied] = useState<AppliedVoucher | null>(null)

  const handleApply = async () => {
    if (!code.trim()) return
    setLoading(true); setError('')
    const { voucher, error: err } = await validateVoucher(code, subtotal)
    if (err || !voucher) { setError(err || 'Fehler beim Prüfen des Gutscheins.') } else { setApplied(voucher); onApply(voucher) }
    setLoading(false)
  }
  const handleRemove = () => { setApplied(null); setCode(''); setError(''); onApply(null) }

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-green-700">
          <Check size={16} /><span className="font-bold">{applied.code}</span>
          <span className="text-sm">− {applied.discount_type === 'percentage' ? `${applied.discount_value}%` : `${applied.discount_value.toFixed(2)} €`} Rabatt</span>
        </div>
        <button onClick={handleRemove} className="text-green-600 hover:text-red-500 transition"><X size={16} /></button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            placeholder="GUTSCHEINCODE" className={`${inputClass} pl-10 uppercase tracking-widest font-bold`} />
        </div>
        <button type="button" onClick={handleApply} disabled={loading || !code.trim()}
          className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-700 disabled:opacity-40 transition flex items-center gap-1.5">
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Einlösen'}
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {error}</div>}
    </div>
  )
}

function TipSelector({ subtotal, onTipChange }: { subtotal: number; onTipChange: (amount: number) => void }) {
  const [selected, setSelected]     = useState<number>(0)
  const [custom, setCustom]         = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleSelect = (pct: number) => {
    setSelected(pct); setShowCustom(false); setCustom('')
    onTipChange(pct === 0 ? 0 : parseFloat((subtotal * pct / 100).toFixed(2)))
  }
  const handleCustom = (val: string) => { setCustom(val); onTipChange(parseFloat((parseFloat(val) || 0).toFixed(2))) }

  return (
    <div>
      <h3 className="font-semibold text-base mb-3">Trinkgeld 🙏</h3>
      <div className="grid grid-cols-5 gap-2 mb-2">
        {TIP_OPTIONS.map(pct => (
          <button key={pct} type="button" onClick={() => handleSelect(pct)}
            className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selected === pct && !showCustom ? 'border-gray-900 bg-gray-900 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'}`}>
            {pct === 0 ? 'Kein' : `${pct}%`}
          </button>
        ))}
        <button type="button" onClick={() => { setShowCustom(true); setSelected(-1) }}
          className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${showCustom ? 'border-gray-900 bg-gray-900 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'}`}>✏️</button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 mt-2">
          <input type="number" min="0" step="0.50" value={custom} onChange={e => handleCustom(e.target.value)} placeholder="Betrag in €" className={inputClass} />
          <span className="text-sm text-gray-500 font-semibold">€</span>
        </div>
      )}
      {selected > 0 && !showCustom && <p className="text-xs text-gray-400 mt-1.5">= {(subtotal * selected / 100).toFixed(2)} € Trinkgeld – danke! 🤍</p>}
    </div>
  )
}

// ── AGB Checkbox ─────────────────────────────────────────────
function AgbCheckbox({ accepted, onChange }: { accepted: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!accepted)}
      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none
        ${accepted ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400 bg-white'}`}>
      <div className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all
        ${accepted ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
        {accepted && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">
        Ich habe die{' '}
        <a href="/agb" target="_blank" onClick={e => e.stopPropagation()} className="font-semibold text-gray-900 underline hover:text-gray-600">
          AGB
        </a>
        {' '}und die{' '}
        <a href="/datenschutz" target="_blank" onClick={e => e.stopPropagation()} className="font-semibold text-gray-900 underline hover:text-gray-600">
          Datenschutzerklärung
        </a>
        {' '}gelesen und akzeptiere diese. <span className="text-red-400">*</span>
      </p>
    </div>
  )
}

function LoyaltyRedeemer({ userId, applied, onApply }: { userId: string; applied: any; onApply: (l: any) => void }) {
  const [tiers, setTiers] = useState<any[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    fetch(`/api/loyalty?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setPoints(d.points || 0); setTiers(d.rewards || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])
  if (loading || points === 0) return null
  if (applied) return (
    <div className="flex items-center justify-between bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 text-amber-700">
        <Check size={16} /><span className="font-bold">{applied.label}</span>
        <span className="text-sm">eingeloest ({applied.points_used > 0 ? applied.points_used + " Punkte" : "Bronze Stufe"})</span>
      </div>
      <button onClick={() => onApply(null)} className="text-amber-600 hover:text-red-500"><X size={16} /></button>
    </div>
  )
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-amber-800">Treuepunkte einloesen ({points} Punkte)</div>
        <button onClick={() => setOpen(!open)} className="text-xs text-amber-600 font-semibold">{open ? "Schliessen" : "Anzeigen"}</button>
      </div>
      {open && <div className="space-y-2 mt-2">
        {tiers.filter((t: any) => t.canRedeem).map((t: any) => (
          <button key={t.key} onClick={() => { const discountAmount = t.type === "free_delivery" ? 3 : t.value; onApply({ tier_id: t.key, label: t.label, type: t.type, value: t.value, points_used: t.points, discountAmount, note: t.type === "free_item" ? `Treuepunkte: ${t.label} (Sorte bitte in Anmerkungen angeben)` : "" }); setOpen(false) }}
            className="w-full flex items-center justify-between bg-white border border-amber-200 rounded-xl px-4 py-3 hover:border-amber-400 transition text-sm">
            <span className="font-semibold text-amber-900">{t.label}</span>
            <span className="text-amber-600 font-bold">{t.points} Punkte</span>
          </button>
        ))}
        {tiers.filter((t: any) => !t.canRedeem).map((t: any) => (
          <div key={t.key} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 opacity-50 text-sm">
            <span className="text-gray-600">{t.label}</span>
            <span className="text-gray-400">noch {t.pointsNeeded} Punkte</span>
          </div>
        ))}
      </div>}
    </div>
  )
}

export default function Checkout({ session }: { session: Session | null }) {
  const router    = useRouter()
  const { guest } = router.query
  const isGuest   = guest === 'true'

  const [cart, setCart]                 = useState<CartItem[]>([])
  const [clientSecret, setClientSecret] = useState('')

  const [shopStatus, setShopStatus]     = useState<ShopStatusData | null>(null)
  const [shopLoading, setShopLoading]   = useState(true)

  const [voucher, setVoucher]           = useState<AppliedVoucher | null>(null)
  const [loyalty, setLoyalty]           = useState<AppliedLoyalty | null>(null)
  const [tip, setTip]                   = useState(0)
  const [showVoucher, setShowVoucher]   = useState(true)
  const [showTip, setShowTip]           = useState(true)
  const [showPayPal, setShowPayPal]     = useState(false)
  const [flags_loyalty, setFlagsLoyalty] = useState(false)
  const [showCash, setShowCash]         = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'cash'>('stripe')
  const [deliveryFee, setDeliveryFee]   = useState(3.00)
  const [minimumOrder, setMinimumOrder] = useState(15.00)
  const [paypalClientId, setPaypalClientId] = useState('')
  const [orderType, setOrderType]       = useState<'delivery' | 'pickup'>('delivery')
  const [pickupEnabled, setPickupEnabled] = useState(false)
  const [deliveryZones, setDeliveryZones] = useState<{ id: string; zip: string; city: string; enabled: boolean }[]>([{ id: '1', zip: '40764', city: 'Langenfeld', enabled: true }])
  const [upsellEnabled, setUpsellEnabled] = useState(false)
  const [upsellToppings, setUpsellToppings] = useState<{ id: string; name: string; price: number; enabled: boolean }[]>([])
  const [dailySpecial, setDailySpecial] = useState<{ enabled: boolean; name: string; description: string; price: number } | null>(null)

  // ── NEU: AGB akzeptiert ──
  const [agbAccepted, setAgbAccepted]   = useState(false)
  const [cashNote, setCashNote]         = useState('')

  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState(session?.user?.email || '')
  const [phone,  setPhone]  = useState('')
  const [street, setStreet] = useState('')
  const [hausnr, setHausnr] = useState('')
  const [zip,    setZip]    = useState('40764')
  const [city,   setCity]   = useState('Langenfeld')
  const [notes,  setNotes]  = useState('')

  const effectiveDeliveryFee  = orderType === 'pickup' ? 0 : deliveryFee
  const effectiveMinimumOrder = orderType === 'pickup' ? 0 : minimumOrder

  const shopOpenForType: boolean | null = shopStatus === null ? null
    : shopStatus.isPreorder ? true
    : orderType === 'pickup'
      ? shopStatus.pickup.isOpen
      : shopStatus.delivery.isOpen

  const alternativeTypeHint = (() => {
    if (!shopStatus || shopStatus.isPreorder) return null
    if (orderType === 'delivery' && !shopStatus.delivery.isOpen && shopStatus.pickup.isOpen) {
      const t = shopStatus.pickup
      return { type: 'pickup' as const, msg: `🏪 Abholung ist geöffnet (${t.openFrom}–${t.openUntil} Uhr) → Wechseln?` }
    }
    if (orderType === 'pickup' && !shopStatus.pickup.isOpen && shopStatus.delivery.isOpen) {
      const t = shopStatus.delivery
      return { type: 'delivery' as const, msg: `🚗 Lieferung ist geöffnet (${t.openFrom}–${t.openUntil} Uhr) → Wechseln?` }
    }
    return null
  })()

  useEffect(() => {
    fetch('/api/shop-status')
      .then(r => r.json())
      .then((data: ShopStatusData) => {
        setShopStatus(data)
        setShopLoading(false)
        if (!data.delivery.isOpen && data.pickup.isOpen && !data.isPreorder) {
          setOrderType('pickup')
        }
      })
      .catch(() => {
        setShopStatus({ isOpen: true, isPreorder: false, preorderHint: '', delivery: { isOpen: true, openFrom: '', openUntil: '' }, pickup: { isOpen: true, openFrom: '', openUntil: '' }, message: '' })
        setShopLoading(false)
      })

    supabase.from('shop_settings').select('delivery_fee, min_order_value, payment_keys, cash_payment_enabled, pickup_enabled, delivery_zones, upsell_enabled, upsell_toppings, daily_special').eq('id', 'main').single()
      .then(({ data }) => {
        if (!data) return
        if (data.delivery_fee    != null) setDeliveryFee(data.delivery_fee)
        if (data.min_order_value != null) setMinimumOrder(data.min_order_value)
        if (data.pickup_enabled)          setPickupEnabled(true)
        if (data.cash_payment_enabled && !isGuest) {
          supabase.auth.getSession().then(({ data: { session: s } }) => { if (s) setShowCash(true) })
        if (data.delivery_zones?.length) setDeliveryZones(data.delivery_zones)
        if (data.upsell_enabled) setUpsellEnabled(true)
        if (data.upsell_toppings?.length) setUpsellToppings(data.upsell_toppings)
        if (data.daily_special?.enabled) setDailySpecial(data.daily_special)
        }
        const keys = data.payment_keys
        if (keys?.paypal) {
          const mode     = keys.paypal.mode || 'sandbox'
          const clientId = mode === 'live' ? keys.paypal.live_client_id : keys.paypal.sandbox_client_id
          if (clientId) setPaypalClientId(clientId)
        }
      })

    supabase.from('feature_toggles').select('id, enabled').in('id', ['vouchers', 'tip_option', 'payment_paypal'])
      .then(({ data }) => {
        if (data) {
          setShowVoucher(data.find(f => f.id === 'vouchers')?.enabled ?? true)
          setShowTip(data.find(f => f.id === 'tip_option')?.enabled ?? true)
          setShowPayPal(data.find(f => f.id === 'payment_paypal')?.enabled ?? false)
        }
      })

    const savedCart = localStorage.getItem('simonetti-cart') || localStorage.getItem('cart')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      setCart(parsedCart)
      createPaymentIntent(parsedCart, null, 0, deliveryFee)
    } else {
      router.push('/')
    }
  }, [])

  useEffect(() => {
    if (cart.length > 0) { setClientSecret(''); createPaymentIntent(cart, voucher, tip, effectiveDeliveryFee) }
  }, [orderType])

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('simonetti-cart', JSON.stringify(newCart))
    setClientSecret('')
    createPaymentIntent(newCart, voucher, tip)
  }

  const changeQty = (cartId: string, delta: number) => {
    const item = cart.find(i => (i.cartId || i.id) === cartId)
    if (!item) return
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      removeItem(cartId)
    } else {
      const basePrice = item.totalPrice ? item.totalPrice / item.quantity : item.price + (item.selectedExtras || []).reduce((s: number, e: any) => s + (e.price || 0), 0)
      updateCart(cart.map(i => (i.cartId || i.id) === cartId ? { ...i, quantity: newQty, totalPrice: parseFloat((basePrice * newQty).toFixed(2)) } : i))
    }
  }

  const removeItem = (cartId: string) => {
    const newCart = cart.filter(i => (i.cartId || i.id) !== cartId)
    if (newCart.length === 0) { localStorage.removeItem('simonetti-cart'); router.push('/') } else { updateCart(newCart) }
  }

  const subtotal   = cart.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0)
  const discount   = (voucher?.discountAmount || 0) + (loyalty?.discountAmount || 0)
  const roundTo10Cents = (val: number) => Math.round(val * 10) / 10
  const grandTotal = roundTo10Cents(Math.max(0, subtotal - discount + effectiveDeliveryFee + tip))

  const createPaymentIntent = async (cartItems: CartItem[], appliedVoucher: AppliedVoucher | null, tipAmount: number, fee?: number) => {
    const sub    = cartItems.reduce((sum, i) => sum + (i.totalPrice || i.price * i.quantity), 0)
    const disc   = appliedVoucher?.discountAmount || 0
    const useFee = fee ?? effectiveDeliveryFee
    const total  = parseFloat(Math.max(0, sub - disc + useFee + tipAmount).toFixed(2))
    try {
      const res  = await fetch('/api/stripe/create-payment-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: total, metadata: { voucher_code: appliedVoucher?.code || null, voucher_id: appliedVoucher?.id || null, discount: disc, tip: tipAmount } }) })
      const data = await res.json()
      setClientSecret(data.clientSecret)
    } catch (err) { console.error('PaymentIntent error:', err) }
  }

  const handleVoucherApply = (applied: AppliedVoucher | null) => { setVoucher(applied); setClientSecret(''); createPaymentIntent(cart, applied, tip) }
  const handleTipChange    = (amount: number) => { setTip(amount); setClientSecret(''); createPaymentIntent(cart, voucher, amount) }

  const saveOrder = async (paymentId: string, method: string, cashChangeNote?: string) => {
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
      delivery_fee:      effectiveDeliveryFee,
      tip,
      total:             grandTotal,
      delivery_address:  orderType === 'pickup' ? null : { name, street: `${street} ${hausnr}`.trim(), zip, city },
      notes:             [notes, cashChangeNote ? `Wechselgeld für: ${cashChangeNote}` : '', loyalty?.note || ''].filter(Boolean).join(' | ') || null,
      payment_intent_id: paymentId,
      payment_method:    method,
      order_type:        orderType,
      status:            'OFFEN',
    }
    await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) })
    if (voucher?.id) await supabase.rpc('increment_voucher_uses', { voucher_id: voucher.id })
    if (loyalty?.points_used && session?.user?.id) {
      await supabase.from('loyalty_transactions').insert({
        user_id: session.user.id,
        points: -loyalty.points_used,
        reason: 'redemption',
      })
    }
    localStorage.removeItem('simonetti-cart')
    localStorage.removeItem('cart')
    router.push('/order-success')
  }

  const handleCashOrder = async () => {
    if (!isFormValid || !agbAccepted) return
    try {
      const statusData: ShopStatusData = await fetch('/api/shop-status').then(r => r.json())
      const typeOpen = orderType === 'pickup' ? statusData.pickup?.isOpen : statusData.delivery?.isOpen
      if (!typeOpen && !statusData.isPreorder) {
        alert(`${orderType === 'pickup' ? 'Abholung' : 'Lieferung'} ist momentan nicht verfügbar.`)
        return
      }
    } catch {}
    await saveOrder('cash-' + Date.now(), 'cash', cashNote)
  }

  const isFormValid = orderType === 'pickup'
    ? !!(name.trim() && phone.trim() && (!isGuest || email.trim()))
    : !!(name.trim() && phone.trim() && street.trim() && hausnr.trim() && (!isGuest || email.trim()))

  const paymentOptions = [
    { id: 'stripe', label: '💳 Karte / SEPA', always: true },
    { id: 'paypal', label: '🅿️ PayPal',       show: showPayPal && !!paypalClientId },
    { id: 'cash',   label: '💵 Barzahlung',    show: showCash },
  ].filter(o => o.always || o.show)

  const shopCompletelyClosed = shopStatus !== null && !shopStatus.isOpen && !shopStatus.isPreorder

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition mb-4 font-medium">← Zurück zum Shop</button>
          <h1 className="text-4xl font-bold text-gray-900">Deine Bestellung</h1>
          <p className="text-gray-400 mt-1 text-sm">Nur noch wenige Schritte bis zu deinem Eis 🍦</p>
        </div>

        {shopStatus?.isPreorder && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Clock size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-blue-800 text-sm">Vorbestellung</p>
              <p className="text-blue-700 text-sm mt-0.5">{shopStatus.preorderHint}</p>
            </div>
          </div>
        )}

        {shopCompletelyClosed && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-10 text-center mb-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Shop momentan geschlossen</h2>
            <p className="text-red-600">{shopStatus?.message || 'Wir nehmen gerade keine Bestellungen an.'}</p>
            <p className="text-sm text-red-400 mt-2">Bitte schau zu unseren Öffnungszeiten wieder vorbei!</p>
            <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-white border-2 border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition">← Zurück zum Shop</button>
          </div>
        )}

        {shopLoading && (
          <div className="text-center py-16"><div className="text-5xl mb-3 animate-pulse">🍦</div><p className="text-sm text-gray-400">Wird geladen...</p></div>
        )}

        {!shopLoading && !shopCompletelyClosed && (
          <div className="grid lg:grid-cols-11 gap-6">
            <div className="lg:col-span-6 space-y-5">

              {/* Bestellübersicht */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">🍦 Bestellübersicht</h2>
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">{cart.reduce((s, i) => s + i.quantity, 0)} Artikel</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {cart.map((item) => {
                    const uid = item.cartId || item.id
                    const itemTotal = item.totalPrice || item.price * item.quantity
                    const unitPrice = itemTotal / item.quantity
                    return (
                      <div key={uid} className="py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                            {item.selectedFlavors && item.selectedFlavors.length > 0 && <p className="text-xs text-gray-400 mt-0.5">🍦 {item.selectedFlavors.join(', ')}</p>}
                            {item.selectedExtras && item.selectedExtras.length > 0 && <p className="text-xs text-gray-400">➕ {item.selectedExtras.map((e: any) => e.name || e).join(', ')}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{unitPrice.toFixed(2)} € / Stück</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                              <button type="button" onClick={() => changeQty(uid, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition text-gray-600">
                                {item.quantity === 1 ? <Trash2 size={13} className="text-red-400" /> : <Minus size={13} />}
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                              <button type="button" onClick={() => changeQty(uid, +1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition text-gray-600"><Plus size={13} /></button>
                            </div>
                            <div className="text-right min-w-[52px]"><span className="font-bold text-gray-900 text-sm">{itemTotal.toFixed(2)} €</span></div>
                            <button type="button" onClick={() => removeItem(uid)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition text-gray-300 hover:text-red-400"><X size={14} /></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5">
                  <div className="flex justify-between text-sm text-gray-500"><span>Zwischensumme</span><span>{subtotal.toFixed(2)} €</span></div>
                  {voucher && <div className="flex justify-between text-sm font-semibold text-green-600"><span>Gutschein ({voucher.code})</span><span>- {voucher.discountAmount.toFixed(2)} EUR</span></div>}{loyalty && <div className="flex justify-between text-sm font-semibold text-amber-600"><span>Treuepunkte: {loyalty.label}</span><span>- {loyalty.discountAmount.toFixed(2)} EUR</span></div>}
                  {orderType === 'delivery' && <div className="flex justify-between text-sm text-gray-500"><span>🚗 Liefergebühr</span><span>{deliveryFee.toFixed(2)} €</span></div>}
                  {orderType === 'pickup'   && <div className="flex justify-between text-sm font-semibold text-green-600"><span>🏪 Abholung</span><span>Kostenlos</span></div>}
                  {tip > 0 && <div className="flex justify-between text-sm text-gray-500"><span>💝 Trinkgeld</span><span>{tip.toFixed(2)} €</span></div>}
                  <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-200"><span className="text-gray-900">Gesamt</span><span className="text-gray-900">{grandTotal.toFixed(2)} €</span></div>
                </div>
              </div>

              {/* Upselling */}
              {upsellEnabled && (upsellToppings.filter(t => t.enabled).length > 0 || dailySpecial?.enabled) && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">✨ Dazu noch?</p>
                  <div className="flex flex-wrap gap-2">
                    {dailySpecial?.enabled && (
                      <button type="button"
                        onClick={() => {
                          const already = cart.find(i => (i as any)._isUpsell && i.name === dailySpecial.name)
                          if (already) return
                          const item = { id: 'daily_special', name: '⭐ ' + dailySpecial.name, price: dailySpecial.price, quantity: 1, _isUpsell: true } as any
                          setCart([...cart, item])
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition ${cart.find(i => (i as any)._isUpsell && i.name === dailySpecial.name) ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50 text-gray-700'}`}>
                        <span>⭐ {dailySpecial.name}</span>
                        <span className="text-xs font-normal text-gray-400">+{dailySpecial.price.toFixed(2)} €</span>
                        {cart.find(i => (i as any)._isUpsell && i.name === dailySpecial.name) ? <span className="text-amber-500">✓</span> : <span className="text-gray-400">+</span>}
                      </button>
                    )}
                    {upsellToppings.filter(t => t.enabled).map(t => {
                      const inCart = cart.find(i => (i as any)._isUpsell && i.id === 'topping_' + t.id)
                      return (
                        <button key={t.id} type="button"
                          onClick={() => {
                            if (inCart) { setCart(cart.filter(i => !((i as any)._isUpsell && i.id === 'topping_' + t.id))) }
                            else { setCart([...cart, { id: 'topping_' + t.id, name: t.name, price: t.price, quantity: 1, _isUpsell: true } as any]) }
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition ${inCart ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50 text-gray-700'}`}>
                          <span>{t.name}</span>
                          <span className="text-xs font-normal text-gray-400">+{t.price.toFixed(2)} €</span>
                          {inCart ? <span className="text-green-500">✓</span> : <span className="text-gray-400">+</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {session?.user?.id ? (<LoyaltyRedeemer userId={session.user.id} applied={loyalty} onApply={(l) => { setLoyalty(l); setClientSecret(""); createPaymentIntent(cart, voucher, tip) }} />) : null}
              {(showVoucher || showTip) && (
                <div className={`grid grid-cols-1 ${showVoucher && showTip ? 'sm:grid-cols-2' : ''} gap-4`}>
                  {showVoucher && <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><h3 className="font-bold text-sm mb-3 text-gray-700">🎟️ Gutscheincode</h3><VoucherInput subtotal={subtotal} onApply={handleVoucherApply} /></div>}
                  {showTip && <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><TipSelector subtotal={subtotal} onTipChange={handleTipChange} /></div>}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-6 space-y-4">

                {pickupEnabled && isGuest && paymentMethod === 'cash' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">🏪</span>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-800 text-sm">Abholung nur für registrierte Kunden</p>
                      <p className="text-xs text-amber-600 mt-0.5">Bitte <a href="/login" className="underline font-bold">anmelden</a> oder <a href="/register" className="underline font-bold">registrieren</a> um Abholung zu nutzen.</p>
                    </div>
                  </div>
                )}

                {pickupEnabled && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h2 className="font-bold text-gray-900 mb-3">Wie möchtest du deine Bestellung erhalten?</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setOrderType('delivery')}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all font-semibold text-sm ${orderType === 'delivery' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                        <span className="text-2xl">🚗</span>
                        <span>Lieferung</span>
                        {shopStatus?.delivery.openFrom && (
                          <span className={`text-xs ${orderType === 'delivery' ? 'opacity-70' : 'text-gray-400'}`}>
                            {shopStatus.delivery.isOpen ? `${shopStatus.delivery.openFrom}–${shopStatus.delivery.openUntil} Uhr` : shopStatus.delivery.openFrom ? `ab ${shopStatus.delivery.openFrom} Uhr` : ''}
                          </span>
                        )}
                        <span className={`text-xs ${orderType === 'delivery' ? 'opacity-70' : 'text-gray-400'}`}>+{deliveryFee.toFixed(2)} €</span>
                        {shopStatus && !shopStatus.delivery.isOpen && !shopStatus.isPreorder && (
                          <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold">Geschlossen</span>
                        )}
                      </button>
                      <button type="button" onClick={() => { if (!(isGuest && paymentMethod === 'cash')) setOrderType('pickup') }}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all font-semibold text-sm ${isGuest && paymentMethod === 'cash' ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : orderType === 'pickup' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                        <span className="text-2xl">🏪</span>
                        <span>Selbst abholen</span>
                        {shopStatus?.pickup.openFrom && (
                          <span className={`text-xs ${orderType === 'pickup' ? 'opacity-70' : 'text-gray-400'}`}>
                            {shopStatus.pickup.isOpen ? `${shopStatus.pickup.openFrom}–${shopStatus.pickup.openUntil} Uhr` : shopStatus.pickup.openFrom ? `ab ${shopStatus.pickup.openFrom} Uhr` : ''}
                          </span>
                        )}
                        <span className={`text-xs ${orderType === 'pickup' ? 'opacity-70' : 'text-gray-400'}`}>Kostenlos</span>
                        {shopStatus && !shopStatus.pickup.isOpen && !shopStatus.isPreorder && (
                          <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold">Geschlossen</span>
                        )}
                      </button>
                    </div>
                    {alternativeTypeHint && (
                      <button type="button" onClick={() => setOrderType(alternativeTypeHint.type)}
                        className="mt-3 w-full bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-semibold hover:bg-green-100 transition text-left flex items-center justify-between">
                        <span>{alternativeTypeHint.msg}</span><span className="text-xs flex-shrink-0">→</span>
                      </button>
                    )}
                    {shopOpenForType === false && !shopStatus?.isPreorder && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                        <AlertCircle size={15} className="flex-shrink-0" />
                        <span><b>{orderType === 'delivery' ? '🚗 Lieferung' : '🏪 Abholung'}</b> ist gerade nicht möglich.</span>
                      </div>
                    )}
                    {orderType === 'pickup' && (
                      <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-800">
                        <p className="font-bold mb-1">📍 Abholadresse</p>
                        <p>Konrad-Adenauer-Platz 2, 40764 Langenfeld</p>
                        <p className="text-xs text-purple-600 mt-1">Du erhältst eine Benachrichtigung wenn deine Bestellung bereit ist.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Kundendaten */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white"><User size={18} /></div>
                    <div>
                      <h2 className="font-bold text-gray-900">{orderType === 'pickup' ? 'Deine Daten' : 'Lieferadresse'}</h2>
                      <p className="text-xs text-gray-400">Bitte alle Felder ausfüllen</p>
                    </div>
                  </div>
                  <Field label="Vollständiger Name" required>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" className={inputClass} />
                  </Field>
                  {isGuest && (
                    <Field label="E-Mail" required>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="max@email.de" className={inputClass} />
                    </Field>
                  )}
                  <Field label="Telefonnummer" required>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 170 1234567" className={inputClass} />
                  </Field>
                  {orderType === 'delivery' && (
                    <>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 100px', gap:'8px'}}>
                        <Field label="Straße" required>
                          <StreetInput street={street} setStreet={setStreet} inputClass={inputClass} />
                        </Field>
                        <Field label="Hausnummer" required>
                          <input type="text" value={hausnr} onChange={e => setHausnr(e.target.value)}
                            placeholder="12a" className={inputClass} />
                        </Field>
                      </div>
                      {deliveryZones.filter(z => z.enabled).length > 1 ? (
                        <Field label="Liefergebiet" required>
                          <select value={zip} onChange={e => {
                            const zone = deliveryZones.find(z => z.zip === e.target.value)
                            if (zone) { setZip(zone.zip); setCity(zone.city) }
                          }} className={inputClass}>
                            {deliveryZones.filter(z => z.enabled).map(z => (
                              <option key={z.id} value={z.zip}>{z.zip} – {z.city}</option>
                            ))}
                          </select>
                        </Field>
                      ) : (
                        <div className="grid grid-cols-5 gap-3">
                          <div className="col-span-2">
                            <Field label="PLZ" required>
                              <input type="text" value={zip} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed text-gray-500`} />
                            </Field>
                          </div>
                          <div className="col-span-3">
                            <Field label="Stadt" required>
                              <input type="text" value={city} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed text-gray-500`} />
                            </Field>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <Field label="Anmerkungen">
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      placeholder={orderType === 'pickup' ? 'z.B. Sonderwünsche...' : 'z.B. Klingel defekt, 2. Stock links...'}
                      className={`${inputClass} resize-none`} />
                  </Field>
                </div>

                {effectiveMinimumOrder > 0 && subtotal < effectiveMinimumOrder && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>Mindestbestellwert <b>{effectiveMinimumOrder.toFixed(2)} €</b> – noch <b>{(effectiveMinimumOrder - subtotal).toFixed(2)} €</b> fehlen</span>
                  </div>
                )}

                {(effectiveMinimumOrder === 0 || subtotal >= effectiveMinimumOrder) && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                      <CreditCard size={13} /> Zahlungsmethode
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${paymentOptions.length}, 1fr)` }}>
                      {paymentOptions.map(opt => (
                        <button key={opt.id} type="button" onClick={() => setPaymentMethod(opt.id as any)}
                          className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${paymentMethod === opt.id ? opt.id === 'paypal' ? 'border-blue-600 bg-blue-600 text-white' : opt.id === 'cash' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* ── AGB Checkbox ── */}
                    <AgbCheckbox accepted={agbAccepted} onChange={setAgbAccepted} />
                    {!agbAccepted && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5">
                        <AlertCircle size={12} /> Bitte AGB und Datenschutzerklärung akzeptieren um fortzufahren.
                      </p>
                    )}

                    {paymentMethod === 'stripe' && clientSecret && (
                      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#111827', borderRadius: '12px' } } }}>
                        <StripeForm
                          session={session} isGuest={isGuest} cart={cart} total={grandTotal} subtotal={subtotal}
                          shopOpenForType={shopOpenForType} minimumOrder={effectiveMinimumOrder} deliveryFee={effectiveDeliveryFee}
                          voucher={voucher} tip={tip} name={name} email={email} phone={phone}
                          street={street} hausnr={hausnr} zip={zip} city={city} notes={notes} orderType={orderType}
                          isPreorder={shopStatus?.isPreorder ?? false}
                          agbAccepted={agbAccepted}
                        />
                      </Elements>
                    )}
                    {paymentMethod === 'stripe' && !clientSecret && (
                      <div className="text-center py-8"><div className="text-4xl mb-2 animate-pulse">🍦</div><p className="text-sm text-gray-400">Zahlung wird vorbereitet...</p></div>
                    )}

                    {paymentMethod === 'paypal' && showPayPal && paypalClientId && (
                      <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'EUR' }}>
                        <div className="space-y-3">
                          {(!isFormValid || !agbAccepted) && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                              {!isFormValid ? '⚠️ Bitte zuerst alle Pflichtfelder ausfüllen' : '⚠️ Bitte AGB akzeptieren'}
                            </div>
                          )}
                          <div className={(!isFormValid || !agbAccepted) ? 'opacity-40 pointer-events-none' : ''}>
                            <PayPalButtons style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }} disabled={!isFormValid || !agbAccepted}
                              createOrder={(_data, actions) => actions.order.create({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: 'EUR', value: grandTotal.toFixed(2) }, description: 'Eiscafe Simonetti Bestellung' }] })}
                              onApprove={async (_data, actions) => { const order = await actions.order!.capture(); await saveOrder(order.id || 'paypal-' + Date.now(), 'paypal') }}
                              onError={err => console.error('PayPal error:', err)} />
                          </div>
                        </div>
                      </PayPalScriptProvider>
                    )}

                    {paymentMethod === 'cash' && showCash && (
                      <div className="space-y-3">
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
                          <Banknote size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-green-800">
                            <p className="font-bold mb-1">{orderType === 'pickup' ? 'Barzahlung bei Abholung' : 'Barzahlung bei Lieferung'}</p>
                            <p className="text-green-700">Bitte halte den Betrag von <b>{grandTotal.toFixed(2)} €</b> passend bereit.</p>
                          </div>
                        </div>
                        {/* Wechselgeld-Feld */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">💶 Mit welchem Schein zahlst du? <span className="font-normal text-gray-400">(optional)</span></p>
                          <div className="flex gap-2 flex-wrap mb-2">
                            {['Passend', '20 €', '50 €', '100 €'].map(opt => (
                              <button key={opt} type="button"
                                onClick={() => setCashNote(cashNote === opt ? '' : opt)}
                                className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition ${cashNote === opt ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={cashNote}
                            onChange={e => setCashNote(e.target.value)}
                            placeholder="Oder freitext, z.B. 200 €..."
                            className={inputClass}
                          />
                        </div>
                        {(!isFormValid || !agbAccepted) && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                            {!isFormValid ? '⚠️ Bitte zuerst alle Pflichtfelder ausfüllen' : '⚠️ Bitte AGB akzeptieren'}
                          </div>
                        )}
                        <button type="button" onClick={handleCashOrder} disabled={!isFormValid || !agbAccepted || shopOpenForType === false}
                          className={`w-full py-4 text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${!isFormValid || !agbAccepted || shopOpenForType === false ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-sm'}`}>
                          <Banknote size={20} />
                          {shopOpenForType === false ? 'Diese Option ist gerade geschlossen' : `Jetzt bestellen · ${grandTotal.toFixed(2)} € bar`}
                        </button>
                      </div>
                    )}
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

function StreetInput({ street, setStreet, inputClass }: { street: string; setStreet: (v: string) => void; inputClass: string }) {
  const [suggestions, setSuggestions] = useState<Street[]>([])
  const [show, setShow]               = useState(false)
  return (
    <div className="relative">
      <input type="text" value={street}
        onChange={e => { setStreet(e.target.value); setSuggestions(searchStreets(e.target.value)); setShow(true) }}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        onFocus={() => street.length >= 2 && setShow(true)}
        required placeholder="z.B. Hauptstraße 5" className={inputClass} autoComplete="off" />
      {show && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onMouseDown={() => { setStreet(s.name + ' '); setShow(false) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition flex items-center gap-2">
              <MapPin size={13} className="text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-800">{s.name}</span>
              {s.district && <span className="text-xs text-gray-400 ml-auto">{s.district}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StripeForm({ session, isGuest, cart, total, subtotal, shopOpenForType, minimumOrder, deliveryFee, voucher, tip, name, email, phone, street, zip, city, notes, orderType, isPreorder, agbAccepted }: {
  session: Session | null; isGuest: boolean; cart: CartItem[]; total: number; subtotal: number
  shopOpenForType: boolean | null; minimumOrder: number; deliveryFee: number; voucher: AppliedVoucher | null
  tip: number; name: string; email: string; phone: string; street: string; hausnr: string; zip: string; city: string; notes: string
  orderType: string; isPreorder: boolean; agbAccepted: boolean
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const router   = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const isFormValid = orderType === 'pickup'
    ? !!(name.trim() && phone.trim() && (!isGuest || email.trim()))
    : !!(name.trim() && phone.trim() && street.trim() && hausnr.trim() && (!isGuest || email.trim()))

  const isBlocked = shopOpenForType === false || subtotal < minimumOrder || !isFormValid || !agbAccepted

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agbAccepted) return
    try {
      const statusData = await fetch('/api/shop-status').then(r => r.json())
      const typeOpen = orderType === 'pickup' ? statusData.pickup?.isOpen : statusData.delivery?.isOpen
      if (!typeOpen && !statusData.isPreorder) { setError(`${orderType === 'pickup' ? 'Abholung' : 'Lieferung'} ist momentan nicht verfügbar.`); return }
    } catch {}
    if (!stripe || !elements) return
    setLoading(true); setError('')
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
      if (stripeError) throw new Error(stripeError.message)
      if (voucher?.id) await supabase.rpc('increment_voucher_uses', { voucher_id: voucher.id })
    if (loyalty?.points_used && session?.user?.id) {
      await supabase.from('loyalty_transactions').insert({
        user_id: session.user.id,
        points: -loyalty.points_used,
        reason: 'redemption',
      })
    }
      const orderData = {
        user_id: session?.user?.id || null, guest_email: isGuest ? email : null,
        customer_name: name, customer_email: isGuest ? email : session?.user?.email,
        customer_phone: phone || null, items: cart, subtotal,
        discount: voucher?.discountAmount || 0, voucher_code: voucher?.code || null, voucher_id: voucher?.id || null,
        delivery_fee: deliveryFee, tip, total,
        delivery_address: orderType === 'pickup' ? null : { name, street: `${street} ${hausnr}`.trim(), zip, city },
        notes: notes || null, payment_intent_id: paymentIntent?.id, payment_method: 'stripe',
        order_type: orderType, status: 'OFFEN',
      }
      await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) })
      localStorage.removeItem('simonetti-cart'); localStorage.removeItem('cart')
      router.push('/order-success')
    } catch (err: any) { setError(err.message || 'Zahlung fehlgeschlagen') } finally { setLoading(false) }
  }

  const btnLabel = loading ? null
    : shopOpenForType === false  ? `🔒 ${orderType === 'pickup' ? 'Abholung' : 'Lieferung'} geschlossen`
    : subtotal < minimumOrder    ? 'Mindestbestellwert nicht erreicht'
    : !isFormValid               ? 'Bitte alle Felder ausfüllen'
    : !agbAccepted               ? 'Bitte AGB akzeptieren'
    : `✅ Jetzt bezahlen · ${total.toFixed(2)} €`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"><AlertCircle size={16} /> {error}</div>}
      <div className="border-2 border-gray-100 rounded-2xl p-4"><PaymentElement /></div>
      <button type="submit" disabled={!stripe || loading || isBlocked}
        className={`w-full py-4 text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${isBlocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98] shadow-sm'}`}>
        {loading
          ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Zahlung wird verarbeitet...</>
          : btnLabel}
      </button>
    </form>
  )
}