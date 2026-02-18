import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get user from auth header
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq('user_id', user.id)

      if (error) throw error

      res.status(200).json({ favorites: data })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch favorites' })
    }
  } else if (req.method === 'POST') {
    try {
      const { product_id } = req.body

      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          product_id,
        })
        .select()
        .single()

      if (error) throw error

      res.status(200).json({ favorite: data })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to add favorite' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { product_id } = req.query

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product_id)

      if (error) throw error

      res.status(200).json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to remove favorite' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
