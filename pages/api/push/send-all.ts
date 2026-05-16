import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100; // Expo erlaubt max 100 pro Request

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, body, user_ids } = req.body;
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Titel und Nachricht erforderlich' });
  }

  // Push Tokens laden — optional auf bestimmte user_ids einschränken
  let query = supabaseAdmin.from('push_tokens').select('token').not('token', 'is', null);
  if (Array.isArray(user_ids) && user_ids.length > 0) {
    query = query.in('user_id', user_ids);
  }
  const { data: rows, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  const tokens = (rows || [])
    .map((r: any) => r.token as string)
    .filter(Boolean);

  if (tokens.length === 0) {
    return res.status(200).json({ ok: true, sent: 0, failed: 0, message: 'Keine Push Tokens vorhanden' });
  }

  // In Batches à 100 senden
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE).map(token => ({
      to: token,
      title,
      body,
      sound: 'default',
      priority: 'high',
      channelId: 'orders',
    }));

    try {
      const expRes = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });

      const data = await expRes.json();
      const results: any[] = Array.isArray(data.data) ? data.data : [];

      results.forEach(r => {
        if (r.status === 'ok') sent++;
        else failed++;
      });

      // Falls keine results (einzelner Token ohne Array): zähle batch size
      if (results.length === 0 && expRes.ok) sent += batch.length;
    } catch {
      failed += batch.length;
    }

    // Kurze Pause zwischen Batches
    if (i + BATCH_SIZE < tokens.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return res.status(200).json({ ok: true, sent, failed, total: tokens.length });
}
