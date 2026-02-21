import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, Truck, AlertCircle } from 'lucide-react'

export default function ShopStatusBanner() {
  const [status, setStatus] = useState({
    isOpen: true,
    manualClose: false,
    closeMessage: '',
    deliveryDuration: '30-45',
    todayHours: null
  })

  useEffect(() => {
    loadStatus()
    
    // Update alle 60 Sekunden
    const interval = setInterval(loadStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadStatus = async () => {
    const { data } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (data) {
      const today = new Date().toISOString().split('T')[0]
      
      // Prüfe ob heute ein Sondertag ist
      const { data: specialDay } = await supabase
        .from('special_hours')
        .select('*')
        .eq('date', today)
        .single()

      const isOpen = checkIfOpen(data, specialDay)
      const todayHours = specialDay 
        ? (specialDay.is_closed ? null : { open: specialDay.custom_open, close: specialDay.custom_close })
        : getTodayHours(data.opening_hours)

      setStatus({
        isOpen,
        manualClose: data.manual_close,
        closeMessage: specialDay?.label || data.close_message || '',
        deliveryDuration: `${data.delivery_duration_min}-${data.delivery_duration_max}`,
        todayHours
      })
    }
  }

  const checkIfOpen = (data, specialDay) => {
    // Manuell geschlossen?
    if (data.manual_close) return false

    // Sondertag geschlossen?
    if (specialDay?.is_closed) return false

    // Sondertag mit eigenen Öffnungszeiten?
    if (specialDay && !specialDay.is_closed) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const [openH, openM] = specialDay.custom_open.split(':').map(Number)
      const [closeH, closeM] = specialDay.custom_close.split(':').map(Number)
      const openTime = openH * 60 + openM
      const closeTime = closeH * 60 + closeM
      return currentTime >= openTime && currentTime <= closeTime
    }

    // Prüfe normale Öffnungszeiten
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[now.getDay()]
    
    const todayHours = data.opening_hours?.[today]
    if (!todayHours || todayHours.closed) return false

    // Prüfe ob innerhalb Öffnungszeiten
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [openH, openM] = todayHours.open.split(':').map(Number)
    const [closeH, closeM] = todayHours.close.split(':').map(Number)
    const openTime = openH * 60 + openM
    const closeTime = closeH * 60 + closeM

    return currentTime >= openTime && currentTime <= closeTime
  }

  const getTodayHours = (openingHours) => {
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[now.getDay()]
    
    return openingHours?.[today] || null
  }

  // Geschlossen
  if (!status.isOpen) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div className="flex-1">
            <h3 className="font-bold text-red-900">
              {status.manualClose ? '🔴 Shop geschlossen' : '🔴 Aktuell geschlossen'}
            </h3>
            <p className="text-sm text-red-700">
              {status.closeMessage || 'Wir haben aktuell geschlossen. Schau bald wieder vorbei!'}
            </p>
            {status.todayHours && !status.todayHours.closed && (
              <p className="text-xs text-red-600 mt-1">
                Öffnungszeiten heute: {status.todayHours.open} - {status.todayHours.close} Uhr
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Geöffnet
  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        
        {/* Status */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <h3 className="font-bold text-green-900">🟢 Jetzt geöffnet</h3>
            {status.todayHours && (
              <p className="text-xs text-green-700">
                Heute: {status.todayHours.open} - {status.todayHours.close} Uhr
              </p>
            )}
          </div>
        </div>

        {/* Lieferdauer */}
        <div className="flex items-center gap-2 text-sm">
          <Truck className="text-green-700" size={18} />
          <span className="text-green-800">
            Lieferung in ca. <strong>{status.deliveryDuration} Min</strong>
          </span>
        </div>

      </div>
    </div>
  )
}