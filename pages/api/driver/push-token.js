// ============================================================
// SIMONETTI BACKEND - pages/api/driver/push-token.js
// Push Token vom Fahrer speichern
// ============================================================

import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { driver_id, push_token } = req.body

  if (!driver_id || !push_token) {
    return res.status(400).json({ error: 'driver_id und push_token erforderlich' })
  }

  const { error } = await supabaseAdmin
    .from('drivers')
    .update({ push_token })
    .eq('id', driver_id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}