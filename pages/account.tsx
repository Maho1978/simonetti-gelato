import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import {
  Package, RefreshCw, LogOut, User, MapPin, Mail,
  ChevronDown, ChevronUp, Clock, CheckCircle, Truck, XCircle,
  Star, MessageSquare, Plus, Edit2, Trash2, AlertTriangle, Send
} from 'lucide-react'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FEATURE FLAGS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface FeatureFlags {
  reorder_enabled:      boolean
  live_tracking:        boolean
  multi_address:        boolean
  allergy_profile:      boolean
  favorites_enabled:    boolean
  feedback_enabled:     boolean
  messages_enabled:     boolean
  suggestions_enabled:  boolean
  loyalty_enabled:      boolean
  wallet_enabled:       boolean
  voucher_enabled:      boolean
  tip_enabled:          boolean
  scheduled_order:      boolean
  gift_enabled:         boolean
  referral_enabled:     boolean
  subscription_enabled: boolean
}

const FLAG_DEFAULTS: FeatureFlags = {
  reorder_enabled:      true,
  live_tracking:        true,
  multi_address:        true,
  allergy_profile:      false,
  favorites_enabled:    false,
  feedback_enabled:     true,
  messages_enabled:     true,
  suggestions_enabled:  true,
  loyalty_enabled:      false,
  wallet_enabled:       false,
  voucher_enabled:      false,
  tip_enabled:          false,
  scheduled_order:      false,
  gift_enabled:         false,
  referral_enabled:     false,
  subscription_enabled: false,
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TYPES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Order {
  id: string
  order_number: string
  created_at: string
  items: any[]
  total: number
  subtotal: number
  delivery_fee: number
  tip: number
  discount: number
  status: string
  delivery_address: any
  order_type: string
  payment_method: string
  notes?: string
}

interface CustomerAddress {
  id: string
  label: string
  icon: string
  recipient_name: string
  street: string
  house_number?: string
  zip: string
  city: string
  extra?: string
  is_default: boolean
}

interface CustomerProfile {
  first_name?: string
  last_name?: string
  phone?: string
  birth_date?: string
  newsletter: boolean
  allergies: string[]
  dietary_notes?: string
  loyalty_points: number
  wallet_balance: number
  referral_code?: string
}

interface Message {
  id: string
  direction: 'from_customer' | 'from_shop'
  message: string
  read_by_customer: boolean
  created_at: string
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  OFFEN:          { label: 'Offen',          color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock       },
  IN_BEARBEITUNG: { label: 'In Bearbeitung', color: 'text-blue-700',   bg: 'bg-blue-100',   icon: RefreshCw   },
  UNTERWEGS:      { label: 'Unterwegs',      color: 'text-orange-700', bg: 'bg-orange-100', icon: Truck       },
  ABGEHOLT:       { label: 'Abgeholt',       color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  GELIEFERT:      { label: 'Geliefert',      color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  STORNIERT:      { label: 'Storniert',      color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle     },
}

const ALLERGEN_LIST = ['Nuesse', 'Laktose', 'Gluten', 'Eier', 'Soja', 'Erdbeeren', 'Schokolade', 'Alkohol']

function formatAddress(addr: any): string {
  if (!addr) return '-'
  if (typeof addr === 'string') return addr
  return [addr.street, addr.zip && addr.city ? addr.zip + ' ' + addr.city : addr.city].filter(Boolean).join(', ')
}

function formatPayment(method: string): string {
  switch (method) {
    case 'stripe':  return 'Kreditkarte'
    case 'paypal':  return 'PayPal'
    case 'cash':    return 'Barzahlung'
    case 'klarna':  return 'Klarna'
    default:        return method || '-'
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ORDER CARD
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrderCard({ order, flags, onReorder }: {
  order: Order
  flags: FeatureFlags
  onReorder: (order: Order) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[order.status] || { label: order.status, color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock }
  const StatusIcon = status.icon
  const isLive = ['OFFEN', 'IN_BEARBEITUNG', 'UNTERWEGS'].includes(order.status)

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-[#C4973A]/40 transition-colors">
      <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center flex-shrink-0">
            <Package size={20} className="text-[#C4973A]" />
          </div>
          <div>
            <div className="font-bold text-gray-900">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</div>
            <div className="text-sm text-gray-400 mt-0.5">
              {new Date(order.created_at).toLocaleDateString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })} Uhr
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">{order.total.toFixed(2)} EUR</div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
              <StatusIcon size={11} />
              {status.label}
            </span>
          </div>
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>

      {flags.live_tracking && isLive && (
        <div className="mx-5 mb-3 bg-[#C4973A]/10 border border-[#C4973A]/30 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#8a6510]">
            <Truck size={15} />
            Deine Bestellung ist unterwegs
          </div>
          <Link href={`/tracking/${order.id}`} className="text-xs font-bold text-[#C4973A] hover:text-[#a87b20]">
            Live verfolgen
          </Link>
        </div>
      )}

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Artikel</div>
            <div className="space-y-2">
              {(order.items || []).map((item: any, idx: number) => {
                const flavors = (item.selectedFlavors || item.flavors || []).join(', ')
                const extras  = (item.selectedExtras || item.extras || []).map((e: any) => e.name || e).join(', ')
                const lineTotal = ((item.totalPrice || (item.price * item.quantity)) || 0).toFixed(2)
                return (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-sm text-gray-800">{item.quantity}x {item.name}</span>
                      {flavors && <div className="text-xs text-gray-400 mt-0.5">{flavors}</div>}
                      {extras  && <div className="text-xs text-gray-400">{extras}</div>}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 ml-4 flex-shrink-0">{lineTotal} EUR</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            {order.subtotal > 0 && (
              <div className="flex justify-between text-gray-500"><span>Zwischensumme</span><span>{order.subtotal.toFixed(2)} EUR</span></div>
            )}
            {order.order_type !== 'pickup' && (
              <div className="flex justify-between text-gray-500"><span>Liefergebuehr</span><span>{(order.delivery_fee ?? 3).toFixed(2)} EUR</span></div>
            )}
            {order.tip > 0 && (
              <div className="flex justify-between text-gray-500"><span>Trinkgeld</span><span>{order.tip.toFixed(2)} EUR</span></div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600"><span>Rabatt</span><span>-{order.discount.toFixed(2)} EUR</span></div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Gesamt</span><span>{order.total.toFixed(2)} EUR</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
                {order.order_type === 'pickup' ? 'Abholung' : 'Lieferadresse'}
              </div>
              <div className="text-gray-700 font-medium">
                {order.order_type === 'pickup' ? 'Konrad-Adenauer-Platz 2, 40764 Langenfeld' : formatAddress(order.delivery_address)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Zahlung</div>
              <div className="text-gray-700 font-medium">{formatPayment(order.payment_method)}</div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
              {order.notes}
            </div>
          )}

          <div className="flex gap-2 flex-wrap pt-1">
            {flags.reorder_enabled && (
              <button
                onClick={() => onReorder(order)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white text-sm font-semibold rounded-xl hover:bg-black transition"
              >
                <RefreshCw size={14} />
                Nochmal bestellen
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:border-[#C4973A] hover:text-[#C4973A] transition">
              Rechnung
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ADDRESS CARD
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddressCard({ address, onEdit, onDelete, onSetDefault }: {
  address: CustomerAddress
  onEdit: (a: CustomerAddress) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}) {
  return (
    <div className={`bg-white rounded-2xl border-2 p-4 relative transition-colors ${
      address.is_default ? 'border-[#C4973A] bg-[#fffbf2]' : 'border-gray-100 hover:border-[#C4973A]/40'
    }`}>
      {address.is_default && (
        <span className="absolute top-3 right-3 bg-[#C4973A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
          Standard
        </span>
      )}
      <div className="text-2xl mb-2">{address.icon || 'ðŸ“'}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{address.label}</div>
      <div className="font-semibold text-gray-900 text-sm mb-1">{address.recipient_name}</div>
      <div className="text-sm text-gray-500 leading-relaxed">
        {address.street} {address.house_number}<br />
        {address.zip} {address.city}
        {address.extra && <><br /><span className="text-gray-400 text-xs">{address.extra}</span></>}
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        <button onClick={() => onEdit(address)} className="flex items-center gap-1 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-[#C4973A] hover:text-[#C4973A] transition">
          <Edit2 size={11} /> Bearbeiten
        </button>
        {!address.is_default && (
          <>
            <button onClick={() => onSetDefault(address.id)} className="flex items-center gap-1 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-[#C4973A] hover:text-[#C4973A] transition">
              Als Standard
            </button>
            <button onClick={() => onDelete(address.id)} className="flex items-center gap-1 text-xs font-semibold text-red-400 border border-red-100 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition">
              <Trash2 size={11} /> Loeschen
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ADDRESS MODAL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddressModal({ address, isNew, onSave, onClose }: {
  address: CustomerAddress
  isNew: boolean
  onSave: (a: Partial<CustomerAddress>) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Partial<CustomerAddress>>(address)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 text-lg mb-4">{isNew ? 'Neue Adresse' : 'Adresse bearbeiten'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Bezeichnung</label>
            <select
              value={draft.label}
              onChange={e => setDraft(p => ({ ...p, label: e.target.value, icon: e.target.value === 'Zuhause' ? 'ðŸ ' : e.target.value === 'Arbeit' ? 'ðŸ¢' : 'ðŸ“Œ' }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] transition"
            >
              <option>Zuhause</option>
              <option>Arbeit</option>
              <option>Sonstige</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Name</label>
            <input type="text" value={draft.recipient_name || ''} onChange={e => setDraft(p => ({ ...p, recipient_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] transition" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Strasse und Hausnummer</label>
            <input type="text" value={draft.street || ''} onChange={e => setDraft(p => ({ ...p, street: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] transition" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">PLZ</label>
            <input type="text" value={draft.zip || ''} onChange={e => setDraft(p => ({ ...p, zip: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] transition" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Stadt</label>
            <input type="text" value={draft.city || ''} onChange={e => setDraft(p => ({ ...p, city: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] transition" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Zusatz (Klingel, Etage)</label>
            <input type="text" value={draft.extra || ''} onChange={e => setDraft(p => ({ ...p, extra: e.target.value }))} placeholder="z.B. 3. OG links"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4973A] transition" />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition">
            Abbrechen
          </button>
          <button onClick={() => onSave(draft)} className="px-5 py-2 bg-[#C4973A] text-white text-sm font-bold rounded-xl hover:bg-[#a87b20] transition">
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TABS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Tab = 'bestellungen' | 'adressen' | 'profil' | 'nachrichten' | 'wallet'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN PAGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AccountPage({ session }: { session: Session | null }) {
  const router = useRouter()

  const [tab, setTab]                           = useState<Tab>('bestellungen')
  const [orders, setOrders]                     = useState<Order[]>([])
  const [addresses, setAddresses]               = useState<CustomerAddress[]>([])
  const [profile, setProfile]                   = useState<CustomerProfile | null>(null)
  const [messages, setMessages]                 = useState<Message[]>([])
  const [flags, setFlags]                       = useState<FeatureFlags>(FLAG_DEFAULTS)
  const [loading, setLoading]                   = useState(true)
  const [msgInput, setMsgInput]                 = useState('')
  const [feedback, setFeedback]                 = useState({ rating: 4, mood: 'good', text: '' })
  const [editingProfile, setEditingProfile]     = useState(false)
  const [profileDraft, setProfileDraft]         = useState<Partial<CustomerProfile>>({})
  const [toast, setToast]                       = useState('')
  const [voucherCode, setVoucherCode]           = useState('')
  const [addrModal, setAddrModal]               = useState<CustomerAddress | null>(null)
  const [addrNew, setAddrNew]                   = useState(false)
  const bottomRef                               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session) { router.push('/auth/customer-login?redirect=/account'); return }
    Promise.all([fetchOrders(), fetchFlags(), fetchProfile(), fetchAddresses(), fetchMessages()])
      .finally(() => setLoading(false))
  }, [session])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 3000)
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?user_id=${session?.user.id}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (e) { console.error(e) }
  }

  const fetchFlags = async () => {
    try {
      const { data } = await supabase.from('feature_flags').select('id,enabled')
      if (data) {
        const map = Object.fromEntries(data.map((f: any) => [f.id, f.enabled]))
        setFlags({ ...FLAG_DEFAULTS, ...map })
      }
    } catch (e) { console.error(e) }
  }

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single()
      if (data) {
        setProfile(data)
        setProfileDraft(data)
      } else {
        await supabase.from('customer_profiles').insert({ id: session?.user.id })
      }
    } catch (e) { console.error(e) }
  }

  const fetchAddresses = async () => {
    try {
      const { data } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('is_default', { ascending: false })
      setAddresses(data || [])
    } catch (e) { console.error(e) }
  }

  const fetchMessages = async () => {
    try {
      const { data } = await supabase
        .from('customer_messages')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: true })
      setMessages(data || [])
      if (data?.length) {
        await supabase.from('customer_messages')
          .update({ read_by_customer: true })
          .eq('user_id', session?.user.id)
          .eq('direction', 'from_shop')
      }
    } catch (e) { console.error(e) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleReorder = (order: Order) => {
    localStorage.setItem('reorder_items', JSON.stringify(order.items))
    router.push('/?reorder=1')
    showToast('Bestellung in den Warenkorb gelegt!')
  }

  const saveProfile = async () => {
    try {
      await supabase.from('customer_profiles').upsert({ id: session?.user.id, ...profileDraft })
      setProfile(prev => ({ ...prev!, ...profileDraft }))
      setEditingProfile(false)
      showToast('Profil gespeichert!')
    } catch (e) { showToast('Fehler beim Speichern') }
  }

  const saveAddress = async (addr: Partial<CustomerAddress>) => {
    try {
      if (addrNew) {
        await supabase.from('customer_addresses').insert({ ...addr, user_id: session?.user.id })
      } else {
        await supabase.from('customer_addresses').update(addr).eq('id', addrModal?.id)
      }
      await fetchAddresses()
      setAddrModal(null); setAddrNew(false)
      showToast('Adresse gespeichert!')
    } catch (e) { showToast('Fehler beim Speichern') }
  }

  const deleteAddress = async (id: string) => {
    await supabase.from('customer_addresses').delete().eq('id', id)
    setAddresses(prev => prev.filter(a => a.id !== id))
    showToast('Adresse geloescht')
  }

  const setDefaultAddress = async (id: string) => {
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', session?.user.id)
    await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id)
    await fetchAddresses()
    showToast('Standardadresse gesetzt')
  }

  const sendMessage = async () => {
    if (!msgInput.trim()) return
    try {
      const { data } = await supabase.from('customer_messages').insert({
        user_id: session?.user.id,
        direction: 'from_customer',
        message: msgInput.trim(),
        read_by_admin: false,
        read_by_customer: true,
      }).select().single()
      if (data) setMessages(prev => [...prev, data])
      setMsgInput('')
    } catch (e) { showToast('Fehler beim Senden') }
  }

  const sendFeedback = async () => {
    try {
      await supabase.from('customer_feedback').insert({
        user_id: session?.user.id,
        rating: feedback.rating,
        mood: feedback.mood,
        message: feedback.text,
        category: 'general',
      })
      setFeedback({ rating: 4, mood: 'good', text: '' })
      showToast('Feedback gesendet - Danke!')
    } catch (e) { showToast('Fehler beim Senden') }
  }

  const redeemVoucher = async () => {
    if (!voucherCode.trim()) return
    try {
      const { data } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('is_active', true)
        .single()
      if (!data) { showToast('UngÃ¼ltiger oder abgelaufener Code'); return }
      if (data.valid_until && new Date(data.valid_until) < new Date()) { showToast('Gutschein abgelaufen'); return }
      if (data.current_uses >= data.max_uses) { showToast('Gutschein bereits ausgeschoepft'); return }
      showToast(`Gutschein aktiviert! ${data.discount_type === 'percentage' ? data.discount_value + '%' : data.discount_value + ' EUR'} Rabatt`)
      setVoucherCode('')
    } catch (e) { showToast('UngÃ¼ltiger Code') }
  }

  const toggleAllergy = (allergen: string) => {
    const current = profileDraft.allergies || []
    const updated = current.includes(allergen) ? current.filter(a => a !== allergen) : [...current, allergen]
    setProfileDraft(prev => ({ ...prev, allergies: updated }))
  }

  const unreadMessages = messages.filter(m => m.direction === 'from_shop' && !m.read_by_customer).length
  const userName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Kunde'

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">ðŸ¦</div>
        <p className="text-gray-400">LÃ¤dt...</p>
      </div>
    </div>
  )

  const TABS: { key: Tab; label: string; icon: any; show: boolean; badge?: number }[] = [
    { key: 'bestellungen', label: 'Bestellungen', icon: Package,       show: true },
    { key: 'adressen',     label: 'Adressen',     icon: MapPin,        show: flags.multi_address },
    { key: 'profil',       label: 'Profil',        icon: User,          show: true },
    { key: 'nachrichten',  label: 'Nachrichten',   icon: MessageSquare, show: flags.messages_enabled || flags.feedback_enabled, badge: unreadMessages },
    { key: 'wallet',       label: 'Wallet',         icon: Star,          show: flags.wallet_enabled || flags.loyalty_enabled || flags.voucher_enabled },
  ]

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1a1a] text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Profil Header */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#C4973A] rounded-full flex items-center justify-center flex-shrink-0">
              <User size={26} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-lg">{userName}</div>
              <div className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">
                <Mail size={12} />
                {session?.user?.email}
              </div>
              {flags.loyalty_enabled && profile?.loyalty_points !== undefined && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="text-xs font-bold text-[#C4973A]">{profile.loyalty_points} Punkte</div>
                  {flags.wallet_enabled && profile.wallet_balance > 0 && (
                    <div className="text-xs text-gray-400">{profile.wallet_balance.toFixed(2)} EUR Guthaben</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition">
            <LogOut size={16} />
            Abmelden
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f0ede7] p-1 rounded-xl border border-black/8 mb-6 overflow-x-auto">
          {TABS.filter(t => t.show).map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition relative flex-1 justify-center
                  ${tab === t.key ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'}`}
              >
                <Icon size={14} />
                {t.label}
                {t.badge ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {/* TAB: BESTELLUNGEN */}
        {tab === 'bestellungen' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Meine Bestellungen</h2>
              <span className="text-sm text-gray-400">{orders.length} Bestellung{orders.length !== 1 ? 'en' : ''}</span>
            </div>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-6xl mb-4">ðŸ¦</div>
                <p className="text-xl font-bold text-gray-700 mb-2">Noch keine Bestellungen</p>
                <p className="text-gray-400 mb-6">Bestell jetzt dein erstes Eis!</p>
                <button onClick={() => router.push('/')} className="px-6 py-3 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-black transition">
                  Jetzt bestellen
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <OrderCard key={order.id} order={order} flags={flags} onReorder={handleReorder} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ADRESSEN */}
        {tab === 'adressen' && flags.multi_address && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Lieferadressen</h2>
              <button
                onClick={() => { setAddrNew(true); setAddrModal({ id: '', label: 'Zuhause', icon: 'ðŸ ', recipient_name: userName, street: '', zip: '', city: '', is_default: false }) }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] text-white text-sm font-bold rounded-xl hover:bg-black transition"
              >
                <Plus size={14} /> Neue Adresse
              </button>
            </div>
            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">Noch keine Adressen</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map(addr => (
                  <AddressCard key={addr.id} address={addr} onEdit={a => { setAddrModal(a); setAddrNew(false) }} onDelete={deleteAddress} onSetDefault={setDefaultAddress} />
                ))}
                <button
                  onClick={() => { setAddrNew(true); setAddrModal({ id: '', label: 'Sonstige', icon: 'ðŸ“Œ', recipient_name: userName, street: '', zip: '', city: '', is_default: false }) }}
                  className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#C4973A] hover:text-[#C4973A] hover:bg-[#fffbf2] transition min-h-[140px]"
                >
                  <Plus size={24} />
                  <span className="text-sm font-semibold">Neue Adresse</span>
                </button>
              </div>
            )}
            {addrModal && <AddressModal address={addrModal} isNew={addrNew} onSave={saveAddress} onClose={() => { setAddrModal(null); setAddrNew(false) }} />}
          </div>
        )}

        {/* TAB: PROFIL */}
        {tab === 'profil' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><User size={16} /> Persoenliche Daten</h3>
                {!editingProfile ? (
                  <button onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-[#C4973A] hover:text-[#C4973A] transition">
                    <Edit2 size={12} /> Bearbeiten
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProfile(false); setProfileDraft(profile || {}) }} className="text-sm font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">Abbrechen</button>
                    <button onClick={saveProfile} className="text-sm font-semibold bg-[#C4973A] text-white px-3 py-1.5 rounded-lg hover:bg-[#a87b20] transition">Speichern</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Vorname',    key: 'first_name', type: 'text',  placeholder: 'Mario' },
                  { label: 'Nachname',   key: 'last_name',  type: 'text',  placeholder: 'Mustermann' },
                  { label: 'Telefon',    key: 'phone',      type: 'tel',   placeholder: '+49 2173' },
                  { label: 'Geburtstag', key: 'birth_date', type: 'date',  placeholder: '' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      disabled={!editingProfile}
                      value={(profileDraft as any)[f.key] || ''}
                      onChange={e => setProfileDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:border-[#C4973A] transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            {flags.allergy_profile && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Allergie und Ernaehrung</h3>
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Wird an Kueche gesendet</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">Waehle deine Allergene - automatisch bei jeder Bestellung.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ALLERGEN_LIST.map(a => {
                    const active = (profileDraft.allergies || []).includes(a)
                    return (
                      <button key={a} onClick={() => toggleAllergy(a)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${active ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}>
                        {active ? '! ' : ''}{a}
                      </button>
                    )
                  })}
                </div>
                <textarea rows={2} value={profileDraft.dietary_notes || ''} onChange={e => setProfileDraft(prev => ({ ...prev, dietary_notes: e.target.value }))}
                  placeholder="Weitere Anmerkungen..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#C4973A] transition" />
                <div className="flex justify-end mt-2">
                  <button onClick={saveProfile} className="text-sm font-bold bg-[#C4973A] text-white px-4 py-2 rounded-xl hover:bg-[#a87b20] transition">
                    Allergie-Profil speichern
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">ðŸ”’</div>
                Passwort aendern oder zuruecksetzen
              </div>
              <Link href="/auth/forgot-password" className="text-sm font-semibold text-[#C4973A] hover:text-[#a87c2a] transition">Aendern</Link>
            </div>

            {flags.referral_enabled && profile?.referral_code && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1">Freunde werben</h3>
                <p className="text-sm text-gray-400 mb-3">Dein Freund bekommt 2 EUR Rabatt - Du bekommst 2 EUR Guthaben</p>
                <div className="bg-[#f7f5f1] border border-[#C4973A]/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black tracking-widest text-[#C4973A] font-mono mb-2">{profile.referral_code}</div>
                  <button onClick={() => { navigator.clipboard?.writeText(profile.referral_code!); showToast('Code kopiert!') }} className="text-sm font-bold text-[#C4973A] hover:text-[#a87b20] transition">
                    Code kopieren
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm text-red-500 font-semibold flex items-center gap-2"><Trash2 size={14} /> Konto loeschen</div>
                <button onClick={() => showToast('Bitte kontaktiere uns: info@eiscafe-simonetti.de')} className="text-sm font-semibold text-red-400 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                  Anfragen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: NACHRICHTEN */}
        {tab === 'nachrichten' && (
          <div className="space-y-4">
            {flags.feedback_enabled && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Star size={16} className="text-[#C4973A]" /> Bewertung abgeben</h3>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setFeedback(f => ({ ...f, rating: n }))}>
                      <Star size={24} className={n <= feedback.rating ? 'text-[#C4973A] fill-[#C4973A]' : 'text-gray-200'} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {[
                    { key: 'fantastic', label: 'Fantastisch' },
                    { key: 'good',      label: 'Gut' },
                    { key: 'ok',        label: 'Geht so' },
                    { key: 'bad',       label: 'Nicht gut' },
                  ].map(m => (
                    <button key={m.key} onClick={() => setFeedback(f => ({ ...f, mood: m.key }))}
                      className={`px-3 py-2 rounded-full border text-sm font-semibold transition ${feedback.mood === m.key ? 'border-[#C4973A] bg-[#fffbf2] text-[#a87b20]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <textarea rows={3} value={feedback.text} onChange={e => setFeedback(f => ({ ...f, text: e.target.value }))}
                  placeholder="Was hat dir gefallen? Was koennen wir besser machen?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#C4973A] transition mb-2" />
                <button onClick={sendFeedback} className="w-full py-2.5 bg-[#C4973A] text-white font-bold rounded-xl hover:bg-[#a87b20] transition text-sm">
                  Feedback absenden
                </button>
              </div>
            )}

            {flags.messages_enabled && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><MessageSquare size={16} /> Nachrichten</h3>
                  <span className="text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Antwortzeit weniger als 2 Std.</span>
                </div>
                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                  {messages.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Noch keine Nachrichten. Schreib uns!</p>
                  )}
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'from_customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.direction === 'from_customer'
                          ? 'bg-[#fffbf2] border border-[#C4973A]/20 text-gray-800 rounded-br-sm'
                          : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                      }`}>
                        {msg.message}
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(msg.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="flex gap-2">
                  <textarea rows={2} value={msgInput} onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Schreib uns - Fragen, Sonderwuensche, alles willkommen..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#C4973A] transition" />
                  <button onClick={sendMessage} className="px-4 py-2 bg-[#1a1a1a] text-white rounded-xl hover:bg-black transition self-end">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

            {flags.suggestions_enabled && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1">Wuensche und Anregungen</h3>
                <p className="text-sm text-gray-400 mb-3">Welche Eissorten oder Produkte sollen wir anbieten?</p>
                <textarea rows={2} id="suggestionText" placeholder="z.B. mehr vegane Sorten, glutenfreie Waffeln..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#C4973A] transition mb-2" />
                <button onClick={async () => {
                  const el = document.getElementById('suggestionText') as HTMLTextAreaElement
                  if (!el.value.trim()) return
                  await supabase.from('customer_suggestions').insert({ user_id: session?.user.id, suggestion: el.value.trim() })
                  el.value = ''
                  showToast('Wunsch eingereicht - danke!')
                }} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:border-[#C4973A] hover:text-[#C4973A] transition">
                  Einreichen
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: WALLET */}
        {tab === 'wallet' && (
          <div className="space-y-4">

            {/* Guthaben Uebersicht */}
            <div className="grid grid-cols-2 gap-3">
              {flags.wallet_enabled && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                  <div className="text-2xl font-black text-[#C4973A] font-serif mb-1">
                    {(profile?.wallet_balance || 0).toFixed(2)} EUR
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Guthaben</div>
                </div>
              )}
              {flags.loyalty_enabled && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                  <div className="text-2xl font-black text-[#C4973A] font-serif mb-1">
                    {profile?.loyalty_points || 0}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Punkte</div>
                </div>
              )}
            </div>

            {/* Gutschein einloesen */}
            {flags.voucher_enabled && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1">Gutschein einloesen</h3>
                <p className="text-sm text-gray-400 mb-3">Code eingeben und beim naechsten Checkout abziehen.</p>
                <div className="flex gap-2">
                  <input type="text" value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="z.B. SOMMER25"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-[#C4973A] transition" />
                  <button onClick={redeemVoucher} className="px-5 py-2.5 bg-[#C4973A] text-white text-sm font-bold rounded-xl hover:bg-[#a87b20] transition">
                    Einloesen
                  </button>
                </div>
              </div>
            )}

            {/* Treuepunkte Stufen */}
            {flags.loyalty_enabled && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Treuepunkte-Stufen</h3>
                {[
                  { icon: 'Bronze', name: 'Bronze',  pts: '0-499',    reward: 'Gratis Waffelbecher' },
                  { icon: 'Silber', name: 'Silber',  pts: '500-999',  reward: 'Gratis Kugel' },
                  { icon: 'Gold', name: 'Gold',    pts: '1000+',    reward: 'Gratis Lieferung' },
                  { icon: 'Diamond', name: 'Diamond', pts: '2500+',    reward: '10% auf alles' },
                ].map(tier => {
                  const pts = profile?.loyalty_points || 0
                  const isActive = (tier.name === 'Bronze' && pts < 500) || (tier.name === 'Silber' && pts >= 500 && pts < 1000) || (tier.name === 'Gold' && pts >= 1000 && pts < 2500) || (tier.name === 'Diamond' && pts >= 2500)
                  return (
                    <div key={tier.name} className={`flex items-center gap-3 p-3 rounded-xl mb-2 border ${isActive ? 'border-[#C4973A] bg-[#fffbf2]' : 'border-gray-100'}`}>
                      <span className="text-xl">{tier.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{tier.name} {isActive && '(Du bist hier)'}</div>
                        <div className="text-xs text-gray-400">{tier.pts} Punkte</div>
                      </div>
                      <span className="text-xs font-semibold text-[#C4973A] bg-[#C4973A]/10 px-2 py-1 rounded-full">{tier.reward}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Abo */}
            {flags.subscription_enabled && (
              <div className="bg-white rounded-2xl border border-[#C4973A] p-5 shadow-sm" style={{ background: 'linear-gradient(135deg, #fdf8ee, #fffbf5)' }}>
                <div className="font-bold text-[#C4973A] text-lg mb-1">Simonetti Plus</div>
                <div className="text-sm text-gray-500 mb-3">2,99 EUR / Monat - 30 Tage kostenlos testen</div>
                <ul className="space-y-1.5 mb-4">
                  {['Kostenlose Lieferung ab 10 EUR', '5% Rabatt auf jede Bestellung', 'Doppelte Treuepunkte', 'Prioritaets-Lieferung'].map(perk => (
                    <li key={perk} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-[#C4973A] font-bold">+</span> {perk}
                    </li>
                  ))}
                </ul>
                <button onClick={() => showToast('30 Tage gratis starten!')} className="w-full py-2.5 bg-[#C4973A] text-white font-bold rounded-xl hover:bg-[#a87b20] transition text-sm">
                  Jetzt 30 Tage gratis testen
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
