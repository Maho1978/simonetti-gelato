import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'
import { ToggleLeft, ToggleRight, CreditCard, ShoppingBag, RefreshCw } from 'lucide-react'

interface Feature {
  id: string
  name: string
  description: string
  enabled: boolean
}

const PAYMENT_FEATURES = ['card', 'sepa', 'giropay', 'sofort', 'apple_pay', 'google_pay', 'paypal', 'wero']

const FEATURE_ICONS: Record<string, string> = {
  card:                '💳',
  sepa:                '🏦',
  giropay:             '⚡',
  sofort:              '🚀',
  apple_pay:           '🍎',
  google_pay:          '🤖',
  paypal:              '🅿️',
  wero:                '🇩🇪',
  tip_option:          '💰',
  guest_checkout:      '👤',
  favorites:           '❤️',
  email_notifications: '📧',
}

const FEATURE_EXTRAS: Record<string, string> = {
  paypal:    '💡 Code bereit – Toggle AN und Kunden sehen PayPal sofort',
  wero:      '🔜 Kommt bald – deutsche P2P-Zahlungsmethode (Deutsche Bank, Commerzbank etc.)',
  apple_pay: 'Erscheint automatisch auf iOS Safari',
  google_pay:'Erscheint automatisch auf Android Chrome',
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)
  const [toast, setToast]       = useState('')

  useEffect(() => { loadFeatures() }, [])

  const loadFeatures = async () => {
    const { data } = await supabase.from('feature_toggles').select('*').order('id')
    if (data) setFeatures(data)
    setLoading(false)
  }

  const toggleFeature = async (id: string, currentEnabled: boolean) => {
    // Wero noch nicht aktivierbar
    if (id === 'wero') { showToast('🔜 Wero ist noch nicht verfügbar – kommt bald!'); return }

    setSaving(id)
    const newEnabled = !currentEnabled
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: newEnabled } : f))

    const { error } = await supabase
      .from('feature_toggles')
      .update({ enabled: newEnabled, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: currentEnabled } : f))
      showToast('❌ Fehler beim Speichern')
    } else {
      const name = features.find(f => f.id === id)?.name || id
      showToast(newEnabled ? `✅ ${name} aktiviert` : `⏸️ ${name} deaktiviert`)
    }
    setSaving(null)
  }

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 3000)
  }

  const paymentFeatures = features.filter(f => PAYMENT_FEATURES.includes(f.id))
  const shopFeatures    = features.filter(f => !PAYMENT_FEATURES.includes(f.id))

  // Wero als "virtuellen" Eintrag hinzufügen falls nicht in DB
  const weroInDb = features.find(f => f.id === 'wero')
  const allPaymentFeatures = weroInDb
    ? paymentFeatures
    : [
        ...paymentFeatures,
        { id: 'wero', name: 'Wero', description: 'Deutsche P2P-Zahlungsmethode (in Entwicklung)', enabled: false }
      ]

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-5xl animate-pulse">⚡</div>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl font-semibold text-sm">
          {toast}
        </div>
      )}

      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Features & Zahlungsarten</h1>
            <p className="text-gray-400 text-sm mt-0.5">Änderungen sind sofort für alle Kunden wirksam</p>
          </div>
          <button onClick={loadFeatures} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <RefreshCw size={18} className="text-gray-400" />
          </button>
        </div>

        {/* ── Zahlungsmethoden ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <CreditCard size={18} className="text-gray-600" />
            <h2 className="font-bold text-gray-900">Zahlungsmethoden</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {allPaymentFeatures.map(feature => (
              <FeatureRow
                key={feature.id}
                feature={feature}
                icon={FEATURE_ICONS[feature.id] || '💳'}
                saving={saving === feature.id}
                onToggle={() => toggleFeature(feature.id, feature.enabled)}
                extra={FEATURE_EXTRAS[feature.id]}
                locked={feature.id === 'wero'}
              />
            ))}
          </div>
        </div>

        {/* ── Shop Features ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ShoppingBag size={18} className="text-gray-600" />
            <h2 className="font-bold text-gray-900">Shop-Features</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {shopFeatures.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">Keine Shop-Features gefunden.</div>
            ) : (
              shopFeatures.map(feature => (
                <FeatureRow
                  key={feature.id}
                  feature={feature}
                  icon={FEATURE_ICONS[feature.id] || '⚙️'}
                  saving={saving === feature.id}
                  onToggle={() => toggleFeature(feature.id, feature.enabled)}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <strong>💡 Hinweis:</strong> Zahlungsmethoden müssen auch im{' '}
          <a href="https://dashboard.stripe.com/settings/payment_methods" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            Stripe Dashboard
          </a>{' '}
          aktiviert sein damit sie beim Checkout erscheinen.
        </div>
      </div>
    </AdminLayout>
  )
}

function FeatureRow({ feature, icon, saving, onToggle, extra, locked }: {
  feature: Feature; icon: string; saving: boolean
  onToggle: () => void; extra?: string; locked?: boolean
}) {
  return (
    <div className={`flex items-center justify-between px-6 py-4 transition ${saving ? 'opacity-60' : locked ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{feature.name}</span>
            {locked && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Bald verfügbar</span>}
          </div>
          <div className="text-xs text-gray-400">{feature.description}</div>
          {extra && <div className="text-xs text-green-600 mt-0.5">{extra}</div>}
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className={`transition-all flex-shrink-0 ml-4 ${locked ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'} disabled:cursor-not-allowed`}
        style={{ color: feature.enabled ? '#22c55e' : '#d1d5db' }}
      >
        {feature.enabled ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
      </button>
    </div>
  )
}