import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, X } from 'lucide-react'

interface ShopStatusBannerProps {
  onClose?: () => void
}

export default function ShopStatusBanner({ onClose }: ShopStatusBannerProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [nextOpeningTime, setNextOpeningTime] = useState('')
  const [countdown, setCountdown] = useState('')
  const [show, setShow] = useState(false)

  useEffect(() => {
    checkShopStatus()
    const interval = setInterval(checkShopStatus, 60000) // Jede Minute prüfen
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isOpen && nextOpeningTime) {
      const timer = setInterval(() => {
        updateCountdown()
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isOpen, nextOpeningTime])

  const checkShopStatus = async () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const dayOfWeek = now.getDay() // 0 = Sonntag, 1 = Montag, etc.

    // 1. Prüfe spezielle Tage im Kalender
    const { data: specialDay } = await supabase
      .from('opening_hours_calendar')
      .select('*')
      .eq('date', today)
      .single()

    if (specialDay) {
      if (!specialDay.is_open) {
        setIsOpen(false)
        setMessage(specialDay.reason || 'Heute geschlossen')
        setShow(true)
        calculateNextOpening(now)
        return
      }
      // Spezielle Öffnungszeiten für heute
      if (specialDay.opening_hours) {
        const [open, close] = specialDay.opening_hours.split('-').map(t => t.trim())
        if (currentTime < open || currentTime > close) {
          setIsOpen(false)
          setMessage(`Heute geöffnet: ${specialDay.opening_hours}`)
          setNextOpeningTime(open)
          setShow(true)
          return
        } else {
          setIsOpen(true)
          setShow(false)
          return
        }
      }
    }

    // 2. Prüfe normale Öffnungszeiten aus shop_settings
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (settings) {
      const isOpenNow = settings.is_open && 
                       currentTime >= settings.open_from && 
                       currentTime <= settings.open_until

      if (!isOpenNow) {
        setIsOpen(false)
        if (!settings.is_open) {
          setMessage('Derzeit geschlossen')
        } else if (currentTime < settings.open_from) {
          setMessage(`Öffnet heute um ${settings.open_from} Uhr`)
          setNextOpeningTime(`${today}T${settings.open_from}:00`)
        } else {
          setMessage('Heute bereits geschlossen')
        }
        setShow(true)
        calculateNextOpening(now)
      } else {
        setIsOpen(true)
        setShow(false)
      }
    }
  }

  const calculateNextOpening = async (now: Date) => {
    // Suche nächsten Tag an dem geöffnet ist
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (!settings) return

    // Morgen
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    // Prüfe ob morgen spezieller Tag
    const { data: tomorrowSpecial } = await supabase
      .from('opening_hours_calendar')
      .select('*')
      .eq('date', tomorrowDate)
      .single()

    if (tomorrowSpecial && tomorrowSpecial.is_open) {
      const openTime = tomorrowSpecial.opening_hours?.split('-')[0]?.trim() || settings.open_from
      setNextOpeningTime(`${tomorrowDate}T${openTime}:00`)
    } else if (!tomorrowSpecial) {
      setNextOpeningTime(`${tomorrowDate}T${settings.open_from}:00`)
    }
  }

  const updateCountdown = () => {
    if (!nextOpeningTime) return

    const now = new Date()
    const opening = new Date(nextOpeningTime)
    const diff = opening.getTime() - now.getTime()

    if (diff <= 0) {
      setCountdown('')
      checkShopStatus() // Re-check status
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      setCountdown(`Öffnet in ${days} Tag${days > 1 ? 'en' : ''}`)
    } else if (hours > 0) {
      setCountdown(`Öffnet in ${hours}h ${minutes}m`)
    } else if (minutes > 0) {
      setCountdown(`Öffnet in ${minutes}m ${seconds}s`)
    } else {
      setCountdown(`Öffnet in ${seconds}s`)
    }
  }

  if (!show || isOpen) return null

  return (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Clock size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">{message}</div>
              {countdown && (
                <div className="text-sm opacity-90 font-medium">{countdown}</div>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}