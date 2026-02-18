import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true })

      if (error) throw error

      res.status(200).json({ products: data })
    } catch (error) {
      console.error('Error fetching products:', error)
      res.status(500).json({ error: 'Failed to fetch products' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
