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

function isNowBetween(from: string, until: string): boolean {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
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

    const todayStr = new Date().toISOString().split('T')[0]

    // 2. Sondertag
    const { data: specialDay } = await supabase
      .from('special_hours').select('*').eq('date', todayStr).maybeSingle()

    if (specialDay) {
      if (specialDay.is_closed) {
        return res.status(200).json({
          isOpen: false, isPreorder: false,
          message: specialDay.label ? `Heute geschlossen: ${specialDay.label}` : 'Heute leider geschlossen.'
        })
      }
      // Feldnamen-Kompatibilität: custom_open/custom_close (neu) oder open_from/open_until (alt)
      const from  = specialDay.custom_open  || specialDay.open_from  || '14:00'
      const until = specialDay.custom_close || specialDay.open_until || '22:00'
      const isOpen = isNowBetween(from, until)
      return res.status(200).json({
        isOpen, isPreorder: false,
        message: isOpen ? `Geöffnet bis ${until} Uhr` : `Geöffnet von ${from} bis ${until} Uhr`,
        openFrom: from, openUntil: until
      })
    }

    // 3. Reguläre Öffnungszeiten
    const dayKey = DAY_KEYS[new Date().getDay()]
    const hours  = settings.opening_hours?.[dayKey]

    if (!hours || hours.closed) {
      return res.status(200).json({ isOpen: false, isPreorder: false, message: 'Heute leider geschlossen.' })
    }

    const from   = hours.open  || '14:00'
    const until  = hours.close || '22:00'
    const isOpen = isNowBetween(from, until)

    // 4. Vorbestellung prüfen
    if (!isOpen && settings.preorder_enabled) {
      const nowHour         = new Date().getHours()
      const preorderStart   = settings.preorder_start_hour ?? 10
      const preorderAllowed = nowHour >= preorderStart

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