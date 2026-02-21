import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Edit2, Trash2, X, Save, Phone, Mail, Car, User, Shield, Eye, EyeOff, CheckCircle, XCircle, Truck } from 'lucide-react'

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  vehicle_type: string
  vehicle_plate: string
  notes: string
  is_active: boolean
  status: string
  user_id: string | null
  photo_url: string | null
  total_deliveries: number
  total_earnings: number
  created_at: string
}

const STATUS_COLORS: any = {
  online: 'bg-green-100 text-green-700',
  offline: 'bg-gray-100 text-gray-500',
  busy: 'bg-orange-100 text-orange-700'
}

const STATUS_LABELS: any = {
  online: '🟢 Online',
  offline: '⚫ Offline',
  busy: '🟠 Beschäftigt'
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicle_type: 'Auto',
    vehicle_plate: '',
    notes: '',
    is_active: true
  })

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('drivers')
      .select('*')
      .order('name')
    if (data) setDrivers(data)
    setLoading(false)
  }

  const openAddModal = () => {
    setEditingDriver(null)
    setForm({ name: '', email: '', password: '', phone: '', vehicle_type: 'Auto', vehicle_plate: '', notes: '', is_active: true })
    setShowPassword(false)
    setShowModal(true)
  }

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver)
    setForm({
      name: driver.name,
      email: driver.email,
      password: '', // Leer lassen = kein Passwort-Change
      phone: driver.phone || '',
      vehicle_type: driver.vehicle_type || 'Auto',
      vehicle_plate: driver.vehicle_plate || '',
      notes: driver.notes || '',
      is_active: driver.is_active
    })
    setShowPassword(false)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) {
      alert('Name und Email sind Pflichtfelder!')
      return
    }
    if (!editingDriver && !form.password) {
      alert('Bitte ein Passwort für den neuen Fahrer festlegen!')
      return
    }
    if (form.password && form.password.length < 6) {
      alert('Passwort muss mindestens 6 Zeichen lang sein!')
      return
    }

    setSaving(true)

    try {
      if (editingDriver) {
        // ── BEARBEITEN ──────────────────────────────
        const updateData: any = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          vehicle_type: form.vehicle_type,
          vehicle_plate: form.vehicle_plate,
          notes: form.notes,
          is_active: form.is_active,
          updated_at: new Date().toISOString()
        }

        // Passwort ändern falls eingegeben
        if (form.password && editingDriver.user_id) {
          const response = await fetch('/api/admin/update-driver-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: editingDriver.user_id, password: form.password })
          })
          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || 'Passwort konnte nicht geändert werden')
          }
        }

        const { error } = await supabase
          .from('drivers')
          .update(updateData)
          .eq('id', editingDriver.id)

        if (error) throw error

      } else {
        // ── NEU ANLEGEN ──────────────────────────────
        // 1. Supabase Auth User erstellen
        const response = await fetch('/api/admin/create-driver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            name: form.name
          })
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Fehler beim Erstellen des Fahrers')

        // 2. Driver in DB speichern
        const { error } = await supabase
          .from('drivers')
          .insert({
            name: form.name,
            email: form.email,
            phone: form.phone,
            vehicle_type: form.vehicle_type,
            vehicle_plate: form.vehicle_plate,
            notes: form.notes,
            is_active: form.is_active,
            user_id: result.userId,
            status: 'offline',
            total_deliveries: 0,
            total_earnings: 0
          })

        if (error) throw error
      }

      setShowModal(false)
      loadDrivers()
      alert(editingDriver ? '✅ Fahrer aktualisiert!' : '✅ Fahrer angelegt! Login-Daten per Email gesendet.')

    } catch (error: any) {
      alert('❌ Fehler: ' + error.message)
    }

    setSaving(false)
  }

  const handleDelete = async (driver: Driver) => {
    setSaving(true)
    try {
      // Auth User löschen falls vorhanden
      if (driver.user_id) {
        await fetch('/api/admin/delete-driver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: driver.user_id })
        })
      }
      // Driver aus DB löschen
      await supabase.from('drivers').delete().eq('id', driver.id)
      setDeleteConfirm(null)
      loadDrivers()
    } catch (error: any) {
      alert('❌ Fehler: ' + error.message)
    }
    setSaving(false)
  }

  const toggleActive = async (driver: Driver) => {
    await supabase.from('drivers').update({ is_active: !driver.is_active }).eq('id', driver.id)
    loadDrivers()
  }

  const activeDrivers = drivers.filter(d => d.is_active)
  const inactiveDrivers = drivers.filter(d => !d.is_active)

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-5xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold italic">Fahrerverwaltung</h1>
              <p className="text-gray-500 text-sm mt-1">
                {activeDrivers.length} aktive · {inactiveDrivers.length} inaktive Fahrer
              </p>
            </div>
            <button onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-900 transition">
              <Plus size={20} /> Fahrer hinzufügen
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Lädt...</div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Truck size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-semibold">Noch keine Fahrer angelegt</p>
              <p className="text-gray-400 text-sm mt-1">Füge deinen ersten Fahrer hinzu</p>
              <button onClick={openAddModal}
                className="mt-4 px-5 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-900 transition">
                Ersten Fahrer anlegen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {drivers.map(driver => (
                <div key={driver.id}
                  className={`bg-white rounded-xl border-2 p-5 transition ${driver.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                  <div className="flex items-center gap-4">

                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {driver.photo_url ? (
                        <img src={driver.photo_url} alt={driver.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-400">{driver.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-bold text-lg">{driver.name}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[driver.status] || STATUS_COLORS.offline}`}>
                          {STATUS_LABELS[driver.status] || '⚫ Offline'}
                        </span>
                        {!driver.is_active && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-semibold">Deaktiviert</span>
                        )}
                        {driver.user_id && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold">
                            <Shield size={10} className="inline mr-1" />App-Zugang
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5"><Mail size={14} />{driver.email}</span>
                        {driver.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{driver.phone}</span>}
                        {driver.vehicle_plate && <span className="flex items-center gap-1.5"><Car size={14} />{driver.vehicle_type} · {driver.vehicle_plate}</span>}
                      </div>
                      {/* Stats */}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>📦 {driver.total_deliveries || 0} Lieferungen</span>
                        <span>💰 {(driver.total_earnings || 0).toFixed(2)}€ Umsatz</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleActive(driver)}
                        title={driver.is_active ? 'Deaktivieren' : 'Aktivieren'}
                        className={`p-2 rounded-lg transition ${driver.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                        {driver.is_active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      </button>
                      <button onClick={() => openEditModal(driver)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition">
                        <Edit2 size={20} />
                      </button>
                      <button onClick={() => setDeleteConfirm(driver.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirm */}
                  {deleteConfirm === driver.id && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                      <p className="text-sm font-semibold text-red-700">
                        ⚠️ Fahrer <strong>{driver.name}</strong> wirklich löschen? App-Zugang wird ebenfalls gelöscht!
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white transition">
                          Abbrechen
                        </button>
                        <button onClick={() => handleDelete(driver)} disabled={saving}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                          Löschen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editingDriver ? 'Fahrer bearbeiten' : 'Neuer Fahrer'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Max Mustermann" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Email * (Login für App)</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="fahrer@eiscafe-simonetti.de" disabled={!!editingDriver}
                    className={`w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none ${editingDriver ? 'bg-gray-50 text-gray-400' : ''}`} />
                </div>
                {editingDriver && <p className="text-xs text-gray-400 mt-1">Email kann nicht geändert werden</p>}
              </div>

              {/* Passwort */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  {editingDriver ? 'Neues Passwort (leer lassen = nicht ändern)' : 'Passwort * (min. 6 Zeichen)'}
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={editingDriver ? 'Nur ausfüllen wenn ändern' : 'Sicheres Passwort'}
                    className="w-full px-4 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Telefonnummer</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="0173 1234567"
                    className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none" />
                </div>
              </div>

              {/* Fahrzeug */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Fahrzeugtyp</label>
                  <select value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none">
                    <option>Auto</option>
                    <option>Motorrad</option>
                    <option>Fahrrad</option>
                    <option>E-Bike</option>
                    <option>Roller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Kennzeichen</label>
                  <input type="text" value={form.vehicle_plate} onChange={e => setForm({ ...form, vehicle_plate: e.target.value })}
                    placeholder="ME-AB 123"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none uppercase" />
                </div>
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Interne Notizen</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2} placeholder="z.B. Nur Wochenende verfügbar..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none" />
              </div>

              {/* Aktiv Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5" />
                <label htmlFor="is_active" className="font-semibold text-sm cursor-pointer">
                  Fahrer ist aktiv (kann Bestellungen empfangen)
                </label>
              </div>

              {/* Info Box für neue Fahrer */}
              {!editingDriver && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                  <strong>ℹ️ Hinweis:</strong> Der Fahrer erhält einen App-Zugang mit der eingegebenen Email und dem Passwort. Bitte teile diese Daten sicher mit dem Fahrer.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition">
                  Abbrechen
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={18} />
                  {saving ? 'Speichert...' : editingDriver ? 'Aktualisieren' : 'Fahrer anlegen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}