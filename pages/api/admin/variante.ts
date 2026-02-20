import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query

  if (req.method === 'GET') {
    // Get all variants for a product
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order')

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)

  } else if (req.method === 'POST') {
    // Create new variant
    const { name, price, sort_order } = req.body
    
    const { data, error } = await supabase
      .from('product_variants')
      .insert({ product_id: productId, name, price, sort_order, available: true })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)

  } else if (req.method === 'PUT') {
    // Update variant
    const { id, name, price, available } = req.body
    
    const { data, error } = await supabase
      .from('product_variants')
      .update({ name, price, available })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)

  } else if (req.method === 'DELETE') {
    // Delete variant
    const { id } = req.body
    
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })

  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
