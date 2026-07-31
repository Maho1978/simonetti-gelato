import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// War komplett offen: jeder konnte beliebige Titel/Texte an einen beliebigen
// Expo-Push-Token schicken (offenes Relais, gleiches Muster wie das frueher
// gefixte /api/campaigns/send). Kein Aufrufer im Code gefunden - Admin-Auth
// ergaenzt statt der Route weiter offen zu lassen. Nachaudit 31.07.2026.
async function verifyAdmin(req: NextApiRequest): Promise<boolean> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return false
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth.slice(7))
  if (error || !user) return false
  return user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === 'admin'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  const { pushToken, title, body, orderId } = req.body;
  if (!pushToken || !title) return res.status(400).json({ error: 'Missing fields' });

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        sound: 'default',
        priority: 'high',
        channelId: 'orders',
        data: { orderId },
      }),
    });
    const data = await response.json();
    return res.json({ ok: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
