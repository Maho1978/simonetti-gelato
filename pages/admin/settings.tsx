import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import {
  Clock, DollarSign, Save, PowerOff, Power, Calendar as CalendarIcon,
  Plus, Trash2, Edit2, X, Mail, ToggleLeft, ToggleRight, Share2,
  CreditCard, Eye, EyeOff, ExternalLink, CheckCircle, Zap,
  Gift, Sparkles, Store, MessageCircle
} from 'lucide-react'

const DAYS = {
  monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch',
  thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag'
}

// Default für einen Tag mit getrennten Zeiten
const DEFAULT_DAY = {
  delivery: { closed: false, open: '14:00', close: '18:30' },
  pickup:   { closed: false, open: '10:00', close: '18:30' },
}

const EMAIL_TYPES = [
  { key: 'order_confirmed',        label: '✅ Bestellbestätigung',      description: 'Wird gesendet wenn Bestellung auf "In Bearbeitung" gesetzt wird', alwaysOn: true,  color: 'green'  },
  { key: 'order_out_for_delivery', label: '🚗 Bestellung unterwegs',    description: 'Wird gesendet wenn Bestellung an Fahrer übergeben wird',          alwaysOn: false, color: 'blue'   },
  { key: 'order_delivered',        label: '🎉 Bestellung zugestellt',   description: 'Wird gesendet wenn Bestellung als geliefert markiert wird',        alwaysOn: false, color: 'purple' },
  { key: 'new_order_admin',        label: '🔔 Neue Bestellung (Admin)', description: 'Admin-Benachrichtigung bei jeder neuen Bestellung',               alwaysOn: false, color: 'red'    },
]

const DEFAULT_EMAIL_SETTINGS = {
  order_confirmed:        { enabled: true, subject: '✅ Bestellung bestätigt #{orderNumber} - Simonetti Gelateria', custom_text: '' },
  order_out_for_delivery: { enabled: true, subject: '🚗 Dein Eis ist unterwegs! #{orderNumber}',                   custom_text: '' },
  order_delivered:        { enabled: true, subject: '✅ Bestellung zugestellt #{orderNumber} - Guten Appetit!',    custom_text: '' },
  new_order_admin:        { enabled: true, subject: '🔔 Neue Bestellung #{orderNumber} - Sofort bearbeiten!',      custom_text: '' },
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram',   label: 'Instagram',   icon: '📸', placeholder: 'https://www.instagram.com/eiscafe_simonetti'            },
  { id: 'facebook',    label: 'Facebook',    icon: '👤', placeholder: 'https://www.facebook.com/eiscafe.simonetti'             },
  { id: 'tiktok',      label: 'TikTok',      icon: '🎵', placeholder: 'https://www.tiktok.com/@eiscafe_simonetti'              },
  { id: 'youtube',     label: 'YouTube',     icon: '▶️', placeholder: 'https://www.youtube.com/@eiscafe_simonetti'             },
  { id: 'whatsapp',    label: 'WhatsApp',    icon: '💬', placeholder: 'https://wa.me/4921731622780'                            },
  { id: 'google',      label: 'Google Maps', icon: '🗺️', placeholder: 'https://maps.google.com/?q=Eiscafe+Simonetti+Langenfeld' },
  { id: 'tripadvisor', label: 'TripAdvisor', icon: '🦉', placeholder: 'https://www.tripadvisor.de/...'                         },
  { id: 'yelp',        label: 'Yelp',        icon: '⭐', placeholder: 'https://www.yelp.de/biz/eiscafe-simonetti'              },
  { id: 'lieferando',  label: 'Lieferando',  icon: '🛵', placeholder: 'https://www.lieferando.de/...'                         },
  { id: 'x',           label: 'X (Twitter)', icon: '🐦', placeholder: 'https://x.com/eiscafe_simonetti'                       },
  { id: 'pinterest',   label: 'Pinterest',   icon: '📌', placeholder: 'https://www.pinterest.de/eiscafe_simonetti'             },
  { id: 'linkedin',    label: 'LinkedIn',    icon: '💼', placeholder: 'https://www.linkedin.com/company/...'                   },
]

const DEFAULT_SOCIAL = Object.fromEntries(SOCIAL_PLATFORMS.map(p => [p.id, { url: '', enabled: false }]))

const DEFAULT_PAYMENT_KEYS = {
  stripe: { mode: 'test', test_public: '', test_secret: '', live_public: '', live_secret: '', webhook_secret: '' },
  paypal: { mode: 'sandbox', sandbox_client_id: '', sandbox_client_secret: '', live_client_id: '', live_client_secret: '' },
  wero:   { api_key: '', merchant_id: '', note: 'Wero-Integration kommt sobald die offizielle API verfügbar ist.' }
}

const DEFAULT_NOTIFY_SETTINGS = {
  telegram_bot_token: '8692030046:AAFq19cayRGK8T_9AdR9NvvERnlPsMaVUk4',
  telegram_chat_id:   '8600937467',
  whatsapp_number:    '4921731622780',
}

const FEATURE_DEFINITIONS = [
  { id: 'reviews',          icon: '⭐', label: 'Bewertungssystem',          description: 'Kunden können bestellte Produkte mit 1–5 Sternen bewerten.',                           adminLink: '/admin/reviews', adminLabel: 'Bewertungen verwalten →', comingSoon: false },
  { id: 'telegram_notify',  icon: '✈️', label: 'Telegram Benachrichtigung', description: 'Sofort-Benachrichtigung auf dein Telegram bei neuer Bestellung – mit allen Details.', adminLink: null, adminLabel: null, comingSoon: false },
  { id: 'whatsapp_notify',  icon: '💬', label: 'WhatsApp Benachrichtigung', description: 'WhatsApp-Button im Kanban für direkte Kundenkommunikation. Kostenlos via wa.me Links.', adminLink: null,             adminLabel: null,                      comingSoon: false },
  { id: 'payment_paypal',   icon: '🅿️', label: 'PayPal',                   description: 'PayPal als Zahlungsmethode im Checkout anzeigen.',                                      adminLink: null,             adminLabel: null,                      comingSoon: false },
  { id: 'payment_klarna',   icon: '🛒', label: 'Klarna (Ratenkauf)',        description: 'Klarna als Zahlungsmethode im Checkout anzeigen.',                                      adminLink: null,             adminLabel: null,                      comingSoon: true  },
  { id: 'upsell',           icon: '✨', label: 'Upselling',             description: 'Zeigt Toppings & Tagesspecial dezent unterhalb des Warenkorbs im Checkout.',         adminLink: null,             adminLabel: null,                      comingSoon: false },
  { id: 'loyalty',          icon: '🎁', label: 'Treueprogramm',             description: 'Jede 10. Bestellung gratis.',                                                           adminLink: null,             adminLabel: null,                      comingSoon: true  },
  { id: 'favorites',        icon: '❤️', label: 'Favoriten',                 description: 'Kunden können Produkte als Favoriten speichern.',                                       adminLink: null,             adminLabel: null,                      comingSoon: true  },
]

const DEFAULT_MARKETING = {
  welcome_banner_enabled:  false,
  welcome_banner_code:     'WILLKOMMEN10',
  welcome_banner_discount: 10,
  welcome_banner_text:     'Als Dankeschön für deinen ersten Besuch schenken wir dir 10% auf deine erste Bestellung!',
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function KeyField({ label, value, onChange, placeholder, help, isSecret = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; help?: string; isSecret?: boolean
}) {
  const [show, setShow] = useState(false)
  const hasValue = value && value.trim() !== ''
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        {hasValue && <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><CheckCircle size={12} /> Eingetragen</span>}
      </div>
      <div className="relative">
        <input type={isSecret && !show ? 'password' : 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm font-mono" />
        {isSecret && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {help && <p className="text-xs text-gray-400 mt-1.5">{help}</p>}
    </div>
  )
}

function ProviderCard({ icon, title, subtitle, badge, badgeColor, children, docsUrl, isComingSoon }: {
  icon: string; title: string; subtitle: string; badge?: string
  badgeColor?: string; children?: React.ReactNode; docsUrl?: string; isComingSoon?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden ${isComingSoon ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}>
      <div className={`flex items-center justify-between px-6 py-4 ${!isComingSoon ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => !isComingSoon && setOpen(!open)}>
        <div className="flex items-center gap-4">
          <span className="text-3xl">{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{title}</span>
              {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeColor || 'bg-gray-100 text-gray-500'}`}>{badge}</span>}
              {isComingSoon && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-semibold">Bald verfügbar</span>}
            </div>
            <div className="text-sm text-gray-400">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {docsUrl && !isComingSoon && (
            <a href={docsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-semibold">
              <ExternalLink size={13} /> Anleitung
            </a>
          )}
          {!isComingSoon && <div className={`transition-transform duration-200 text-gray-400 ${open ? 'rotate-180' : ''}`}>▼</div>}
        </div>
      </div>
      {open && !isComingSoon && <div className="px-6 pb-6 border-t border-gray-100 pt-5">{children}</div>}
    </div>
  )
}

function SectionToggle({ enabled, onToggle, icon, label, description, color = 'green' }: {
  enabled: boolean; onToggle: () => void; icon: React.ReactNode
  label: string; description: string; color?: string
}) {
  const activeColor = color === 'gold' ? 'text-[#c9a66b]' : color === 'blue' ? 'text-blue-500' : color === 'purple' ? 'text-purple-600' : 'text-green-600'
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${enabled ? activeColor : 'text-gray-400'}`}>{icon}</div>
        <div>
          <div className="font-bold text-gray-900">{label}</div>
          <div className="text-xs text-gray-400 mt-0.5">{description}</div>
        </div>
      </div>
      <button onClick={onToggle}
        className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors mt-0.5 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// Kleines Zeit-Input-Feld
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="time" value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm w-28" />
  )
}

export default function SettingsPage() {
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast]         = useState('')

  const [settings, setSettings] = useState({
    delivery_fee: 3.0, min_order_value: 15.0,
    delivery_duration_min: 30, delivery_duration_max: 45,
    currently_open: true, manual_close: false,
    close_message: '', opening_hours: {} as any,
    pickup_enabled: false,
    preorder_enabled: false,
    preorder_start_hour: 10,
    preorder_hint: 'Du kannst jetzt vorbestellen – Lieferung startet ab {from} Uhr.'
  })

  const [marketing, setMarketing]               = useState<any>(DEFAULT_MARKETING)
  const [marketingSaving, setMarketingSaving]   = useState(false)
  const [emailSettings, setEmailSettings]       = useState<any>(DEFAULT_EMAIL_SETTINGS)
  const [emailSaving, setEmailSaving]           = useState(false)
  const [emailTestSending, setEmailTestSending] = useState<string | null>(null)
  const [testEmailAddress, setTestEmailAddress] = useState('bestellung@eiscafe-simonetti.de')
  const [socialLinks, setSocialLinks]           = useState<any>(DEFAULT_SOCIAL)
  const [socialSaving, setSocialSaving]         = useState(false)
  const [paymentKeys,    setPaymentKeys]    = useState<any>(DEFAULT_PAYMENT_KEYS)
  const [notifySettings, setNotifySettings] = useState<any>(DEFAULT_NOTIFY_SETTINGS)
  const [notifySaving,   setNotifySaving]   = useState(false)
  const [paymentSaving, setPaymentSaving]       = useState(false)
  const [specialHours, setSpecialHours]         = useState<any[]>([])
  const [showModal, setShowModal]               = useState(false)
  const [editingId, setEditingId]               = useState<any>(null)

  // Neues formData mit getrennten Feldern für Lieferung + Abholung
  const [formData, setFormData] = useState({
    date: '', label: '', notes: '',
    delivery_closed: false, delivery_open: '14:00', delivery_close: '18:30',
    pickup_closed:   false, pickup_open:   '10:00', pickup_close:   '18:30',
  })

  const [features, setFeatures]             = useState<Record<string, boolean>>({})
  const [featuresSaving, setFeaturesSaving] = useState(false)

  // Liefergebiete
  const [deliveryZones, setDeliveryZones] = useState<{ id: string; zip: string; city: string; enabled: boolean }[]>([
    { id: "1", zip: "40764", city: "Langenfeld", enabled: true }
  ])
  const [newZip, setNewZip]   = useState("")
  const [newCity, setNewCity] = useState("")

  // Upselling
  const [upsellEnabled, setUpsellEnabled] = useState(false)
  const [upsellToppings, setUpsellToppings] = useState<{ id: string; name: string; price: number; enabled: boolean }[]>([
    { id: '1', name: 'Schokosoße', price: 0.50, enabled: true },
    { id: '2', name: 'Erdbeersoße', price: 0.50, enabled: true },
    { id: '3', name: 'Streusel', price: 0.30, enabled: true },
    { id: '4', name: 'Waffel', price: 0.50, enabled: true },
  ])
  const [dailySpecial, setDailySpecial] = useState({ enabled: false, name: '', description: '', price: 0.0 })
  const [newToppingName, setNewToppingName] = useState('')
  const [newToppingPrice, setNewToppingPrice] = useState('0.50')

  useEffect(() => { loadSettings(); loadSpecialHours(); loadFeatures() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadSettings = async () => {
    setLoading(true)
    const { data } = await supabase.from('shop_settings').select('*').eq('id', 'main').single()
    if (data) {
      setSettings({
        delivery_fee:          data.delivery_fee          || 3.0,
        min_order_value:       data.min_order_value       || 15.0,
        delivery_duration_min: data.delivery_duration_min || 30,
        delivery_duration_max: data.delivery_duration_max || 45,
        currently_open:        data.currently_open        ?? true,
        manual_close:          data.manual_close          || false,
        close_message:         data.close_message         || '',
        opening_hours:         data.opening_hours         || {},
        pickup_enabled:        data.pickup_enabled        ?? false,
        preorder_enabled:      data.preorder_enabled      ?? false,
        preorder_start_hour:   data.preorder_start_hour   || 10,
        preorder_hint:         data.preorder_hint         || 'Du kannst jetzt vorbestellen – Lieferung startet ab {from} Uhr.',
      })
      if (data.email_notifications) setEmailSettings({ ...DEFAULT_EMAIL_SETTINGS, ...data.email_notifications })
      if (data.delivery_zones && data.delivery_zones.length > 0) setDeliveryZones(data.delivery_zones)
      if (data.upsell_enabled != null) setUpsellEnabled(data.upsell_enabled)
      if (data.upsell_toppings?.length) setUpsellToppings(data.upsell_toppings)
      if (data.daily_special) setDailySpecial(data.daily_special)
      if (data.social_links)        setSocialLinks({ ...DEFAULT_SOCIAL, ...data.social_links })
      if (data.payment_keys)        setPaymentKeys({ ...DEFAULT_PAYMENT_KEYS, ...data.payment_keys })
      if (data.notify_settings)     setNotifySettings({ ...DEFAULT_NOTIFY_SETTINGS, ...data.notify_settings })
      setMarketing({
        welcome_banner_enabled:  data.welcome_banner_enabled  ?? false,
        welcome_banner_code:     data.welcome_banner_code     || 'WILLKOMMEN10',
        welcome_banner_discount: data.welcome_banner_discount || 10,
        welcome_banner_text:     data.welcome_banner_text     || DEFAULT_MARKETING.welcome_banner_text,
      })
    }
    setLoading(false)
  }

  const loadFeatures = async () => {
    const { data } = await supabase.from('feature_toggles').select('id, enabled')
    if (data) {
      const map: Record<string, boolean> = {}
      data.forEach((f: any) => { map[f.id] = f.enabled })
      setFeatures(map)
    }
  }

  const loadSpecialHours = async () => {
    const { data } = await supabase.from('special_hours').select('*').order('date', { ascending: true })
    if (data) setSpecialHours(data)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('shop_settings').update({ ...settings, delivery_zones: deliveryZones, upsell_enabled: upsellEnabled, upsell_toppings: upsellToppings, daily_special: dailySpecial }).eq('id', 'main')
    if (!error) showToast('✅ Einstellungen gespeichert!')
    else showToast('❌ Fehler: ' + error.message)
    setSaving(false)
  }

  const handleSaveMarketing = async () => {
    setMarketingSaving(true)
    const { error } = await supabase.from('shop_settings').update({
      welcome_banner_enabled:  marketing.welcome_banner_enabled,
      welcome_banner_code:     marketing.welcome_banner_code,
      welcome_banner_discount: marketing.welcome_banner_discount,
      welcome_banner_text:     marketing.welcome_banner_text,
    }).eq('id', 'main')
    if (!error) showToast('✅ Marketing gespeichert!')
    else showToast('❌ Fehler: ' + error.message)
    setMarketingSaving(false)
  }

  const handleSaveEmails = async () => {
    setEmailSaving(true)
    const { error } = await supabase.from('shop_settings').update({ email_notifications: emailSettings }).eq('id', 'main')
    if (!error) showToast('✅ Email-Einstellungen gespeichert!')
    else showToast('❌ Fehler: ' + error.message)
    setEmailSaving(false)
  }

  const handleSaveSocial = async () => {
    setSocialSaving(true)
    const { error } = await supabase.from('shop_settings').update({ social_links: socialLinks }).eq('id', 'main')
    if (!error) showToast('✅ Social Media gespeichert!')
    else showToast('❌ Fehler: ' + error.message)
    setSocialSaving(false)
  }

  const handleSavePayment = async () => {
    setPaymentSaving(true)
    const { error } = await supabase.from('shop_settings').update({ payment_keys: paymentKeys }).eq('id', 'main')
    if (!error) showToast('✅ Zahlungs-Keys gespeichert!')
  }

  const saveNotifySettings = async () => {
    setNotifySaving(true)
    const { error } = await supabase.from('shop_settings').update({ notify_settings: notifySettings }).eq('id', 'main')
    setNotifySaving(false)
    if (!error) showToast('✅ Benachrichtigungs-Einstellungen gespeichert!')
    else showToast('❌ Fehler: ' + error.message)
    setPaymentSaving(false)
  }

  const handleSaveFeatures = async () => {
    setFeaturesSaving(true)
    for (const def of FEATURE_DEFINITIONS) {
      if (!def.comingSoon) {
        await supabase.from('feature_toggles').upsert({
          id: def.id, name: def.label, description: def.description, enabled: features[def.id] ?? false
        }, { onConflict: 'id' })
      }
    }
    showToast('✅ Features gespeichert!')
    setFeaturesSaving(false)
  }

  const toggleManualClose = async () => {
    const newValue = !settings.manual_close
    const { error } = await supabase.from('shop_settings').update({ manual_close: newValue }).eq('id', 'main')
    if (!error) setSettings({ ...settings, manual_close: newValue })
  }

  // ── Öffnungszeiten: neues Format mit delivery/pickup ──────────────────────
  // Liest einen Tag und migriert altes Format on-the-fly
  const getDay = (key: string) => {
    const h = settings.opening_hours[key]
    if (!h) return DEFAULT_DAY
    // Altes Format: { open, close, closed }
    if (h.open !== undefined && !h.delivery) {
      return {
        delivery: { closed: h.closed ?? false, open: h.open, close: h.close },
        pickup:   { closed: h.closed ?? false, open: h.open, close: h.close },
      }
    }
    return {
      delivery: { ...DEFAULT_DAY.delivery, ...h.delivery },
      pickup:   { ...DEFAULT_DAY.pickup,   ...h.pickup   },
    }
  }

  const updateDayType = (day: string, type: 'delivery' | 'pickup', field: string, value: any) => {
    const current = getDay(day)
    setSettings({
      ...settings,
      opening_hours: {
        ...settings.opening_hours,
        [day]: { ...current, [type]: { ...current[type], [field]: value } }
      }
    })
  }

  // ── Kalender ──────────────────────────────────────────────────────────────
  const handleSubmitCalendar = async (e: any) => {
    e.preventDefault()
    const payload = {
      date:  formData.date,
      label: formData.label || null,
      notes: formData.notes || null,
      // Legacy-Felder für Rückwärtskompatibilität
      is_closed:    formData.delivery_closed && formData.pickup_closed,
      custom_open:  formData.delivery_closed ? null : formData.delivery_open,
      custom_close: formData.delivery_closed ? null : formData.delivery_close,
      // Neue getrennte Felder
      delivery_closed: formData.delivery_closed,
      delivery_open:   formData.delivery_closed ? null : formData.delivery_open,
      delivery_close:  formData.delivery_closed ? null : formData.delivery_close,
      pickup_closed:   formData.pickup_closed,
      pickup_open:     formData.pickup_closed   ? null : formData.pickup_open,
      pickup_close:    formData.pickup_closed   ? null : formData.pickup_close,
    }
    if (editingId) {
      const { error } = await supabase.from('special_hours').update(payload).eq('id', editingId)
      if (!error) { showToast('✅ Aktualisiert!'); resetForm(); loadSpecialHours() }
      else showToast('❌ Fehler: ' + error.message)
    } else {
      const { error } = await supabase.from('special_hours').insert([payload])
      if (!error) { showToast('✅ Hinzugefügt!'); resetForm(); loadSpecialHours() }
      else showToast('❌ Fehler: ' + error.message)
    }
  }

  const handleEdit = (entry: any) => {
    setEditingId(entry.id)
    setFormData({
      date:             entry.date,
      label:            entry.label || '',
      notes:            entry.notes || '',
      delivery_closed:  entry.delivery_closed ?? entry.is_closed ?? false,
      delivery_open:    entry.delivery_open   || entry.custom_open  || '14:00',
      delivery_close:   entry.delivery_close  || entry.custom_close || '18:30',
      pickup_closed:    entry.pickup_closed   ?? entry.is_closed ?? false,
      pickup_open:      entry.pickup_open     || entry.custom_open  || '10:00',
      pickup_close:     entry.pickup_close    || entry.custom_close || '18:30',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    const { error } = await supabase.from('special_hours').delete().eq('id', id)
    if (!error) loadSpecialHours()
  }

  const resetForm = () => {
    setFormData({ date: '', label: '', notes: '', delivery_closed: false, delivery_open: '14:00', delivery_close: '18:30', pickup_closed: false, pickup_open: '10:00', pickup_close: '18:30' })
    setEditingId(null); setShowModal(false)
  }

  const groupByMonth = (entries: any[]) => {
    const grouped: any = {}
    entries.forEach(entry => {
      const monthKey = new Date(entry.date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })
      if (!grouped[monthKey]) grouped[monthKey] = []
      grouped[monthKey].push(entry)
    })
    return grouped
  }

  const updateEmailSetting = (typeKey: string, field: string, value: any) =>
    setEmailSettings((prev: any) => ({ ...prev, [typeKey]: { ...prev[typeKey], [field]: value } }))
  const updateSocial = (id: string, field: string, value: any) =>
    setSocialLinks((prev: any) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  const updatePayment = (provider: string, field: string, value: any) =>
    setPaymentKeys((prev: any) => ({ ...prev, [provider]: { ...prev[provider], [field]: value } }))
  const setM = (field: string, value: any) => setMarketing((prev: any) => ({ ...prev, [field]: value }))

  const sendTestEmail = async (typeKey: string) => {
    if (!testEmailAddress.trim()) { showToast('❌ Bitte Test-Email-Adresse eingeben'); return }
    setEmailTestSending(typeKey)
    try {
      const testOrder = {
        id: 'test-123456', order_number: 'TEST', customer_name: 'Test Kunde',
        customer_email: testEmailAddress,
        delivery_address: 'Musterstraße 1, 40764 Langenfeld', total: 18.50,
        items: [{ quantity: 2, name: 'Gemischtes Eis', price: 6.50, selectedFlavors: ['Schokolade', 'Vanille'] }],
        payment_method: 'stripe'
      }
      const response = await fetch('/api/emails/send-order-notification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeKey, order: testOrder, recipientEmail: testEmailAddress })
      })
      const result = await response.json()
      if (result.success) showToast('✅ Test-Email gesendet an ' + testEmailAddress)
      else if (result.skipped) showToast('⚠️ Email ist deaktiviert')
      else showToast('❌ Fehler: ' + result.error)
    } catch (e) { showToast('❌ Fehler beim Senden') }
    setEmailTestSending(null)
  }

  const stripe            = paymentKeys.stripe || DEFAULT_PAYMENT_KEYS.stripe
  const paypal            = paymentKeys.paypal || DEFAULT_PAYMENT_KEYS.paypal
  const wero              = paymentKeys.wero   || DEFAULT_PAYMENT_KEYS.wero
  const isLive            = stripe.mode === 'live'
  const activeSocialCount  = Object.values(socialLinks).filter((s: any) => s.enabled && s.url).length
  const activeFeatureCount = FEATURE_DEFINITIONS.filter(f => !f.comingSoon && features[f.id]).length

  const TABS = [
    { key: 'general',   label: '⚙️ Allgemein'      },
    { key: 'hours',     label: '🕐 Öffnungszeiten'  },
    { key: 'calendar',  label: '📅 Kalender'        },
    { key: 'marketing', label: '🎁 Marketing'       },
    { key: 'payment',   label: '💳 Zahlungsanbieter'},
    { key: 'emails',    label: '📧 Emails'          },
    { key: 'social',    label: `📱 Social Media${activeSocialCount > 0 ? ` (${activeSocialCount})` : ''}` },
    { key: 'features',  label: `⚡ Features${activeFeatureCount > 0 ? ` (${activeFeatureCount})` : ''}` },
    { key: 'notify',    label: '📲 Benachrichtigungen' },
  ]

  if (loading) return <AdminLayout><div className="p-8 text-gray-400">Lädt...</div></AdminLayout>

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl font-semibold text-sm">
          {toast}
        </div>
      )}

      <div className="p-8">
        <div className="max-w-5xl">
          <h1 className="text-3xl font-bold mb-8">Shop-Einstellungen</h1>

          <div className="flex gap-1 mb-6 border-b border-gray-200 flex-wrap">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 font-semibold text-sm transition border-b-2 ${activeTab === tab.key ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── ALLGEMEIN ── */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Shop-Status */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-xl mb-1">Shop-Status</h2>
                    <p className="text-sm text-gray-500">{settings.manual_close ? '🔴 Manuell geschlossen' : '🟢 Geöffnet nach Öffnungszeiten'}</p>
                  </div>
                  <button onClick={toggleManualClose}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition ${settings.manual_close ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                    {settings.manual_close ? <><Power size={20} /> Shop öffnen</> : <><PowerOff size={20} /> Shop schließen</>}
                  </button>
                </div>
                {settings.manual_close && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold mb-2">Nachricht für Kunden</label>
                    <input type="text" value={settings.close_message} onChange={e => setSettings({ ...settings, close_message: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      placeholder="z.B. Betriebsferien bis 15.03." />
                  </div>
                )}
              </div>

              {/* Preise */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><DollarSign size={22} /> Preise & Gebühren</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Liefergebühr (€)</label>
                    <input type="number" step="0.50" value={settings.delivery_fee}
                      onChange={e => setSettings({ ...settings, delivery_fee: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Mindestbestellwert Lieferung (€)</label>
                    <input type="number" step="1.00" value={settings.min_order_value}
                      onChange={e => setSettings({ ...settings, min_order_value: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                    <p className="text-xs text-gray-400 mt-1.5">Bei Abholung gilt kein Mindestbestellwert.</p>
                  </div>
                </div>
              </div>

              {/* Lieferdauer */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Clock size={22} /> Lieferdauer</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Von (Minuten)</label>
                    <input type="number" value={settings.delivery_duration_min}
                      onChange={e => setSettings({ ...settings, delivery_duration_min: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bis (Minuten)</label>
                    <input type="number" value={settings.delivery_duration_max}
                      onChange={e => setSettings({ ...settings, delivery_duration_max: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-3">Kunden sehen: „Lieferung in ca. {settings.delivery_duration_min}–{settings.delivery_duration_max} Minuten"</p>
              </div>

              {/* Vorbestellung */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Clock size={22} /> Vorbestellung</h2>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-800">Vorbestellung erlauben</p>
                    <p className="text-sm text-gray-400 mt-0.5">Bestellungen vor der Öffnungszeit erlauben</p>
                  </div>
                  <button type="button" onClick={() => setSettings({ ...settings, preorder_enabled: !settings.preorder_enabled })}
                    className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors ml-4 ${settings.preorder_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.preorder_enabled ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
                {settings.preorder_enabled && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Vorbestellungen möglich ab</label>
                      <div className="flex items-center gap-3">
                        <input type="number" min={0} max={23} value={settings.preorder_start_hour}
                          onChange={e => setSettings({ ...settings, preorder_start_hour: parseInt(e.target.value) })}
                          className="w-24 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none font-bold text-center text-lg" />
                        <span className="text-gray-500 font-semibold">:00 Uhr</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Hinweis-Text im Checkout</label>
                      <input type="text" value={settings.preorder_hint}
                        onChange={e => setSettings({ ...settings, preorder_hint: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm"
                        placeholder="Du kannst jetzt vorbestellen – Lieferung startet ab 14:00 Uhr." />
                    </div>
                  </div>
                )}
              </div>

              {/* Abholung */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Store size={22} /> Abholung</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Abholung anbieten</p>
                    <p className="text-sm text-gray-400 mt-0.5">Kunden können zwischen Lieferung und Selbstabholung wählen</p>
                    <p className="text-xs text-gray-500 mt-1.5">📍 Konrad-Adenauer-Platz 2, 40764 Langenfeld</p>
                    <p className="text-xs text-green-600 mt-1 font-semibold">✓ Kein Mindestbestellwert · Keine Liefergebühr</p>
                  </div>
                  <button type="button" onClick={() => setSettings({ ...settings, pickup_enabled: !settings.pickup_enabled })}
                    className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors ml-4 ${settings.pickup_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.pickup_enabled ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>


              {/* Liefergebiete */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-1 flex items-center gap-2">🗺️ Liefergebiete</h2>
                <p className="text-sm text-gray-400 mb-4">Aktive PLZ-Gebiete werden im Checkout validiert</p>

                <div className="space-y-2 mb-4">
                  {deliveryZones.map(zone => (
                    <div key={zone.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${zone.enabled ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                      <div className="flex-1">
                        <span className="font-bold text-gray-800">{zone.zip}</span>
                        <span className="text-gray-500 ml-2">{zone.city}</span>
                      </div>
                      <button type="button"
                        onClick={() => setDeliveryZones(deliveryZones.map(z => z.id === zone.id ? { ...z, enabled: !z.enabled } : z))}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${zone.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${zone.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      {deliveryZones.length > 1 && (
                        <button type="button"
                          onClick={() => setDeliveryZones(deliveryZones.filter(z => z.id !== zone.id))}
                          className="p-1.5 hover:bg-red-100 rounded-lg text-gray-300 hover:text-red-500 transition">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input type="text" value={newZip} onChange={e => setNewZip(e.target.value)} maxLength={5}
                    placeholder="PLZ" className="w-28 px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm font-mono font-bold" />
                  <input type="text" value={newCity} onChange={e => setNewCity(e.target.value)}
                    placeholder="Stadt" className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm" />
                  <button type="button"
                    onClick={() => {
                      if (!newZip.trim() || !newCity.trim()) return
                      if (deliveryZones.find(z => z.zip === newZip.trim())) { alert('PLZ bereits vorhanden'); return }
                      setDeliveryZones([...deliveryZones, { id: Date.now().toString(), zip: newZip.trim(), city: newCity.trim(), enabled: true }])
                      setNewZip(''); setNewCity('')
                    }}
                    className="px-4 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition flex items-center gap-1.5 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    Hinzufügen
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">💡 Gespeichert wird mit dem großen "Einstellungen speichern" Button</p>
              </div>

              {/* Upselling */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold text-xl flex items-center gap-2">✨ Upselling</h2>
                  <button type="button" onClick={() => setUpsellEnabled(!upsellEnabled)}
                    className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors ${upsellEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${upsellEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mb-5">Dezente "Dazu noch?" Sektion im Warenkorb – ein Klick genügt zum Hinzufügen</p>

                {upsellEnabled && (
                  <div className="space-y-5">

                    {/* Tagesspecial */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-amber-800">⭐ Tagesspecial</span>
                        <button type="button" onClick={() => setDailySpecial({ ...dailySpecial, enabled: !dailySpecial.enabled })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${dailySpecial.enabled ? 'bg-amber-400' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dailySpecial.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      {dailySpecial.enabled && (
                        <div className="space-y-2">
                          <input type="text" value={dailySpecial.name} onChange={e => setDailySpecial({ ...dailySpecial, name: e.target.value })}
                            placeholder="z.B. Mango-Sorbet" className="w-full px-3 py-2 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm" />
                          <input type="text" value={dailySpecial.description} onChange={e => setDailySpecial({ ...dailySpecial, description: e.target.value })}
                            placeholder="Kurze Beschreibung (optional)" className="w-full px-3 py-2 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm" />
                          <div className="flex items-center gap-2">
                            <input type="number" step="0.10" value={dailySpecial.price} onChange={e => setDailySpecial({ ...dailySpecial, price: parseFloat(e.target.value) })}
                              className="w-28 px-3 py-2 border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none text-sm font-bold" />
                            <span className="text-sm text-gray-500">€</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toppings */}
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">🍫 Toppings</p>
                      <div className="space-y-2 mb-3">
                        {upsellToppings.map(t => (
                          <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${t.enabled ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-white opacity-50'}`}>
                            <div className="flex-1">
                              <span className="font-medium text-gray-800 text-sm">{t.name}</span>
                              <span className="text-gray-400 text-sm ml-2">+{t.price.toFixed(2)} €</span>
                            </div>
                            <button type="button" onClick={() => setUpsellToppings(upsellToppings.map(x => x.id === t.id ? { ...x, enabled: !x.enabled } : x))}
                              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${t.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${t.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                            <button type="button" onClick={() => setUpsellToppings(upsellToppings.filter(x => x.id !== t.id))}
                              className="p-1.5 hover:bg-red-100 rounded-lg text-gray-300 hover:text-red-500 transition">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={newToppingName} onChange={e => setNewToppingName(e.target.value)}
                          placeholder="Topping Name" className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm" />
                        <input type="number" step="0.10" value={newToppingPrice} onChange={e => setNewToppingPrice(e.target.value)}
                          className="w-24 px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm font-mono" />
                        <span className="self-center text-gray-500 text-sm">€</span>
                        <button type="button"
                          onClick={() => {
                            if (!newToppingName.trim()) return
                            setUpsellToppings([...upsellToppings, { id: Date.now().toString(), name: newToppingName.trim(), price: parseFloat(newToppingPrice) || 0.50, enabled: true }])
                            setNewToppingName(''); setNewToppingPrice('0.50')
                          }}
                          className="px-4 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition flex items-center gap-1.5 flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                          Hinzufügen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={22} />{saving ? 'Speichert...' : 'Einstellungen speichern'}
              </button>
            </div>
          )}

          {/* ── ÖFFNUNGSZEITEN ── */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-2">Reguläre Öffnungszeiten</h2>
                <p className="text-sm text-gray-400 mb-5">Getrennte Zeiten für 🚗 Lieferung und 🏪 Abholung</p>

                {/* Legende */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-bold">
                  <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-center">🚗 Lieferung</div>
                  <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-center">🏪 Abholung</div>
                </div>

                <div className="space-y-1">
                  {Object.entries(DAYS).map(([key, label]) => {
                    const day = getDay(key)
                    return (
                      <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* Tagesname */}
                        <div className="bg-gray-50 px-4 py-2">
                          <span className="font-bold text-gray-700">{label}</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 gap-3">
                          {/* Lieferung */}
                          <div className={`rounded-xl p-3 space-y-2 transition-colors ${day.delivery.closed ? 'bg-gray-100' : 'bg-blue-50'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${day.delivery.closed ? 'text-gray-400' : 'text-blue-700'}`}>🚗 Lieferung</span>
                              <button type="button" onClick={() => updateDayType(key, 'delivery', 'closed', !day.delivery.closed)}
                                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${!day.delivery.closed ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${!day.delivery.closed ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                            </div>
                            {!day.delivery.closed ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <TimeInput value={day.delivery.open}  onChange={v => updateDayType(key, 'delivery', 'open',  v)} />
                                <span className="text-gray-400 text-xs">–</span>
                                <TimeInput value={day.delivery.close} onChange={v => updateDayType(key, 'delivery', 'close', v)} />
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-semibold">Geschlossen</span>
                            )}
                          </div>

                          {/* Abholung */}
                          <div className={`rounded-xl p-3 space-y-2 transition-colors ${day.pickup.closed ? 'bg-gray-100' : 'bg-purple-50'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${day.pickup.closed ? 'text-gray-400' : 'text-purple-700'}`}>🏪 Abholung</span>
                              <button type="button" onClick={() => updateDayType(key, 'pickup', 'closed', !day.pickup.closed)}
                                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${!day.pickup.closed ? 'bg-purple-500' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${!day.pickup.closed ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                            </div>
                            {!day.pickup.closed ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <TimeInput value={day.pickup.open}  onChange={v => updateDayType(key, 'pickup', 'open',  v)} />
                                <span className="text-gray-400 text-xs">–</span>
                                <TimeInput value={day.pickup.close} onChange={v => updateDayType(key, 'pickup', 'close', v)} />
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-semibold">Geschlossen</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={22} />{saving ? 'Speichert...' : 'Öffnungszeiten speichern'}
              </button>
            </div>
          )}

          {/* ── KALENDER ── */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Sonderöffnungszeiten & Feiertage</h2>
                  <p className="text-gray-500 text-sm mt-1">Getrennte Zeiten für Lieferung und Abholung</p>
                </div>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition font-semibold">
                  <Plus size={18} /> Neuer Eintrag
                </button>
              </div>

              {specialHours.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-400">Noch keine Einträge</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupByMonth(specialHours)).map(([month, entries]: any) => (
                    <div key={month}>
                      <h3 className="text-base font-bold mb-3 text-gray-600">{month}</h3>
                      <div className="space-y-2">
                        {entries.map((entry: any) => (
                          <div key={entry.id} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-bold text-sm">
                                    {new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </span>
                                  {entry.label && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{entry.label}</span>}
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                  {/* Lieferung */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-400">🚗</span>
                                    {(entry.delivery_closed ?? entry.is_closed)
                                      ? <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">Geschlossen</span>
                                      : <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">{entry.delivery_open || entry.custom_open} – {entry.delivery_close || entry.custom_close} Uhr</span>
                                    }
                                  </div>
                                  {/* Abholung */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-400">🏪</span>
                                    {(entry.pickup_closed ?? entry.is_closed)
                                      ? <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">Geschlossen</span>
                                      : <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">{entry.pickup_open || entry.custom_open} – {entry.pickup_close || entry.custom_close} Uhr</span>
                                    }
                                  </div>
                                </div>
                                {entry.notes && <p className="text-xs text-gray-400 mt-1.5">💬 {entry.notes}</p>}
                              </div>
                              <div className="flex gap-1 ml-3">
                                <button onClick={() => handleEdit(entry)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(entry.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MARKETING ── */}
          {activeTab === 'marketing' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><Gift size={24} /> Marketing & Shop-Optionen</h2>
                <p className="text-gray-500 text-sm mt-1">Alle Optionen sind unabhängig ein- und ausschaltbar.</p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <SectionToggle
                    enabled={marketing.welcome_banner_enabled}
                    onToggle={() => setM('welcome_banner_enabled', !marketing.welcome_banner_enabled)}
                    icon={<Sparkles size={22} />}
                    label="Willkommens-Banner"
                    description="Popup mit Rabattcode beim ersten Besuch der Seite"
                    color="gold"
                  />
                </div>
                {marketing.welcome_banner_enabled && (
                  <div className="px-6 py-5 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Gutscheincode</label>
                        <input type="text" value={marketing.welcome_banner_code}
                          onChange={e => setM('welcome_banner_code', e.target.value.toUpperCase())}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none font-mono font-bold tracking-widest uppercase"
                          placeholder="WILLKOMMEN10" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Rabatt in %</label>
                        <div className="relative">
                          <input type="number" min={1} max={100} value={marketing.welcome_banner_discount}
                            onChange={e => setM('welcome_banner_discount', parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Banner-Text</label>
                      <textarea value={marketing.welcome_banner_text} onChange={e => setM('welcome_banner_text', e.target.value)}
                        rows={3} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm resize-none" />
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-5 text-center border border-[#c9a66b]/20">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Vorschau</p>
                      <div className="inline-flex items-center gap-2 bg-[#c9a66b] text-black px-3 py-1 text-xs font-bold mb-3 rounded-sm">{marketing.welcome_banner_discount}% Rabatt</div>
                      <p className="text-sm text-gray-400 mb-3 max-w-xs mx-auto">{marketing.welcome_banner_text}</p>
                      <p className="font-mono font-bold text-[#c9a66b] tracking-widest text-xl">{marketing.welcome_banner_code}</p>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={handleSaveMarketing} disabled={marketingSaving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={22} />{marketingSaving ? 'Speichert...' : 'Marketing speichern'}
              </button>
            </div>
          )}

          {/* ── ZAHLUNGSANBIETER ── */}
          {activeTab === 'payment' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><CreditCard size={24} /> Zahlungsanbieter</h2>
                <p className="text-gray-500 text-sm mt-1">Klicke auf einen Anbieter um die Zugangsdaten einzugeben.</p>
              </div>
              <ProviderCard icon="💳" title="Stripe" badge={isLive ? '🟢 Live-Modus' : '🟡 Test-Modus'}
                badgeColor={isLive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                subtitle="Kreditkarte, SEPA, Apple Pay, Google Pay"
                docsUrl="https://dashboard.stripe.com/apikeys">
                <div className="flex gap-2 mb-5">
                  {['test', 'live'].map(m => (
                    <button key={m} onClick={() => updatePayment('stripe', 'mode', m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border-2 ${stripe.mode === m ? (m === 'live' ? 'bg-green-600 text-white border-green-600' : 'bg-yellow-500 text-white border-yellow-500') : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                      {m === 'test' ? '🟡 Test-Modus' : '🟢 Live-Modus'}
                    </button>
                  ))}
                </div>
                {stripe.mode === 'test' ? (
                  <>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4 text-xs text-yellow-700">
                      ⚠️ <strong>Test-Modus:</strong> Keine echten Zahlungen. Testkarte: <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code>
                    </div>
                    <KeyField label="Test Publishable Key" value={stripe.test_public} onChange={v => updatePayment('stripe', 'test_public', v)} placeholder="pk_test_..." help="Beginnt mit pk_test_" />
                    <KeyField label="Test Secret Key"      value={stripe.test_secret} onChange={v => updatePayment('stripe', 'test_secret', v)} placeholder="sk_test_..." isSecret help="Beginnt mit sk_test_" />
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 text-xs text-green-700">✅ <strong>Live-Modus:</strong> Echte Zahlungen aktiv.</div>
                    <KeyField label="Live Publishable Key" value={stripe.live_public} onChange={v => updatePayment('stripe', 'live_public', v)} placeholder="pk_live_..." help="Beginnt mit pk_live_" />
                    <KeyField label="Live Secret Key"      value={stripe.live_secret} onChange={v => updatePayment('stripe', 'live_secret', v)} placeholder="sk_live_..." isSecret help="Beginnt mit sk_live_" />
                  </>
                )}
                <KeyField label="Webhook Secret" value={stripe.webhook_secret} onChange={v => updatePayment('stripe', 'webhook_secret', v)} placeholder="whsec_..." isSecret help="Stripe Dashboard → Entwickler → Webhooks → Signatur-Geheimnis" />
              </ProviderCard>
              <ProviderCard icon="🅿️" title="PayPal" badge="Code bereit" badgeColor="bg-blue-100 text-blue-700"
                subtitle="PayPal Zahlungen" docsUrl="https://developer.paypal.com/dashboard/applications">
                <div className="flex gap-2 mb-5">
                  {['sandbox', 'live'].map(m => (
                    <button key={m} onClick={() => updatePayment('paypal', 'mode', m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border-2 ${paypal.mode === m ? (m === 'live' ? 'bg-blue-600 text-white border-blue-600' : 'bg-yellow-500 text-white border-yellow-500') : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                      {m === 'sandbox' ? '🟡 Sandbox (Test)' : '🔵 Live'}
                    </button>
                  ))}
                </div>
                {paypal.mode === 'sandbox' ? (
                  <>
                    <KeyField label="Sandbox Client ID"     value={paypal.sandbox_client_id}     onChange={v => updatePayment('paypal', 'sandbox_client_id', v)}     placeholder="AXxx..." />
                    <KeyField label="Sandbox Client Secret" value={paypal.sandbox_client_secret} onChange={v => updatePayment('paypal', 'sandbox_client_secret', v)} placeholder="EXxx..." isSecret />
                  </>
                ) : (
                  <>
                    <KeyField label="Live Client ID"     value={paypal.live_client_id}     onChange={v => updatePayment('paypal', 'live_client_id', v)}     placeholder="AXxx..." />
                    <KeyField label="Live Client Secret" value={paypal.live_client_secret} onChange={v => updatePayment('paypal', 'live_client_secret', v)} placeholder="EXxx..." isSecret />
                  </>
                )}
              </ProviderCard>
              <ProviderCard icon="🇩🇪" title="Wero" isComingSoon subtitle="Deutsche P2P-Zahlungsmethode">
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">{wero.note}</div>
              </ProviderCard>
              <button onClick={handleSavePayment} disabled={paymentSaving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={22} />{paymentSaving ? 'Speichert...' : 'Zahlungs-Keys speichern'}
              </button>
            </div>
          )}

          {/* ── EMAILS ── */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Email-Benachrichtigungen</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Variablen: <code className="bg-gray-100 px-1 rounded text-xs">#{'{orderNumber}'}</code> <code className="bg-gray-100 px-1 rounded text-xs">#{'{customerName}'}</code> <code className="bg-gray-100 px-1 rounded text-xs">#{'{total}'}</code>
                </p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <label className="block text-sm font-bold text-blue-800 mb-2">📧 Test-Email senden an:</label>
                <input type="email" value={testEmailAddress} onChange={e => setTestEmailAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none bg-white" placeholder="deine@email.de" />
              </div>
              {EMAIL_TYPES.map((emailType) => {
                const typeSetting = emailSettings[emailType.key] || {}
                const isEnabled = emailType.alwaysOn || typeSetting.enabled !== false
                return (
                  <div key={emailType.key} className={`bg-white rounded-xl border-2 p-6 ${isEnabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{emailType.label}</h3>
                          {emailType.alwaysOn && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Immer aktiv</span>}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">{emailType.description}</p>
                      </div>
                      {!emailType.alwaysOn && (
                        <button onClick={() => updateEmailSetting(emailType.key, 'enabled', !isEnabled)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          {isEnabled ? 'Aktiv' : 'Aus'}
                        </button>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Betreff</label>
                      <input type="text" value={typeSetting.subject || ''} onChange={e => updateEmailSetting(emailType.key, 'subject', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Zusatztext <span className="text-gray-400 font-normal">(gelber Hinweisblock)</span></label>
                      <textarea value={typeSetting.custom_text || ''} onChange={e => updateEmailSetting(emailType.key, 'custom_text', e.target.value)}
                        rows={2} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm" />
                    </div>
                    <button onClick={() => sendTestEmail(emailType.key)} disabled={emailTestSending === emailType.key}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:border-black transition disabled:opacity-50">
                      <Mail size={15} />{emailTestSending === emailType.key ? 'Sendet...' : `Test senden → ${testEmailAddress}`}
                    </button>
                  </div>
                )
              })}
              <button onClick={handleSaveEmails} disabled={emailSaving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={22} />{emailSaving ? 'Speichert...' : 'Email-Einstellungen speichern'}
              </button>
            </div>
          )}

          {/* ── SOCIAL MEDIA ── */}
          {activeTab === 'social' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><Share2 size={24} /> Social Media</h2>
                <p className="text-gray-500 text-sm mt-1">Links eingeben und Schalter aktivieren – erscheinen automatisch im Footer.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {SOCIAL_PLATFORMS.map(platform => {
                    const data = socialLinks[platform.id] || { url: '', enabled: false }
                    const isActive = data.enabled && data.url?.trim() !== ''
                    return (
                      <div key={platform.id} className={`px-6 py-4 transition ${!data.enabled ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 w-36 flex-shrink-0">
                            <span className="text-2xl">{platform.icon}</span>
                            <div>
                              <div className="font-semibold text-sm">{platform.label}</div>
                              {isActive && <div className="text-xs text-green-600 font-semibold">✓ Aktiv</div>}
                            </div>
                          </div>
                          <input type="url" value={data.url || ''} onChange={e => updateSocial(platform.id, 'url', e.target.value)}
                            placeholder={platform.placeholder}
                            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm" />
                          <button onClick={() => updateSocial(platform.id, 'enabled', !data.enabled)}
                            className="flex-shrink-0 transition-all hover:scale-110" style={{ color: data.enabled ? '#22c55e' : '#d1d5db' }}>
                            {data.enabled ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <button onClick={handleSaveSocial} disabled={socialSaving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={22} />{socialSaving ? 'Speichert...' : 'Social Media speichern'}
              </button>
            </div>
          )}

          {/* ── FEATURES ── */}
          {activeTab === 'features' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><Zap size={24} /> Features</h2>
                <p className="text-gray-500 text-sm mt-1">Optionale Funktionen aktivieren oder deaktivieren.</p>
              </div>
              <div className="space-y-3">
                {FEATURE_DEFINITIONS.map(feature => {
                  const isEnabled = features[feature.id] ?? false
                  return (
                    <div key={feature.id}
                      className={`bg-white rounded-2xl border-2 p-5 transition ${feature.comingSoon ? 'opacity-50 border-gray-100' : isEnabled ? 'border-green-200' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <span className="text-3xl mt-0.5">{feature.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">{feature.label}</span>
                              {feature.comingSoon && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Bald</span>}
                              {!feature.comingSoon && isEnabled && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✅ Aktiv</span>}
                            </div>
                            <p className="text-sm text-gray-400">{feature.description}</p>
                            {feature.adminLink && isEnabled && (
                              <a href={feature.adminLink} className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                <ExternalLink size={12} /> {feature.adminLabel}
                              </a>
                            )}
                            {feature.id === 'whatsapp_notify' && isEnabled && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                                <MessageCircle size={12} />
                                <span>Button erscheint im Kanban-Bestelldetail · Kostenlos via wa.me</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!feature.comingSoon && (
                          <button onClick={() => setFeatures(prev => ({ ...prev, [feature.id]: !isEnabled }))}
                            className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={handleSaveFeatures} disabled={featuresSaving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={22} />{featuresSaving ? 'Speichert...' : 'Features speichern'}
              </button>
            </div>
          )}

        {activeTab === 'notify' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">📲 Benachrichtigungen</h2>
              <p className="text-gray-500 text-sm mt-1">Telegram und WhatsApp Zugangsdaten – hier zentral verwalten.</p>
            </div>

            {/* Telegram */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">✈️</span>
                <div>
                  <h3 className="font-bold text-gray-900">Telegram Bot</h3>
                  <p className="text-xs text-gray-400">Bot Token und Chat-ID für Bestellbenachrichtigungen</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bot Token</label>
                  <input
                    type="text"
                    value={notifySettings.telegram_bot_token || ''}
                    onChange={e => setNotifySettings({ ...notifySettings, telegram_bot_token: e.target.value })}
                    placeholder="1234567890:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Erstellen via @BotFather in Telegram</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Chat-ID</label>
                  <input
                    type="text"
                    value={notifySettings.telegram_chat_id || ''}
                    onChange={e => setNotifySettings({ ...notifySettings, telegram_chat_id: e.target.value })}
                    placeholder="123456789"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Deine persönliche ID via @userinfobot</p>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">💬</span>
                <div>
                  <h3 className="font-bold text-gray-900">WhatsApp</h3>
                  <p className="text-xs text-gray-400">Telefonnummer für WhatsApp-Links im Kanban</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Telefonnummer (international, ohne +)</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 bg-gray-100 border-2 border-gray-200 rounded-xl text-sm font-mono text-gray-500">+</span>
                  <input
                    type="text"
                    value={notifySettings.whatsapp_number || ''}
                    onChange={e => setNotifySettings({ ...notifySettings, whatsapp_number: e.target.value.replace(/\D/g, '') })}
                    placeholder="4921731622780"
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Vorschau: <span className="font-mono text-gray-600">https://wa.me/{notifySettings.whatsapp_number || '4921731622780'}</span>
                </p>
              </div>
            </div>

            <button onClick={saveNotifySettings} disabled={notifySaving}
              className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={22} />{notifySaving ? 'Speichert...' : 'Einstellungen speichern'}
            </button>
          </div>
        )}

        </div>
      </div>

      {/* ── Kalender Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editingId ? 'Bearbeiten' : 'Sonderöffnungszeiten'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full"><X size={22} /></button>
            </div>

            <form onSubmit={handleSubmitCalendar} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Datum *</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Bezeichnung</label>
                  <input type="text" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })}
                    placeholder="z.B. Weihnachten"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                </div>
              </div>

              {/* Lieferung */}
              <div className={`rounded-xl p-4 space-y-3 transition-colors ${formData.delivery_closed ? 'bg-gray-100' : 'bg-blue-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${formData.delivery_closed ? 'text-gray-400' : 'text-blue-800'}`}>🚗 Lieferung</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formData.delivery_closed ? 'Geschlossen' : 'Geöffnet'}</span>
                    <button type="button" onClick={() => setFormData({ ...formData, delivery_closed: !formData.delivery_closed })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${!formData.delivery_closed ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${!formData.delivery_closed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                {!formData.delivery_closed && (
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Von</label>
                      <input type="time" value={formData.delivery_open} onChange={e => setFormData({ ...formData, delivery_open: e.target.value })}
                        className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none" />
                    </div>
                    <span className="text-gray-400 mt-4">–</span>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Bis</label>
                      <input type="time" value={formData.delivery_close} onChange={e => setFormData({ ...formData, delivery_close: e.target.value })}
                        className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* Abholung */}
              <div className={`rounded-xl p-4 space-y-3 transition-colors ${formData.pickup_closed ? 'bg-gray-100' : 'bg-purple-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${formData.pickup_closed ? 'text-gray-400' : 'text-purple-800'}`}>🏪 Abholung</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formData.pickup_closed ? 'Geschlossen' : 'Geöffnet'}</span>
                    <button type="button" onClick={() => setFormData({ ...formData, pickup_closed: !formData.pickup_closed })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${!formData.pickup_closed ? 'bg-purple-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${!formData.pickup_closed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                {!formData.pickup_closed && (
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Von</label>
                      <input type="time" value={formData.pickup_open} onChange={e => setFormData({ ...formData, pickup_open: e.target.value })}
                        className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none" />
                    </div>
                    <span className="text-gray-400 mt-4">–</span>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Bis</label>
                      <input type="time" value={formData.pickup_close} onChange={e => setFormData({ ...formData, pickup_close: e.target.value })}
                        className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Notizen</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50">Abbrechen</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900">
                  {editingId ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}