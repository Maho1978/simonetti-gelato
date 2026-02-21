import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Calendar as CalendarIcon, Plus, Trash2, Edit2, X, Clock, Info } from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      // Update
      const { error } = await supabase
        .from('special_hours')
        .update(formData)
        .eq('id', editingId)

      if (!error) {
        resetForm()
        loadSpecialHours()
      }
    } else {
      // Create
      const { error } = await supabase
        .from('special_hours')
        .insert([formData])

      if (!error) {
        resetForm()
        loadSpecialHours()
      } else {
        alert('❌ Fehler: ' + error.message)
      }
    }
  }

  const handleEdit = (entry: any) => {
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

  const handleDelete = async (id: number) => {
    if (!confirm('Diesen Kalendereintrag wirklich löschen?')) return

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

  const groupByMonth = (entries: any[]) => {
    const grouped: { [key: string]: any[] } = {}
    
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
      <div className="p-8 bg-[#fdfcfb] min-h-screen">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-display font-bold italic text-[#4a5d54] mb-2">
                Kalender & Sonderzeiten
              </h1>
              <p className="text-[#8da399] italic">
                Verwalte Feiertage, Urlaube und abweichende Öffnungszeiten.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#4a5d54] text-white rounded-full hover:bg-[#3d4d45] transition shadow-lg shadow-[#4a5d54]/20 font-bold uppercase text-xs tracking-widest"
            >
              <Plus size={18} />
              Neuer Eintrag
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#f1f0ea] border-t-[#4a5d54] rounded-full animate-spin mb-4" />
              <p className="text-[#8da399] italic font-display">Kalender wird geladen...</p>
            </div>
          ) : specialHours.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-[#f1f0ea]">
              <CalendarIcon size={48} className="mx-auto mb-4 text-[#f1f0ea]" />
              <p className="text-[#8da399] italic">Noch keine Sonderöffnungszeiten eingetragen.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedEntries).map(([month, entries]) => (
                <div key={month}>
                  <h2 className="text-2xl font-display font-bold italic mb-6 text-[#4a5d54] border-b border-[#f1f0ea] pb-2">
                    {month}
                  </h2>
                  <div className="space-y-4">
                    {(entries as any[]).map((entry: any) => (
                      <div
                        key={entry.id}
                        className="bg-white rounded-[1.5rem] border border-[#f1f0ea] p-5 hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-bold text-lg text-[#4a5d54]">
                                {new Date(entry.date).toLocaleDateString('de-DE', {
                                  weekday: 'long',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                              {entry.label && (
                                <span className="px-3 py-1 bg-[#f1f0ea] text-[#8da399] rounded-full text-[10px] font-black uppercase tracking-wider">
                                  {entry.label}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              {entry.is_closed ? (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-tighter">
                                  <X size={14} /> Geschlossen
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-tighter">
                                  <Clock size={14} /> {entry.custom_open} - {entry.custom_close} Uhr
                                </span>
                              )}
                            </div>

                            {entry.notes && (
                              <div className="flex items-center gap-2 text-sm text-[#8da399] mt-3 italic">
                                <Info size={14} /> {entry.notes}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-2 hover:bg-[#f1f0ea] rounded-xl transition text-[#4a5d54]"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 hover:bg-red-50 rounded-xl transition text-red-400"
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
        <div className="fixed inset-0 bg-[#4a5d54]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold italic text-[#4a5d54]">
                {editingId ? 'Bearbeiten' : 'Neuer Eintrag'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-[#f1f0ea] rounded-full transition text-[#8da399]"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-[#8da399] mb-2 px-1">
                  Datum *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-5 py-3 bg-[#fdfcfb] border border-[#f1f0ea] rounded-2xl focus:ring-2 focus:ring-[#4a5d54]/10 focus:border-[#4a5d54] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#8da399] mb-2 px-1">
                  Bezeichnung
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="z.B. Betriebsferien"
                  className="w-full px-5 py-3 bg-[#fdfcfb] border border-[#f1f0ea] rounded-2xl focus:ring-2 focus:ring-[#4a5d54]/10 focus:border-[#4a5d54] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#8da399] mb-3 px-1">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_closed: true })}
                    className={`py-3 rounded-2xl text-xs font-bold uppercase transition ${
                      formData.is_closed 
                      ? 'bg-red-50 text-red-600 border border-red-100' 
                      : 'bg-[#fdfcfb] text-[#8da399] border border-[#f1f0ea]'
                    }`}
                  >
                    Geschlossen
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_closed: false })}
                    className={`py-3 rounded-2xl text-xs font-bold uppercase transition ${
                      !formData.is_closed 
                      ? 'bg-green-50 text-green-700 border border-green-100' 
                      : 'bg-[#fdfcfb] text-[#8da399] border border-[#f1f0ea]'
                    }`}
                  >
                    Geöffnet
                  </button>
                </div>
              </div>

              {!formData.is_closed && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#8da399] mb-2 px-1">
                      Von
                    </label>
                    <input
                      type="time"
                      value={formData.custom_open}
                      onChange={(e) => setFormData({ ...formData, custom_open: e.target.value })}
                      className="w-full px-5 py-3 bg-[#fdfcfb] border border-[#f1f0ea] rounded-2xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#8da399] mb-2 px-1">
                      Bis
                    </label>
                    <input
                      type="time"
                      value={formData.custom_close}
                      onChange={(e) => setFormData({ ...formData, custom_close: e.target.value })}
                      className="w-full px-5 py-3 bg-[#fdfcfb] border border-[#f1f0ea] rounded-2xl outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-[#8da399] mb-2 px-1">
                  Notiz
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-5 py-3 bg-[#fdfcfb] border border-[#f1f0ea] rounded-2xl focus:border-[#4a5d54] outline-none transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-[#8da399] hover:text-[#4a5d54] transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#4a5d54] text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-[#4a5d54]/20"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}