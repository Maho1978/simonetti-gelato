import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Clock, DollarSign, Save, PowerOff, Power, Calendar as CalendarIcon, Plus, Trash2, Edit2, X, Mail, ToggleLeft, ToggleRight } from 'lucide-react'

const DAYS = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag'
}

const EMAIL_TYPES = [
  {
    key: 'order_confirmed',
    label: '✅ Bestellbestätigung',
    description: 'Wird gesendet wenn Bestellung auf "In Bearbeitung" gesetzt wird',
    alwaysOn: true,
    color: 'green'
  },
  {
    key: 'order_out_for_delivery',
    label: '🚗 Bestellung unterwegs',
    description: 'Wird gesendet wenn Bestellung an Fahrer übergeben wird',
    alwaysOn: false,
    color: 'blue'
  },
  {
    key: 'order_delivered',
    label: '🎉 Bestellung zugestellt',
    description: 'Wird gesendet wenn Bestellung als geliefert markiert wird',
    alwaysOn: false,
    color: 'purple'
  },
  {
    key: 'new_order_admin',
    label: '🔔 Neue Bestellung (Admin)',
    description: 'Admin-Benachrichtigung bei jeder neuen Bestellung',
    alwaysOn: false,
    color: 'red'
  }
]

const DEFAULT_EMAIL_SETTINGS = {
  order_confirmed: {
    enabled: true,
    subject: '✅ Bestellung bestätigt #{orderNumber} - Simonetti Gelateria',
    custom_text: ''
  },
  order_out_for_delivery: {
    enabled: true,
    subject: '🚗 Dein Eis ist unterwegs! #{orderNumber}',
    custom_text: ''
  },
  order_delivered: {
    enabled: true,
    subject: '✅ Bestellung zugestellt #{orderNumber} - Guten Appetit!',
    custom_text: ''
  },
  new_order_admin: {
    enabled: true,
    subject: '🔔 Neue Bestellung #{orderNumber} - Sofort bearbeiten!',
    custom_text: ''
  }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const [settings, setSettings] = useState({
    delivery_fee: 3.0,
    min_order_value: 15.0,
    delivery_duration_min: 30,
    delivery_duration_max: 45,
    currently_open: true,
    manual_close: false,
    close_message: '',
    opening_hours: {}
  })

  const [emailSettings, setEmailSettings] = useState<any>(DEFAULT_EMAIL_SETTINGS)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailTestSending, setEmailTestSending] = useState<string | null>(null)

  // Kalender State
  const [specialHours, setSpecialHours] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<any>(null)
  const [formData, setFormData] = useState({
    date: '',
    is_closed: true,
    custom_open: '14:00',
    custom_close: '22:00',
    label: '',
    notes: ''
  })

  useEffect(() => {
    loadSettings()
    loadSpecialHours()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (data) {
      setSettings({
        delivery_fee: data.delivery_fee || 3.0,
        min_order_value: data.min_order_value || 15.0,
        delivery_duration_min: data.delivery_duration_min || 30,
        delivery_duration_max: data.delivery_duration_max || 45,
        currently_open: data.currently_open ?? true,
        manual_close: data.manual_close || false,
        close_message: data.close_message || '',
        opening_hours: data.opening_hours || {}
      })
      if (data.email_notifications) {
        setEmailSettings({ ...DEFAULT_EMAIL_SETTINGS, ...data.email_notifications })
      }
    }
    setLoading(false)
  }

  const loadSpecialHours = async () => {
    const { data } = await supabase
      .from('special_hours')
      .select('*')
      .order('date', { ascending: true })
    if (data) setSpecialHours(data)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('shop_settings')
      .update(settings)
      .eq('id', 'main')
    if (!error) {
      alert('✅ Einstellungen gespeichert!')
    } else {
      alert('❌ Fehler: ' + error.message)
    }
    setSaving(false)
  }

  const handleSaveEmails = async () => {
    setEmailSaving(true)
    const { error } = await supabase
      .from('shop_settings')
      .update({ email_notifications: emailSettings })
      .eq('id', 'main')
    if (!error) {
      alert('✅ Email-Einstellungen gespeichert!')
    } else {
      alert('❌ Fehler: ' + error.message)
    }
    setEmailSaving(false)
  }

  const toggleManualClose = async () => {
    const newValue = !settings.manual_close
    const { error } = await supabase
      .from('shop_settings')
      .update({ manual_close: newValue })
      .eq('id', 'main')
    if (!error) setSettings({ ...settings, manual_close: newValue })
  }

  const updateDayHours = (day: string, field: string, value: any) => {
    setSettings({
      ...settings,
      opening_hours: {
        ...settings.opening_hours,
        [day]: {
          ...(settings.opening_hours as any)[day],
          [field]: value
        }
      }
    })
  }

  const updateEmailSetting = (typeKey: string, field: string, value: any) => {
    setEmailSettings((prev: any) => ({
      ...prev,
      [typeKey]: {
        ...prev[typeKey],
        [field]: value
      }
    }))
  }

  const sendTestEmail = async (typeKey: string) => {
    setEmailTestSending(typeKey)
    try {
      const testOrder = {
        id: 'test-123456',
        order_number: 'TEST',
        customer_name: 'Test Kunde',
        customer_email: 'info@eiscafe-simonetti.de',
        delivery_address: 'Musterstraße 1, 40764 Langenfeld',
        total: 18.50,
        items: [{ quantity: 2, name: 'Gemischtes Eis', price: 6.50, selectedFlavors: ['Schokolade', 'Vanille'] }],
        payment_method: 'stripe'
      }
      const response = await fetch('/api/emails/send-order-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeKey, order: testOrder, recipientEmail: 'info@eiscafe-simonetti.de' })
      })
      const result = await response.json()
      if (result.success) {
        alert(`✅ Test-Email gesendet an info@eiscafe-simonetti.de!`)
      } else if (result.skipped) {
        alert('⚠️ Email ist deaktiviert – erst aktivieren zum Testen.')
      } else {
        alert('❌ Fehler: ' + result.error)
      }
    } catch (e) {
      alert('❌ Fehler beim Senden')
    }
    setEmailTestSending(null)
  }

  // Kalender Funktionen
  const handleSubmitCalendar = async (e: any) => {
    e.preventDefault()
    if (editingId) {
      const { error } = await supabase.from('special_hours').update(formData).eq('id', editingId)
      if (!error) { alert('✅ Aktualisiert!'); resetForm(); loadSpecialHours() }
    } else {
      const { error } = await supabase.from('special_hours').insert([formData])
      if (!error) { alert('✅ Hinzugefügt!'); resetForm(); loadSpecialHours() }
      else alert('❌ Fehler: ' + error.message)
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
    setEditingId(null)
    setShowModal(false)
  }

  const groupByMonth = (entries: any[]) => {
    const grouped: any = {}
    entries.forEach(entry => {
      const date = new Date(entry.date)
      const monthKey = date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })
      if (!grouped[monthKey]) grouped[monthKey] = []
      grouped[monthKey].push(entry)
    })
    return grouped
  }

  if (loading) {
    return <AdminLayout><div className="p-8">Lädt...</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-5xl">

          <h1 className="text-3xl font-display font-bold italic mb-8">Shop-Einstellungen</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 flex-wrap">
            {[
              { key: 'general', label: '⚙️ Allgemein' },
              { key: 'hours', label: '🕐 Öffnungszeiten' },
              { key: 'calendar', label: '📅 Kalender & Feiertage' },
              { key: 'emails', label: '📧 Email-Benachrichtigungen' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === tab.key ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: ALLGEMEIN */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-xl mb-2">Shop-Status</h2>
                    <p className="text-sm text-gray-600">
                      {settings.manual_close ? '🔴 Shop ist manuell geschlossen' : '🟢 Shop ist geöffnet'}
                    </p>
                  </div>
                  <button onClick={toggleManualClose}
                    className={`flex items-center gap-3 px-6 py-4 rounded-lg font-bold text-lg transition ${settings.manual_close ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                    {settings.manual_close ? <><Power size={24} /> Shop öffnen</> : <><PowerOff size={24} /> Shop schließen</>}
                  </button>
                </div>
                {settings.manual_close && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold mb-2">Nachricht für Kunden (optional)</label>
                    <input type="text" value={settings.close_message}
                      onChange={(e) => setSettings({ ...settings, close_message: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                      placeholder="z.B. Betriebsferien bis 15.03." />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><DollarSign size={24} />Preise & Gebühren</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Liefergebühr (€)</label>
                    <input type="number" step="0.50" value={settings.delivery_fee}
                      onChange={(e) => setSettings({ ...settings, delivery_fee: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Mindestbestellwert (€)</label>
                    <input type="number" step="1.00" value={settings.min_order_value}
                      onChange={(e) => setSettings({ ...settings, min_order_value: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Clock size={24} />Lieferdauer</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Mindestdauer (Minuten)</label>
                    <input type="number" value={settings.delivery_duration_min}
                      onChange={(e) => setSettings({ ...settings, delivery_duration_min: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Maximaldauer (Minuten)</label>
                    <input type="number" value={settings.delivery_duration_max}
                      onChange={(e) => setSettings({ ...settings, delivery_duration_max: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">Wird Kunden angezeigt: "Lieferung in ca. {settings.delivery_duration_min}-{settings.delivery_duration_max} Minuten"</p>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-lg hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={24} />{saving ? 'Speichert...' : 'Einstellungen speichern'}
              </button>
            </div>
          )}

          {/* TAB: ÖFFNUNGSZEITEN */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-bold text-xl mb-4">Reguläre Öffnungszeiten</h2>
                <div className="space-y-3">
                  {Object.entries(DAYS).map(([key, label]) => {
                    const day = (settings.opening_hours as any)[key] || { open: '14:00', close: '22:00', closed: false }
                    return (
                      <div key={key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg flex-wrap">
                        <div className="w-24 font-semibold">{label}</div>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={day.closed}
                            onChange={(e) => updateDayHours(key, 'closed', e.target.checked)} className="w-4 h-4" />
                          <span className="text-sm">Geschlossen</span>
                        </label>
                        {!day.closed && (
                          <>
                            <input type="time" value={day.open}
                              onChange={(e) => updateDayHours(key, 'open', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded" />
                            <span className="text-gray-600">bis</span>
                            <input type="time" value={day.close}
                              onChange={(e) => updateDayHours(key, 'close', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded" />
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-lg hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={24} />{saving ? 'Speichert...' : 'Öffnungszeiten speichern'}
              </button>
            </div>
          )}

          {/* TAB: KALENDER */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Sonderöffnungszeiten & Feiertage</h2>
                  <p className="text-gray-600 text-sm mt-1">Definiere spezielle Tage mit eigenen Öffnungszeiten oder Schließtage</p>
                </div>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition font-semibold">
                  <Plus size={20} />Neuer Eintrag
                </button>
              </div>

              {specialHours.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <CalendarIcon size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Noch keine Sonderöffnungszeiten definiert</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupByMonth(specialHours)).map(([month, entries]: any) => (
                    <div key={month}>
                      <h3 className="text-lg font-bold mb-3 text-gray-700">{month}</h3>
                      <div className="space-y-3">
                        {entries.map((entry: any) => (
                          <div key={entry.id} className="bg-white rounded-lg border-2 border-gray-200 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-bold">
                                    {new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </span>
                                  {entry.label && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">{entry.label}</span>}
                                </div>
                                {entry.is_closed
                                  ? <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">🔴 Geschlossen</span>
                                  : <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">🟢 {entry.custom_open} - {entry.custom_close} Uhr</span>}
                                {entry.notes && <p className="text-sm text-gray-600 mt-2">💬 {entry.notes}</p>}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleEdit(entry)} className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(entry.id)} className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"><Trash2 size={18} /></button>
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

          {/* TAB: EMAIL-BENACHRICHTIGUNGEN */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Email-Benachrichtigungen</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Verfügbare Variablen: <code className="bg-gray-100 px-1 rounded">#&#123;orderNumber&#125;</code> <code className="bg-gray-100 px-1 rounded">#&#123;customerName&#125;</code> <code className="bg-gray-100 px-1 rounded">#&#123;total&#125;</code>
                </p>
              </div>

              {EMAIL_TYPES.map((emailType) => {
                const typeSetting = emailSettings[emailType.key] || {}
                const isEnabled = emailType.alwaysOn || typeSetting.enabled !== false

                return (
                  <div key={emailType.key} className={`bg-white rounded-lg border-2 p-6 ${isEnabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg">{emailType.label}</h3>
                          {emailType.alwaysOn && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Immer aktiv</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{emailType.description}</p>
                      </div>

                      {/* Toggle - nur für nicht-pflicht Emails */}
                      {!emailType.alwaysOn && (
                        <button
                          onClick={() => updateEmailSetting(emailType.key, 'enabled', !isEnabled)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${isEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          {isEnabled ? 'Aktiv' : 'Deaktiviert'}
                        </button>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Betreff</label>
                      <input
                        type="text"
                        value={typeSetting.subject || ''}
                        onChange={(e) => updateEmailSetting(emailType.key, 'subject', e.target.value)}
                        placeholder="Standard-Betreff wird verwendet wenn leer"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none text-sm"
                      />
                    </div>

                    {/* Custom Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">
                        Zusatztext (optional)
                        <span className="text-gray-400 font-normal ml-2">– wird als gelber Hinweisblock in der Email angezeigt</span>
                      </label>
                      <textarea
                        value={typeSetting.custom_text || ''}
                        onChange={(e) => updateEmailSetting(emailType.key, 'custom_text', e.target.value)}
                        rows={2}
                        placeholder="z.B. Bitte halte den Betrag in bar bereit!"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none text-sm"
                      />
                    </div>

                    {/* Test Email Button */}
                    <button
                      onClick={() => sendTestEmail(emailType.key)}
                      disabled={emailTestSending === emailType.key}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold hover:border-black transition disabled:opacity-50">
                      <Mail size={16} />
                      {emailTestSending === emailType.key ? 'Sendet...' : 'Test-Email senden'}
                    </button>
                  </div>
                )
              })}

              <button onClick={handleSaveEmails} disabled={emailSaving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-lg hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={24} />{emailSaving ? 'Speichert...' : 'Email-Einstellungen speichern'}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingId ? 'Bearbeiten' : 'Neuer Eintrag'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitCalendar} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Datum *</label>
                <input type="date" required value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Bezeichnung (optional)</label>
                <input type="text" value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="z.B. Weihnachten, Sommerfest..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
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
                    <input type="time" value={formData.custom_open}
                      onChange={(e) => setFormData({ ...formData, custom_open: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bis</label>
                    <input type="time" value={formData.custom_close}
                      onChange={(e) => setFormData({ ...formData, custom_close: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-2">Notizen (optional)</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Interne Notizen..." rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition">Abbrechen</button>
                <button type="submit"
                  className="flex-1 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition">
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