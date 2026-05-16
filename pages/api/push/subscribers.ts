import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export interface PushSubscriber {
  user_id: string;
  token: string;
  name: string;
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data: tokens, error } = await supabaseAdmin
    .from('push_tokens')
    .select('user_id, token')
    .not('token', 'is', null);

  if (error) return res.status(500).json({ error: error.message });
  if (!tokens || tokens.length === 0) return res.status(200).json({ subscribers: [] });

  const userIds = tokens.map((t: any) => t.user_id).filter(Boolean);

  const { data: customers } = await supabaseAdmin
    .from('customers')
    .select('user_id, email, full_name')
    .in('user_id', userIds);

  const customerMap: Record<string, { email: string; full_name: string }> = {};
  (customers || []).forEach((c: any) => { customerMap[c.user_id] = c; });

  const subscribers: PushSubscriber[] = tokens.map((t: any) => ({
    user_id: t.user_id,
    token: t.token,
    name: customerMap[t.user_id]?.full_name || 'Unbekannt',
    email: customerMap[t.user_id]?.email || '',
  }));

  return res.status(200).json({ subscribers });
}
