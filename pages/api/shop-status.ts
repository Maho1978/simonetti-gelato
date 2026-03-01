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

function getBerlinMinutes(): number {
  // UTC + 1 (Winter) oder UTC + 2 (Sommer) — via Offset berechnen
  const now = new Date()
  const utcMs = now.getTime()
  // Berlin Offset in Minuten herausfinden
  const berlinDateStr = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin', hour12: false, hour: '2-digit', minute: '2-digit' })
  // Format: "14:25" oder "02:05"
  const clean = berlinDateStr.replace(/\s*(AM|PM)/i, '').trim()
  const parts = clean.split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  return h * 60 + m
}

function getNowBerlin(): { hours: number; minutes: number; day: number; dateStr: string } {
  const now = new Date()
  const berlinDateStr = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin', hour12: false, hour: '2-digit', minute: '2-digit' })
  const clean = berlinDateStr.replace(/\s*(AM|PM)/i, '').trim()
  const parts = clean.split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  // Datum in Berlin
  const dateParts = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }) // format: YYYY-MM-DD
  const berlinDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
  return { hours, minutes, day: berlinDate.getDay(), dateStr: dateParts }
}

function isNowBetween(from: string, until: string): boolean {
  const nowMins = getBerlinMinutes()
  const result = nowMins >= timeToMinutes(from) && nowMins < timeToMinutes(until)
  console.log(`isNowBetween(${from}, ${until}): nowMins=${nowMins}, from=${timeToMinutes(from)}, until=${timeToMinutes(until)}, result=${result}`)
  return result
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data: settings } = await supabase
      .from('shop_settings').select('*').eq('id', 'main').single()

    if (!settings) return res.status(200).json({
      isOpen: false, isPreorder: false,
      delivery: { isOpen: false, openFrom: '', openUntil: '' },
      pickup:   { isOpen: false, openFrom: '', openUntil: '' },
      message: 'Shop nicht verfügbar'
    })

    // 1. Manuell geschlossen
    if (settings.manual_close) {
      return res.status(200).json({
        isOpen: false, isPreorder: false,
        delivery: { isOpen: false, openFrom: '', openUntil: '' },
        pickup:   { isOpen: false, openFrom: '', openUntil: '' },
        message: settings.close_message || 'Der Shop ist momentan geschlossen.'
      })
    }

    const { dateStr: todayStr, day: berlinDay } = getNowBerlin()

    // 2. Sondertag prüfen
    const { data: specialDay } = await supabase
      .from('special_hours').select('*').eq('date', todayStr).maybeSingle()

    const getHours = (day: any) => {
      if (!day) return null
      const dClosed = day.delivery_closed ?? day.is_closed ?? true
      const pClosed = day.pickup_closed   ?? day.is_closed ?? true
      const dFrom   = day.delivery_open   || day.custom_open  || '14:00'
      const dUntil  = day.delivery_close  || day.custom_close || '18:30'
      const pFrom   = day.pickup_open     || day.custom_open  || '10:00'
      const pUntil  = day.pickup_close    || day.custom_close || '18:30'
      return { dClosed, pClosed, dFrom, dUntil, pFrom, pUntil }
    }

    const buildResponse = (h: any, label?: string) => {
      const deliveryOpen = !h.dClosed && isNowBetween(h.dFrom, h.dUntil)
      const pickupOpen   = !h.pClosed && isNowBetween(h.pFrom, h.pUntil)
      const anyOpen      = deliveryOpen || pickupOpen

      let isPreorder = false, preorderHint = ''
      if (!anyOpen && settings.preorder_enabled && !h.dClosed) {
        const ph = settings.preorder_start_hour || 10
        const { hours: nowH } = getNowBerlin()
        if (nowH >= ph) {
          isPreorder = true
          preorderHint = (settings.preorder_hint || 'Vorbestellung möglich – Lieferung ab {from} Uhr.').replace('{from}', h.dFrom)
        }
      }

      return {
        isOpen: anyOpen || isPreorder, isPreorder, preorderHint,
        delivery: { isOpen: deliveryOpen, openFrom: h.dClosed ? '' : h.dFrom, openUntil: h.dClosed ? '' : h.dUntil },
        pickup:   { isOpen: pickupOpen,   openFrom: h.pClosed ? '' : h.pFrom, openUntil: h.pClosed ? '' : h.pUntil },
        openFrom: h.dFrom, openUntil: h.dUntil,
        message: label || '',
      }
    }

    if (specialDay) {
      const h = getHours(specialDay)
      return res.status(200).json(buildResponse(h!, specialDay.label ? `Sonderöffnungszeiten: ${specialDay.label}` : ''))
    }

    // 3. Reguläre Öffnungszeiten
    const dayKey = DAY_KEYS[berlinDay]
    const raw    = settings.opening_hours?.[dayKey]

    let h: any
    if (!raw) {
      h = { dClosed: true, pClosed: true, dFrom: '14:00', dUntil: '18:30', pFrom: '10:00', pUntil: '18:30' }
    } else if (raw.delivery) {
      // Neues Format
      h = {
        dClosed: raw.delivery.closed ?? false, dFrom: raw.delivery.open || '14:00', dUntil: raw.delivery.close || '18:30',
        pClosed: raw.pickup?.closed  ?? false, pFrom: raw.pickup?.open  || '10:00', pUntil: raw.pickup?.close  || '18:30',
      }
    } else {
      // Altes Format
      h = {
        dClosed: raw.closed ?? false, dFrom: raw.open || '14:00', dUntil: raw.close || '18:30',
        pClosed: raw.closed ?? false, pFrom: raw.open || '10:00', pUntil: raw.close || '18:30',
      }
    }

    return res.status(200).json(buildResponse(h))

  } catch (e: any) {
    console.error('shop-status error:', e)
    return res.status(500).json({ isOpen: false, isPreorder: false, message: 'Fehler beim Laden' })
  }
}