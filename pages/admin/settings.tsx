import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import {
  Clock, DollarSign, Save, PowerOff, Power, Calendar as CalendarIcon,
  Plus, Trash2, Edit2, X, Mail, ToggleLeft, ToggleRight, Share2,
  CreditCard, Eye, EyeOff, ExternalLink, CheckCircle, Zap,
  Gift, Sparkles, Store
} from 'lucide-react'

const DAYS = {
  monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch',
  thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag'
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

const FEATURE_DEFINITIONS = [
  { id: 'reviews',         icon: '⭐', label: 'Bewertungssystem',    description: 'Kunden können bestellte Produkte mit 1–5 Sternen bewerten.',         adminLink: '/admin/reviews', adminLabel: 'Bewertungen verwalten →', comingSoon: false },
  { id: 'payment_paypal',  icon: '🅿️', label: 'PayPal',              description: 'PayPal als Zahlungsmethode im Checkout anzeigen.',                   adminLink: null,             adminLabel: null,                      comingSoon: false },
  { id: 'payment_klarna',  icon: '🛒', label: 'Klarna (Ratenkauf)',   description: 'Klarna als Zahlungsmethode im Checkout anzeigen.',                   adminLink: null,             adminLabel: null,                      comingSoon: false },
  { id: 'loyalty',         icon: '🎁', label: 'Treueprogramm',        description: 'Jede 10. Bestellung gratis.',                                        adminLink: null,             adminLabel: null,                      comingSoon: true  },
  { id: 'favorites',       icon: '❤️', label: 'Favoriten',            description: 'Kunden können Produkte als Favoriten speichern.',                   adminLink: null,             adminLabel: null,                      comingSoon: true  },
]

const DEFAULT_MARKETING = {
  welcome_banner_enabled:  false,
  welcome_banner_code:     'WILLKOMMEN10',
  welcome_banner_discount: 10,
  welcome_banner_text:     'Als Dankeschön für deinen ersten Besuch schenken wir dir 10% auf deine erste Bestellung!',
  preorder_enabled:        false,
  preorder_start_hour:     10,
  preorder_hint:           'Du kannst jetzt vorbestellen – Lieferung startet ab 14:00 Uhr.',
  pickup_enabled:          false,
  pickup_hint:             'Abholung direkt bei uns: Solinger Str. 12, 40764 Langenfeld',
}

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

export default function SettingsPage() {
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast]         = useState('')

  const [settings, setSettings] = useState({
    delivery_fee: 3.0, min_order_value: 15.0,
    delivery_duration_min: 30, delivery_duration_max: 45,
    currently_open: true, manual_close: false,
    close_message: '', opening_hours: {} as any
  })

  const [marketing, setMarketing]             = useState<any>(DEFAULT_MARKETING)
  const [marketingSaving, setMarketingSaving] = useState(false)
  const [emailSettings, setEmailSettings]     = useState<any>(DEFAULT_EMAIL_SETTINGS)
  const [emailSaving, setEmailSaving]         = useState(false)
  const [emailTestSending, setEmailTestSending] = useState<string | null>(null)
  const [testEmailAddress, setTestEmailAddress] = useState('mahmutduran@hotmail.de')
  const [socialLinks, setSocialLinks]         = useState<any>(DEFAULT_SOCIAL)
  const [socialSaving, setSocialSaving]       = useState(false)
  const [paymentKeys, setPaymentKeys]         = useState<any>(DEFAULT_PAYMENT_KEYS)
  const [paymentSaving, setPaymentSaving]     = useState(false)
  const [specialHours, setSpecialHours]       = useState<any[]>([])
  const [showModal, setShowModal]             = useState(false)
  const [editingId, setEditingId]             = useState<any>(null)
  const [formData, setFormData] = useState({
    date: '', is_closed: true, custom_open: '14:00', custom_close: '22:00', label: '', notes: ''
  })
  const [features, setFeatures]             = useState<Record<string, boolean>>({})
  const [featuresSaving, setFeaturesSaving] = useState(false)

  useEffect(() => { loadSettings(); loadSpecialHours(); loadFeatures() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadSettings = async () => {
    setLoading(true)
    const { data } = await supabase.from('shop_settings').select('*').eq('id', 'main').single()
    if (data) {
      setSettings({
        delivery_fee: data.delivery_fee || 3.0,
        min_order_value: data.min_order_value || 15.0,
        delivery_duration_min: data.delivery_duration_min || 30,
        delivery_duration_max: data.delivery_duration_max || 45,
        currently_open: data.currently_open ?? true,
        manual_close: data.manual_close || false,
        close_message: data.close_message || '',
        opening_hours: data.opening_hours || {},
      })
      if (data.email_notifications) setEmailSettings({ ...DEFAULT_EMAIL_SETTINGS, ...data.email_notifications })
      if (data.social_links)        setSocialLinks({ ...DEFAULT_SOCIAL, ...data.social_links })
      if (data.payment_keys)        setPaymentKeys({ ...DEFAULT_PAYMENT_KEYS, ...data.payment_keys })
      setMarketing({
        welcome_banner_enabled:  data.welcome_banner_enabled  ?? false,
        welcome_banner_code:     data.welcome_banner_code     || 'WILLKOMMEN10',
        welcome_banner_discount: data.welcome_banner_discount || 10,
        welcome_banner_text:     data.welcome_banner_text     || DEFAULT_MARKETING.welcome_banner_text,
        preorder_enabled:        data.preorder_enabled        ?? false,
        preorder_start_hour:     data.preorder_start_hour     || 10,
        preorder_hint:           data.preorder_hint           || DEFAULT_MARKETING.preorder_hint,
        pickup_enabled:          data.pickup_enabled          ?? false,
        pickup_hint:             data.pickup_hint             || DEFAULT_MARKETING.pickup_hint,
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
    const { error } = await supabase.from('shop_settings').update(settings).eq('id', 'main')
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
      preorder_enabled:        marketing.preorder_enabled,
      preorder_start_hour:     marketing.preorder_start_hour,
      preorder_hint:           marketing.preorder_hint,
      pickup_enabled:          marketing.pickup_enabled,
      pickup_hint:             marketing.pickup_hint,
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

  const updateDayHours = (day: string, field: string, value: any) => {
    setSettings({ ...settings, opening_hours: { ...settings.opening_hours, [day]: { ...(settings.opening_hours as any)[day], [field]: value } } })
  }
  const updateEmailSetting = (typeKey: string, field: string, value: any) => {
    setEmailSettings((prev: any) => ({ ...prev, [typeKey]: { ...prev[typeKey], [field]: value } }))
  }
  const updateSocial = (id: string, field: string, value: any) => {
    setSocialLinks((prev: any) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }
  const updatePayment = (provider: string, field: string, value: any) => {
    setPaymentKeys((prev: any) => ({ ...prev, [provider]: { ...prev[provider], [field]: value } }))
  }
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

  const handleSubmitCalendar = async (e: any) => {
    e.preventDefault()
    if (editingId) {
      const { error } = await supabase.from('special_hours').update(formData).eq('id', editingId)
      if (!error) { showToast('✅ Aktualisiert!'); resetForm(); loadSpecialHours() }
    } else {
      const { error } = await supabase.from('special_hours').insert([formData])
      if (!error) { showToast('✅ Hinzugefügt!'); resetForm(); loadSpecialHours() }
      else showToast('❌ Fehler: ' + error.message)
    }
  }

  const handleEdit = (entry: any) => {
    setEditingId(entry.id)
    setFormData({ date: entry.date, is_closed: entry.is_closed, custom_open: entry.custom_open || '14:00', custom_close: entry.custom_close || '22:00', label: entry.label || '', notes: entry.notes || '' })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    const { error } = await supabase.from('special_hours').delete().eq('id', id)
    if (!error) loadSpecialHours()
  }

  const resetForm = () => {
    setFormData({ date: '', is_closed: true, custom_open: '14:00', custom_close: '22:00', label: '', notes: '' })
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

  const stripe             = paymentKeys.stripe  || DEFAULT_PAYMENT_KEYS.stripe
  const paypal             = paymentKeys.paypal  || DEFAULT_PAYMENT_KEYS.paypal
  const wero               = paymentKeys.wero    || DEFAULT_PAYMENT_KEYS.wero
  const isLive             = stripe.mode === 'live'
  const activeSocialCount  = Object.values(socialLinks).filter((s: any) => s.enabled && s.url).length
  const activeFeatureCount = FEATURE_DEFINITIONS.filter(f => !f.comingSoon && features[f.id]).length

  const TABS = [
    { key: 'general',   label: '⚙️ Allgemein'   },
    { key: 'hours',     label: '🕐 Öffnungszeiten' },
    { key: 'calendar',  label: '📅 Kalender'     },
    { key: 'marketing', label: '🎁 Marketing'    },
    { key: 'payment',   label: '💳 Zahlungsanbieter' },
    { key: 'emails',    label: '📧 Emails'        },
    { key: 'social',    label: `📱 Social Media${activeSocialCount > 0 ? ` (${activeSocialCount})` : ''}` },
    { key: 'features',  label: `⚡ Features${activeFeatureCount > 0 ? ` (${activeFeatureCount})` : ''}` },
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-xl mb-1">Shop-Status</h2>
                    <p className="text-sm text-gray-500">{settings.manual_close ? '🔴 Manuell geschlossen' : '🟢 Geöffnet'}</p>
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
                    <label className="block text-sm font-semibold mb-2">Mindestbestellwert (€)</label>
                    <input type="number" step="1.00" value={settings.min_order_value}
                      onChange={e => setSettings({ ...settings, min_order_value: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                  </div>
                </div>
              </div>
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
                <h2 className="font-bold text-xl mb-4">Reguläre Öffnungszeiten</h2>
                <div className="space-y-3">
                  {Object.entries(DAYS).map(([key, label]) => {
                    const day = settings.opening_hours[key] || { open: '14:00', close: '22:00', closed: false }
                    return (
                      <div key={key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl flex-wrap">
                        <div className="w-24 font-semibold">{label}</div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={day.closed} onChange={e => updateDayHours(key, 'closed', e.target.checked)} className="w-4 h-4" />
                          <span className="text-sm">Geschlossen</span>
                        </label>
                        {!day.closed && (
                          <>
                            <input type="time" value={day.open} onChange={e => updateDayHours(key, 'open', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg" />
                            <span className="text-gray-400">bis</span>
                            <input type="time" value={day.close} onChange={e => updateDayHours(key, 'close', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg" />
                          </>
                        )}
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
                  <p className="text-gray-500 text-sm mt-1">Spezielle Tage mit eigenen Zeiten oder Schließtage</p>
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
                          <div key={entry.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-sm">
                                  {new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                                {entry.label && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{entry.label}</span>}
                              </div>
                              {entry.is_closed
                                ? <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">🔴 Geschlossen</span>
                                : <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">🟢 {entry.custom_open} – {entry.custom_close} Uhr</span>}
                              {entry.notes && <p className="text-xs text-gray-400 mt-1.5">💬 {entry.notes}</p>}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleEdit(entry)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete(entry.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
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

              {/* WELCOME BANNER */}
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
                        <input
                          type="text"
                          value={marketing.welcome_banner_code}
                          onChange={e => setM('welcome_banner_code', e.target.value.toUpperCase())}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none font-mono font-bold tracking-widest uppercase"
                          placeholder="WILLKOMMEN10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Rabatt in %</label>
                        <div className="relative">
                          <input
                            type="number" min={1} max={100}
                            value={marketing.welcome_banner_discount}
                            onChange={e => setM('welcome_banner_discount', parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Banner-Text</label>
                      <textarea
                        value={marketing.welcome_banner_text}
                        onChange={e => setM('welcome_banner_text', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm resize-none"
                        placeholder="Als Dankeschön für deinen ersten Besuch..."
                      />
                    </div>
                    {/* Live Preview */}
                    <div className="bg-[#1a1a1a] rounded-xl p-5 text-center border border-[#c9a66b]/20">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Vorschau</p>
                      <div className="inline-flex items-center gap-2 bg-[#c9a66b] text-black px-3 py-1 text-xs font-bold mb-3 rounded-sm">
                        {marketing.welcome_banner_discount}% Rabatt
                      </div>
                      <p className="text-sm text-gray-400 mb-3 max-w-xs mx-auto">{marketing.welcome_banner_text}</p>
                      <p className="font-mono font-bold text-[#c9a66b] tracking-widest text-xl">{marketing.welcome_banner_code}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* VORBESTELLUNG */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <SectionToggle
                    enabled={marketing.preorder_enabled}
                    onToggle={() => setM('preorder_enabled', !marketing.preorder_enabled)}
                    icon={<Clock size={22} />}
                    label="Vorbestellung"
                    description="Bestellungen vor der Öffnungszeit erlauben – mit Hinweis auf Lieferstart"
                    color="blue"
                  />
                </div>
                {marketing.preorder_enabled && (
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Vorbestellungen möglich ab</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number" min={0} max={23}
                          value={marketing.preorder_start_hour}
                          onChange={e => setM('preorder_start_hour', parseInt(e.target.value))}
                          className="w-24 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none font-bold text-center text-lg"
                        />
                        <span className="text-gray-500 font-semibold">:00 Uhr</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Kunden können ab dieser Uhrzeit bestellen, auch wenn der Shop noch geschlossen ist.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Hinweis-Text im Checkout</label>
                      <input
                        type="text"
                        value={marketing.preorder_hint}
                        onChange={e => setM('preorder_hint', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm"
                        placeholder="Du kannst jetzt vorbestellen – Lieferung startet ab 14:00 Uhr."
                      />
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-base">ℹ️</span>
                      <p className="text-xs text-blue-700">Dieser blaue Hinweis erscheint im Checkout wenn der Kunde vor der Öffnungszeit bestellt.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ABHOLUNG */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <SectionToggle
                    enabled={marketing.pickup_enabled}
                    onToggle={() => setM('pickup_enabled', !marketing.pickup_enabled)}
                    icon={<Store size={22} />}
                    label="Abholung"
                    description="Kunden können zwischen Lieferung und Selbstabholung wählen"
                    color="purple"
                  />
                </div>
                {marketing.pickup_enabled && (
                  <div className="px-6 py-5">
                    <label className="block text-sm font-semibold mb-2">Abholhinweis für Kunden</label>
                    <input
                      type="text"
                      value={marketing.pickup_hint}
                      onChange={e => setM('pickup_hint', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm"
                      placeholder="Abholung direkt bei uns: Solinger Str. 12, 40764 Langenfeld"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Wird im Checkout unter der Abholoption angezeigt.</p>
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
                subtitle="PayPal Zahlungen – einfach Keys eintragen und aktivieren"
                docsUrl="https://developer.paypal.com/dashboard/applications">
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
                        rows={2} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm"
                        placeholder="z.B. Bitte halte den Betrag in bar bereit!" />
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
                            className="flex-shrink-0 transition-all hover:scale-110"
                            style={{ color: data.enabled ? '#22c55e' : '#d1d5db' }}>
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
                              {feature.comingSoon && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-semibold">Bald verfügbar</span>}
                              {!feature.comingSoon && isEnabled && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✅ Aktiv</span>}
                            </div>
                            <p className="text-sm text-gray-400">{feature.description}</p>
                            {feature.adminLink && isEnabled && (
                              <a href={feature.adminLink} className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                <ExternalLink size={12} /> {feature.adminLabel}
                              </a>
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

        </div>
      </div>

      {/* Kalender Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingId ? 'Bearbeiten' : 'Neuer Eintrag'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmitCalendar} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Datum *</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Bezeichnung (optional)</label>
                <input type="text" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })}
                  placeholder="z.B. Weihnachten"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Status</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.is_closed} onChange={() => setFormData({ ...formData, is_closed: true })} className="w-4 h-4" />
                    <span>Geschlossen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!formData.is_closed} onChange={() => setFormData({ ...formData, is_closed: false })} className="w-4 h-4" />
                    <span>Sonderöffnungszeiten</span>
                  </label>
                </div>
              </div>
              {!formData.is_closed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Von</label>
                    <input type="time" value={formData.custom_open} onChange={e => setFormData({ ...formData, custom_open: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bis</label>
                    <input type="time" value={formData.custom_close} onChange={e => setFormData({ ...formData, custom_close: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-2">Notizen (optional)</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50">Abbrechen</button>
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