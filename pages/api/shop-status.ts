import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// ── FIX: Immer deutsche Zeit (Europe/Berlin), egal wo der Server läuft ──
function getNowDE(): { hours: number; minutes: number; dayOfWeek: number; dateStr: string } {
  const now    = new Date()
  const locale = 'de-DE'
  const tz     = 'Europe/Berlin'

  const hours      = parseInt(now.toLocaleString(locale, { timeZone: tz, hour:   '2-digit', hour12: false }))
  const minutes    = parseInt(now.toLocaleString(locale, { timeZone: tz, minute: '2-digit' }))
  const dayOfWeek  = parseInt(now.toLocaleString(locale, { timeZone: tz, weekday: 'long' })
    .replace('Sonntag','0').replace('Montag','1').replace('Dienstag','2')
    .replace('Mittwoch','3').replace('Donnerstag','4').replace('Freitag','5').replace('Samstag','6'))

  // Datum in DE-Zeitzone für Sondertage
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD

  return { hours, minutes, dayOfWeek, dateStr }
}

function isNowBetween(from: string, until: string, nowDE: { hours: number; minutes: number }): boolean {
  const nowMins = nowDE.hours * 60 + nowDE.minutes
  return nowMins >= timeToMinutes(from) && nowMins < timeToMinutes(until)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data: settings } = await supabase
      .from('shop_settings').select('*').eq('id', 'main').single()

    if (!settings) return res.status(200).json({ isOpen: false, isPreorder: false, message: 'Shop nicht verfügbar' })

    // 1. Manuell geschlossen
    if (settings.manual_close) {
      return res.status(200).json({
        isOpen: false, isPreorder: false,
        message: settings.close_message || 'Der Shop ist momentan geschlossen.'
      })
    }

    const nowDE = getNowDE()

    // 2. Sondertag
    const { data: specialDay } = await supabase
      .from('special_hours').select('*').eq('date', nowDE.dateStr).maybeSingle()

    if (specialDay) {
      if (specialDay.is_closed) {
        return res.status(200).json({
          isOpen: false, isPreorder: false,
          message: specialDay.label ? `Heute geschlossen: ${specialDay.label}` : 'Heute leider geschlossen.'
        })
      }
      const from  = specialDay.custom_open  || specialDay.open_from  || '14:00'
      const until = specialDay.custom_close || specialDay.open_until || '22:00'
      const isOpen = isNowBetween(from, until, nowDE)
      return res.status(200).json({
        isOpen, isPreorder: false,
        message: isOpen ? `Geöffnet bis ${until} Uhr` : `Geöffnet von ${from} bis ${until} Uhr`,
        openFrom: from, openUntil: until
      })
    }

    // 3. Reguläre Öffnungszeiten
    const dayKey = DAY_KEYS[nowDE.dayOfWeek]
    const hours  = settings.opening_hours?.[dayKey]

    if (!hours || hours.closed) {
      return res.status(200).json({ isOpen: false, isPreorder: false, message: 'Heute leider geschlossen.' })
    }

    const from   = hours.open  || '14:00'
    const until  = hours.close || '22:00'
    const isOpen = isNowBetween(from, until, nowDE)

    // 4. Vorbestellung prüfen
    if (!isOpen && settings.preorder_enabled) {
      const preorderStart   = settings.preorder_start_hour ?? 10
      const preorderAllowed = nowDE.hours >= preorderStart

      if (preorderAllowed) {
        return res.status(200).json({
          isOpen:       true,
          isPreorder:   true,
          message:      `Jetzt vorbestellen – Lieferung ab ${from} Uhr`,
          preorderHint: settings.preorder_hint || `Du kannst jetzt vorbestellen – Lieferung startet ab ${from} Uhr.`,
          openFrom:     from,
          openUntil:    until
        })
      }
    }

    return res.status(200).json({
      isOpen, isPreorder: false,
      message: isOpen
        ? `Geöffnet bis ${until} Uhr`
        : `Geöffnet von ${from} bis ${until} Uhr`,
      openFrom: from, openUntil: until
    })

  } catch (err) {
    console.error('shop-status error:', err)
    return res.status(200).json({ isOpen: true, isPreorder: false, message: '' })
  }
}