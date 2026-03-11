import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

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
