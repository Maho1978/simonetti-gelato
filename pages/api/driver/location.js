// ============================================================
// SIMONETTI BACKEND - pages/api/driver/location.js
// Fahrer-Position empfangen und speichern (upsert)
// ============================================================

import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// ── Auth-Check fuer GET: nur Admin darf Fahrer-Positionen abfragen ──
// War komplett ungeschuetzt - jeder, der eine driver_id kennt/raet, konnte die
// Live-Position abfragen. Gefunden bei Nachaudit 31.07.2026. Kunden-App nutzt
// direktes Supabase-Realtime auf driver_locations (eigene RLS), Fahrer-App nutzt
// nur POST/DELETE - kein legitimer Aufrufer braucht GET ohne Admin-Rechte.
async function requireAdmin(req, res) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth.slice(7))
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  const isAdmin = user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === 'admin'
  if (!isAdmin) {
    res.status(403).json({ error: 'Forbidden - Admin access required' })
    return false
  }
  return true
}

// ── Auth-Check: x-driver-id Header gegen drivers-Tabelle prüfen ──
async function requireAuthenticatedDriver(req, res) {
  const headerDriverId = req.headers['x-driver-id']
  if (!headerDriverId || typeof headerDriverId !== 'string') {
    res.status(401).json({ error: 'Authentication required: missing x-driver-id header' })
    return null
  }
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .select('id, is_active')
    .eq('id', headerDriverId)
    .maybeSingle()
  if (error || !data) {
    res.status(401).json({ error: 'Unknown driver' })
    return null
  }
  if (data.is_active === false) {
    res.status(403).json({ error: 'Driver inactive' })
    return null
  }
  return data.id
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const authDriverId = await requireAuthenticatedDriver(req, res)
    if (!authDriverId) return

    // ── Position speichern ──────────────────────────────────
    const { driver_id, latitude, longitude, accuracy, heading, speed, is_active } = req.body

    if (driver_id && driver_id !== authDriverId) {
      return res.status(403).json({ error: 'driver_id im Body stimmt nicht mit x-driver-id überein' })
    }

    if (!driver_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'driver_id, latitude und longitude sind erforderlich' })
    }

    const { error } = await supabaseAdmin
      .from('driver_locations')
      .upsert(
        {
          driver_id,
          latitude,
          longitude,
          accuracy:  accuracy  ?? null,
          heading:   heading   ?? null,
          speed:     speed     ?? null,
          is_active: is_active ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'driver_id' }
      )

    if (error) {
      console.error('Location update error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })

  } else if (req.method === 'GET') {
    // ── Position eines Fahrers abrufen (für Admin-Map) ──────
    if (!(await requireAdmin(req, res))) return

    const { driver_id } = req.query

    if (!driver_id) {
      return res.status(400).json({ error: 'driver_id erforderlich' })
    }

    const { data, error } = await supabaseAdmin
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driver_id)
      .single()

    if (error) {
      return res.status(404).json({ error: 'Keine Position gefunden' })
    }

    return res.status(200).json(data)

  } else if (req.method === 'DELETE') {
    const authDriverId = await requireAuthenticatedDriver(req, res)
    if (!authDriverId) return

    // ── Tracking deaktivieren (is_active = false) ───────────
    const { driver_id } = req.body

    if (driver_id && driver_id !== authDriverId) {
      return res.status(403).json({ error: 'driver_id im Body stimmt nicht mit x-driver-id überein' })
    }

    if (!driver_id) {
      return res.status(400).json({ error: 'driver_id erforderlich' })
    }

    const { error } = await supabaseAdmin
      .from('driver_locations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('driver_id', driver_id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })

  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
}