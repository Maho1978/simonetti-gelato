import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  IN_BEARBEITUNG: { title: '👨‍🍳 Wird zubereitet!', body: 'Deine Bestellung ist in der Küche. Gleich ist es soweit!' },
  BEREIT:         { title: '✅ Fertig & verpackt!', body: 'Dein Eis ist fertig und wartet auf den Fahrer.' },
  UNTERWEGS:      { title: '🚴 Unterwegs zu dir!', body: 'Dein Fahrer ist auf dem Weg. Gleich klingelt es!' },
  GELIEFERT:      { title: '🍦 Geliefert! Guten Appetit!', body: 'Deine Bestellung wurde geliefert. Genieß dein Eis!' },
  STORNIERT:      { title: '❌ Bestellung storniert', body: 'Leider musste deine Bestellung storniert werden. Ruf uns an!' },
};

async function sendPushNotification(pushToken: string, title: string, body: string, orderId: string) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      body: JSON.stringify({ to: pushToken, title, body, sound: 'default', priority: 'high', channelId: 'orders', data: { orderId } }),
    });
  } catch (e) {
    console.error('Push error:', e);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query
  const updateData = req.body
  if (!id) return res.status(400).json({ error: 'Missing order id' })

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id as string)
    .select('*, user:user_id(push_token), guest_email, customer_name')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Push Notification bei Statuswechsel
  if (updateData.status && STATUS_MESSAGES[updateData.status]) {
    const { title, body } = STATUS_MESSAGES[updateData.status];
    const pushToken = data.user?.push_token;
    if (pushToken) {
      await sendPushNotification(pushToken, title, body, id as string);
    }
  }

  return res.status(200).json(data)
}
