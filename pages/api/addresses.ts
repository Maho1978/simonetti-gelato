import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      res.status(200).json({ addresses: data })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch addresses' })
    }
  } else if (req.method === 'POST') {
    try {
      const { label, name, street, zip, city, is_default } = req.body

      const { data, error } = await supabase
        .from('saved_addresses')
        .insert({
          user_id: user.id,
          label,
          name,
          street,
          zip,
          city,
          is_default: is_default || false,
        })
        .select()
        .single()

      if (error) throw error

      res.status(200).json({ address: data })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to save address' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body

      const { data, error } = await supabase
        .from('saved_addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      res.status(200).json({ address: data })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update address' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query

      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      res.status(200).json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete address' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
