import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export interface ShopStatus {
  isOpen: boolean
  isPreorder: boolean
  openFrom: string
  openUntil: string
  message: string
  preorderHint: string
  loading: boolean
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// ── FIX: Deutsche Zeit im Browser (läuft client-side, aber zur Sicherheit explizit) ──
function getNowDE() {
  const now  = new Date()
  const tz   = 'Europe/Berlin'
  const hours   = parseInt(now.toLocaleString('de-DE', { timeZone: tz, hour: '2-digit', hour12: false }))
  const minutes = parseInt(now.toLocaleString('de-DE', { timeZone: tz, minute: '2-digit' }))
  const day     = now.toLocaleDateString('de-DE', { timeZone: tz, weekday: 'long' })
  const dayMap: Record<string, number> = {
    'Sonntag': 0, 'Montag': 1, 'Dienstag': 2, 'Mittwoch': 3,
    'Donnerstag': 4, 'Freitag': 5, 'Samstag': 6
  }
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD
  return { hours, minutes, dayOfWeek: dayMap[day] ?? new Date().getDay(), dateStr }
}

function isNowBetween(from: string, until: string): boolean {
  const { hours, minutes } = getNowDE()
  const nowMins = hours * 60 + minutes
  return nowMins >= timeToMinutes(from) && nowMins < timeToMinutes(until)
}

export async function fetchShopStatus(): Promise<ShopStatus> {
  try {
    const { data: settings } = await supabase
      .from('shop_settings').select('*').eq('id', 'main').single()

    if (!settings) return {
      isOpen: false, isPreorder: false, openFrom: '', openUntil: '',
      message: 'Shop nicht erreichbar', preorderHint: '', loading: false,
    }

    if (settings.manual_close) {
      return {
        isOpen: false, isPreorder: false, openFrom: '', openUntil: '',
        message: settings.close_message || 'Der Shop ist momentan geschlossen.',
        preorderHint: '', loading: false,
      }
    }

    const nowDE = getNowDE()

    const { data: specialDay } = await supabase
      .from('special_hours').select('*').eq('date', nowDE.dateStr).maybeSingle()

    if (specialDay) {
      if (specialDay.is_closed) {
        return {
          isOpen: false, isPreorder: false, openFrom: '', openUntil: '',
          message: specialDay.label ? `Heute geschlossen: ${specialDay.label}` : 'Heute leider geschlossen.',
          preorderHint: '', loading: false,
        }
      }
      const from  = specialDay.custom_open  || specialDay.open_from  || '14:00'
      const until = specialDay.custom_close || specialDay.open_until || '22:00'
      const open  = isNowBetween(from, until)
      return {
        isOpen: open, isPreorder: false, openFrom: from, openUntil: until,
        message: open ? `Geöffnet bis ${until} Uhr` : `Geöffnet von ${from} bis ${until} Uhr`,
        preorderHint: '', loading: false,
      }
    }

    const dayKey = DAY_KEYS[nowDE.dayOfWeek]
    const hours  = settings.opening_hours?.[dayKey]

    if (!hours || hours.closed) {
      return {
        isOpen: false, isPreorder: false, openFrom: '', openUntil: '',
        message: 'Heute haben wir leider geschlossen.',
        preorderHint: '', loading: false,
      }
    }

    const from  = hours.open  || '14:00'
    const until = hours.close || '22:00'
    const open  = isNowBetween(from, until)

    if (!open && settings.preorder_enabled) {
      const preorderStart   = settings.preorder_start_hour ?? 10
      const preorderAllowed = nowDE.hours >= preorderStart

      if (preorderAllowed) {
        return {
          isOpen:       true,
          isPreorder:   true,
          openFrom:     from,
          openUntil:    until,
          message:      `Jetzt vorbestellen – Lieferung ab ${from} Uhr`,
          preorderHint: settings.preorder_hint || `Du kannst jetzt vorbestellen – Lieferung startet ab ${from} Uhr.`,
          loading:      false,
        }
      }
    }

    return {
      isOpen:       open,
      isPreorder:   false,
      openFrom:     from,
      openUntil:    until,
      message: open
        ? `Geöffnet bis ${until} Uhr · Lieferung in ca. ${settings.delivery_duration_min || 30}–${settings.delivery_duration_max || 45} Min.`
        : `Geöffnet von ${from} bis ${until} Uhr`,
      preorderHint: '',
      loading:      false,
    }
  } catch (e) {
    console.error('ShopStatus error:', e)
    return { isOpen: true, isPreorder: false, openFrom: '', openUntil: '', message: '', preorderHint: '', loading: false }
  }
}

export function useShopStatus(): ShopStatus {
  const [status, setStatus] = useState<ShopStatus>({
    isOpen: false, isPreorder: false, openFrom: '', openUntil: '',
    message: '', preorderHint: '', loading: true,
  })

  useEffect(() => {
    fetchShopStatus().then(setStatus)
    const iv = setInterval(() => fetchShopStatus().then(setStatus), 60000)
    return () => clearInterval(iv)
  }, [])

  return status
}