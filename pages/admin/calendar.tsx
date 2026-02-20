import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react'

interface SpecialDay {
  id: string; date: string; is_open: boolean; reason: string; opening_hours?: string
}

export default function Calendar({ session }: any) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ is_open: false, reason: '', opening_hours: '' })

  useEffect(() => {
    if (!session) { router.push('/auth/login?redirect=/admin/calendar'); return }
    fetchSpecialDays()
  }, [session, currentMonth])

  const fetchSpecialDays = async () => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const { data } = await supabase.from('opening_hours_calendar').select('*')
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]).order('date')
    if (data) setSpecialDays(data)
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay(), days = []
    for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) days.push(null)
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day))
    return days
  }

  const getSpecialDay = (date: Date | null) => {
    if (!date) return null
    return specialDays.find(d => d.date === date.toISOString().split('T')[0])
  }

  const handleDateClick = (date: Date | null) => {
    if (!date) return
    setSelectedDate(date)
    const existing = getSpecialDay(date)
    setFormData(existing ? { is_open: existing.is_open, reason: existing.reason, opening_hours: existing.opening_hours || '' } 
      : { is_open: false, reason: '', opening_hours: '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!selectedDate) return
    const dateStr = selectedDate.toISOString().split('T')[0]
    const existing = getSpecialDay(selectedDate)
    const data = { date: dateStr, ...formData, opening_hours: formData.opening_hours || null }
    if (existing) await supabase.from('opening_hours_calendar').update(data).eq('id', existing.id)
    else await supabase.from('opening_hours_calendar').insert(data)
    setShowModal(false)
    fetchSpecialDays()
  }

  const handleDelete = async () => {
    if (!selectedDate) return
    const existing = getSpecialDay(selectedDate)
    if (existing) await supabase.from('opening_hours_calendar').delete().eq('id', existing.id)
    setShowModal(false)
    fetchSpecialDays()
  }

  const isToday = (date: Date | null) => date && date.toDateString() === new Date().toDateString()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-[#8da399] font-bold text-sm mb-4 hover:text-[#4a5d54]">
          <ChevronLeft size={16} /> ZURÜCK
        </button>

        <h1 className="text-3xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>Öffnungszeiten-Kalender</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} 
              className="p-1.5 rounded-lg hover:bg-gray-50">
              <ChevronLeft size={18} style={{ color: '#4a5d54' }} />
            </button>
            <h2 className="text-lg font-display font-bold italic" style={{ color: '#4a5d54' }}>
              {['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} 
              className="p-1.5 rounded-lg hover:bg-gray-50">
              <ChevronRight size={18} style={{ color: '#4a5d54' }} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => 
              <div key={d} className="text-center font-bold text-[10px]" style={{ color: '#8da399' }}>{d}</div>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((date, i) => {
              const special = getSpecialDay(date), today = isToday(date)
              return (
                <button key={i} onClick={() => handleDateClick(date)} disabled={!date}
                  className={`aspect-square p-0.5 rounded text-[10px] transition ${!date ? 'invisible' : ''}
                    ${today ? 'ring-1 ring-blue-500' : ''}
                    ${special ? special.is_open ? 'bg-green-100 border border-green-500' : 'bg-red-100 border border-red-500' 
                      : 'hover:bg-gray-50 border border-transparent'}`}>
                  {date && (
                    <div className="relative">
                      <div className={`font-semibold ${today ? 'text-blue-600' : ''}`}>{date.getDate()}</div>
                      {special && <div className="absolute top-0 right-0">{special.is_open ? <Check size={6} className="text-green-600" /> : <X size={6} className="text-red-600" />}</div>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex gap-3 mt-3 pt-3 border-t text-[10px]">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div><span>Geöffnet</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div><span>Geschlossen</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 border border-blue-500 rounded"></div><span>Heute</span></div>
          </div>
        </div>
      </div>

      {showModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-display font-bold italic" style={{ color: '#4a5d54' }}>
                {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setFormData({ ...formData, is_open: false })}
                  className={`p-3 rounded-xl border transition ${!formData.is_open ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                  <X className={`mx-auto mb-1 ${!formData.is_open ? 'text-red-600' : 'text-gray-400'}`} size={20} />
                  <div className={`font-bold text-xs ${!formData.is_open ? 'text-red-600' : 'text-gray-600'}`}>Geschlossen</div>
                </button>
                <button onClick={() => setFormData({ ...formData, is_open: true })}
                  className={`p-3 rounded-xl border transition ${formData.is_open ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <Check className={`mx-auto mb-1 ${formData.is_open ? 'text-green-600' : 'text-gray-400'}`} size={20} />
                  <div className={`font-bold text-xs ${formData.is_open ? 'text-green-600' : 'text-gray-600'}`}>Geöffnet</div>
                </button>
              </div>

              <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Grund (z.B. Feiertag, Urlaub...)" className="w-full border-2 rounded-lg px-3 py-2 text-sm" />

              {formData.is_open && (
                <input type="text" value={formData.opening_hours} onChange={e => setFormData({ ...formData, opening_hours: e.target.value })}
                  placeholder="Abweichende Zeiten (z.B. 10:00 - 18:00)" className="w-full border-2 rounded-lg px-3 py-2 text-sm" />
              )}

              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 py-2 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: '#4a5d54' }}>💾 Speichern</button>
                {getSpecialDay(selectedDate) && (
                  <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold text-sm">🗑</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}