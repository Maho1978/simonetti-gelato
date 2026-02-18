import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify admin access
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const isAdmin = user.email === process.env.ADMIN_EMAIL || 
                  user.user_metadata?.role === 'admin'

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Handle different methods
  if (req.method === 'POST') {
    try {
      const { name, description, price, category, icon } = req.body

      const { data, error } = await supabaseAdmin
        .from('products')
        .insert({
          name,
          description,
          price,
          category,
          icon,
          available: true,
        })
        .select()
        .single()

      if (error) throw error

      res.status(200).json({ product: data })
    } catch (error: any) {
      console.error('Error creating product:', error)
      res.status(500).json({ error: error.message || 'Failed to create product' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body

      const { data, error } = await supabaseAdmin
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      res.status(200).json({ product: data })
    } catch (error: any) {
      console.error('Error updating product:', error)
      res.status(500).json({ error: error.message || 'Failed to update product' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query

      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      res.status(200).json({ success: true })
    } catch (error: any) {
      console.error('Error deleting product:', error)
      res.status(500).json({ error: error.message || 'Failed to delete product' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
