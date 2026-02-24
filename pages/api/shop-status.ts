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

    if (!settings) return res.status(200).json({ isOpen: false, message: 'Shop nicht verfügbar' })

    // 1. Manuell geschlossen
    if (settings.manual_close) {
      return res.status(200).json({
        isOpen: false,
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
          isOpen: false,
          message: specialDay.label ? `Heute geschlossen: ${specialDay.label}` : 'Heute leider geschlossen.'
        })
      }
      const isOpen = isNowBetween(specialDay.open_from, specialDay.open_until)
      return res.status(200).json({
        isOpen,
        message: isOpen ? 'Geöffnet' : `Geöffnet von ${specialDay.open_from} bis ${specialDay.open_until} Uhr`,
        openFrom: specialDay.open_from,
        openUntil: specialDay.open_until
      })
    }

    // 3. Reguläre Öffnungszeiten
    const dayKey = DAY_KEYS[new Date().getDay()]
    const hours = settings.opening_hours?.[dayKey]

    if (!hours || hours.closed) {
      return res.status(200).json({ isOpen: false, message: 'Heute leider geschlossen.' })
    }

    const isOpen = isNowBetween(hours.open, hours.close)
    return res.status(200).json({
      isOpen,
      message: isOpen ? 'Geöffnet' : `Geöffnet von ${hours.open} bis ${hours.close} Uhr`,
      openFrom: hours.open,
      openUntil: hours.close
    })

  } catch (err) {
    console.error('shop-status error:', err)
    return res.status(200).json({ isOpen: true, message: '' })
  }
}