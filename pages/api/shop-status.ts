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

function getBerlinTime() {
  const now = new Date()
  // Konvertiert in Berliner Zeit (Europe/Berlin)
  const berlinStr = now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hour12: false })
  const [h, m] = berlinStr.split(':').map(Number)
  return { hours: h, minutes: m, totalMinutes: h * 60 + m }
}

function getBerlinDateString() {
  const now = new Date()
  return now.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' })
    .split('.').reverse().join('-') // DD.MM.YYYY → YYYY-MM-DD
}

function getBerlinDayOfWeek() {
  const now = new Date()
  // toLocaleDateString gibt uns den Wochentag in Berlin
  const dayName = now.toLocaleDateString('en-US', { timeZone: 'Europe/Berlin', weekday: 'long' }).toLowerCase()
  return dayName
}

function isNowBetween(from: string, until: string): boolean {
  const { totalMinutes } = getBerlinTime()
  return totalMinutes >= timeToMinutes(from) && totalMinutes < timeToMinutes(until)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data: settings } = await supabase
      .from('shop_settings').select('*').eq('id', 'main').single()

    if (!settings) return res.status(200).json({ isOpen: false, message: 'Shop nicht verfügbar' })

    // 1. Manuell geschlossen
    if (settings.manual_close) {
      return res.status(200).json({
        isOpen: false,
        message: settings.close_message || 'Der Shop ist momentan geschlossen.'
      })
    }

    const todayStr = getBerlinDateString()

    // 2. Sondertag
    const { data: specialDay } = await supabase
      .from('special_hours').select('*').eq('date', todayStr).maybeSingle()

    if (specialDay) {
      if (specialDay.is_closed) {
        return res.status(200).json({
          isOpen: false,
          message: specialDay.label ? `Heute geschlossen: ${specialDay.label}` : 'Heute leider geschlossen.'
        })
      }
      const from  = specialDay.custom_open  || '14:00'
      const until = specialDay.custom_close || '22:00'
      return res.status(200).json({
        isOpen: isNowBetween(from, until),
        openFrom: from,
        openUntil: until,
        message: `Heute geöffnet von ${from} bis ${until} Uhr`
      })
    }

    // 3. Reguläre Öffnungszeiten
    const dayKey = getBerlinDayOfWeek()
    const hours  = settings.opening_hours?.[dayKey]

    if (!hours || hours.closed) {
      return res.status(200).json({ isOpen: false, message: 'Heute haben wir leider geschlossen.' })
    }

    const from  = hours.open  || '14:00'
    const until = hours.close || '22:00'

    return res.status(200).json({
      isOpen: isNowBetween(from, until),
      openFrom: from,
      openUntil: until,
      message: `Geöffnet von ${from} bis ${until} Uhr`
    })

  } catch (e: any) {
    console.error('shop-status error:', e)
    return res.status(500).json({ isOpen: false, message: 'Fehler beim Prüfen der Öffnungszeiten' })
  }
}