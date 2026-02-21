import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Calendar as CalendarIcon, Plus, Trash2, Edit2, X } from 'lucide-react'

export default function CalendarPage() {
  const [specialHours, setSpecialHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const [formData, setFormData] = useState({
    date: '',
    is_closed: true,
    custom_open: '14:00',
    custom_close: '22:00',
    label: '',
    notes: ''
  })

  useEffect(() => {
    loadSpecialHours()
  }, [])

  const loadSpecialHours = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('special_hours')
      .select('*')
      .order('date', { ascending: true })

    if (data) setSpecialHours(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (editingId) {
      // Update
      const { error } = await supabase
        .from('special_hours')
        .update(formData)
        .eq('id', editingId)

      if (!error) {
        alert('✅ Aktualisiert!')
        resetForm()
        loadSpecialHours()
      }
    } else {
      // Create
      const { error } = await supabase
        .from('special_hours')
        .insert([formData])

      if (!error) {
        alert('✅ Hinzugefügt!')
        resetForm()
        loadSpecialHours()
      } else {
        alert('❌ Fehler: ' + error.message)
      }
    }
  }

  const handleEdit = (entry) => {
    setEditingId(entry.id)
    setFormData({
      date: entry.date,
      is_closed: entry.is_closed,
      custom_open: entry.custom_open || '14:00',
      custom_close: entry.custom_close || '22:00',
      label: entry.label || '',
      notes: entry.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Wirklich löschen?')) return

    const { error } = await supabase
      .from('special_hours')
      .delete()
      .eq('id', id)

    if (!error) {
      loadSpecialHours()
    }
  }

  const resetForm = () => {
    setFormData({
      date: '',
      is_closed: true,
      custom_open: '14:00',
      custom_close: '22:00',
      label: '',
      notes: ''
    })
    setEditingId(null)
    setShowModal(false)
  }

  const groupByMonth = (entries) => {
    const grouped = {}
    
    entries.forEach(entry => {
      const date = new Date(entry.date)
      const monthKey = date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })
      
      if (!grouped[monthKey]) grouped[monthKey] = []
      grouped[monthKey].push(entry)
    })
    
    return grouped
  }

  const groupedEntries = groupByMonth(specialHours)

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold italic mb-2">Kalender & Sonderöffnungszeiten</h1>
              <p className="text-gray-600">
                Definiere Feiertage und besondere Öffnungszeiten
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition font-semibold"
            >
              <Plus size={20} />
              Neuer Eintrag
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-12">Lädt...</div>
          ) : specialHours.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CalendarIcon size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Noch keine Sonderöffnungszeiten definiert</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedEntries).map(([month, entries]) => (
                <div key={month}>
                  <h2 className="text-xl font-bold mb-4 text-gray-700">{month}</h2>
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-gray-400 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-lg">
                                {new Date(entry.date).toLocaleDateString('de-DE', {
                                  weekday: 'long',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                              {entry.label && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                  {entry.label}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              {entry.is_closed ? (
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                                  🔴 Geschlossen
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                                  🟢 {entry.custom_open} - {entry.custom_close} Uhr
                                </span>
                              )}
                            </div>

                            {entry.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                💬 {entry.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Bearbeiten' : 'Neuer Eintrag'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Datum */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Datum *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                />
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Bezeichnung (optional)
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="z.B. Weihnachten, Sommerfest..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.is_closed}
                      onChange={() => setFormData({ ...formData, is_closed: true })}
                      className="w-4 h-4"
                    />
                    <span>Geschlossen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.is_closed}
                      onChange={() => setFormData({ ...formData, is_closed: false })}
                      className="w-4 h-4"
                    />
                    <span>Sonderöffnungszeiten</span>
                  </label>
                </div>
              </div>

              {/* Zeiten (nur wenn nicht geschlossen) */}
              {!formData.is_closed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Von
                    </label>
                    <input
                      type="time"
                      value={formData.custom_open}
                      onChange={(e) => setFormData({ ...formData, custom_open: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Bis
                    </label>
                    <input
                      type="time"
                      value={formData.custom_close}
                      onChange={(e) => setFormData({ ...formData, custom_close: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Notizen */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Notizen (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Interne Notizen..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition"
                >
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