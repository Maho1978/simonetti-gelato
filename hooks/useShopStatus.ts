import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Sonntag=0, Montag=1, ...
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export interface ShopStatus {
  isOpen: boolean
  openFrom: string
  openUntil: string
  message: string
  loading: boolean
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function isNowBetween(from: string, until: string): boolean {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return nowMins >= timeToMinutes(from) && nowMins < timeToMinutes(until)
}

export async function fetchShopStatus(): Promise<ShopStatus> {
  try {
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (!settings) return { isOpen: false, openFrom: '', openUntil: '', message: 'Shop nicht erreichbar', loading: false }

    // 1. Manuell geschlossen?
    if (settings.manual_close) {
      return {
        isOpen: false,
        openFrom: '',
        openUntil: '',
        message: settings.close_message || 'Der Shop ist momentan geschlossen.',
        loading: false,
      }
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // 2. Sondertag?
    const { data: specialDay } = await supabase
      .from('special_hours')
      .select('*')
      .eq('date', todayStr)
      .maybeSingle()

    if (specialDay) {
      if (specialDay.is_closed) {
        return {
          isOpen: false,
          openFrom: '',
          openUntil: '',
          message: specialDay.label ? `Heute geschlossen: ${specialDay.label}` : 'Heute leider geschlossen.',
          loading: false,
        }
      }
      const from = specialDay.custom_open || '14:00'
      const until = specialDay.custom_close || '22:00'
      const open = isNowBetween(from, until)
      return {
        isOpen: open,
        openFrom: from,
        openUntil: until,
        message: open
          ? `Geöffnet bis ${until} Uhr`
          : `Heute geöffnet von ${from} bis ${until} Uhr`,
        loading: false,
      }
    }

    // 3. Reguläre Öffnungszeiten
    const dayKey = DAY_KEYS[new Date().getDay()]
    const hours = settings.opening_hours?.[dayKey]

    if (!hours || hours.closed) {
      return {
        isOpen: false,
        openFrom: '',
        openUntil: '',
        message: 'Heute haben wir leider geschlossen.',
        loading: false,
      }
    }

    const from = hours.open || '14:00'
    const until = hours.close || '22:00'
    const open = isNowBetween(from, until)

    return {
      isOpen: open,
      openFrom: from,
      openUntil: until,
      message: open
        ? `Geöffnet bis ${until} Uhr · Lieferung in ca. ${settings.delivery_duration_min || 30}–${settings.delivery_duration_max || 45} Min.`
        : `Heute geöffnet von ${from} bis ${until} Uhr`,
      loading: false,
    }
  } catch (e) {
    console.error('ShopStatus error:', e)
    // Im Fehlerfall offen lassen damit Bestellungen nicht blockiert werden
    return { isOpen: true, openFrom: '', openUntil: '', message: '', loading: false }
  }
}

export function useShopStatus(): ShopStatus {
  const [status, setStatus] = useState<ShopStatus>({
    isOpen: false, openFrom: '', openUntil: '', message: '', loading: true,
  })

  useEffect(() => {
    fetchShopStatus().then(setStatus)
    const iv = setInterval(() => fetchShopStatus().then(setStatus), 60000)
    return () => clearInterval(iv)
  }, [])

  return status
}