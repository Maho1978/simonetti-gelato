// pages/api/features/reviews.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data } = await supabase
    .from('feature_toggles')
    .select('enabled')
    .eq('id', 'reviews')
    .single()

  return res.status(200).json({ enabled: data?.enabled ?? false })
}