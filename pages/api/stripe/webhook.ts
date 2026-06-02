// DEPRECATED — dieser Endpunkt ist außer Betrieb.
// Aktiver Webhook: /api/webhooks/stripe (API v2024, korrektes Fehlerhandling)
// Falls Stripe noch diese URL nutzt, antwortet er mit 200 ohne Verarbeitung.
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = { api: { bodyParser: false } }

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ received: true, deprecated: true })
}
