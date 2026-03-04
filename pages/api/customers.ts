import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET: Alle Kunden laden ────────────────────────────────
  if (req.method === 'GET') {
    const [ordersRes, notesRes] = await Promise.all([
      supabase.from('orders').select('*').not('customer_email', 'is', null).order('created_at', { ascending: false }),
      supabase.from('customer_notes').select('*').order('created_at', { ascending: false }),
    ])

    if (ordersRes.error) return res.status(500).json({ error: ordersRes.error.message })

    const orders   = ordersRes.data  || []
    const notes    = notesRes.data   || []

    const customerMap: Record<string, any> = {}

    for (const order of orders) {
      const email = order.customer_email
      if (!email) continue

      if (!customerMap[email]) {
        customerMap[email] = {
          email,
          name:       order.customer_name  || '–',
          phone:      order.customer_phone || '',
          orders:     [],
          notes:      [],
          totalSpent: 0,
          orderCount: 0,
          lastOrder:  null,
        }
      }

      const c = customerMap[email]
      c.orders.push(order)

      if (order.status === 'GELIEFERT') {
        c.totalSpent += order.total || 0
        c.orderCount++
      }

      if (!c.lastOrder || new Date(order.created_at) > new Date(c.lastOrder)) {
        c.lastOrder = order.created_at
      }

      if (order.customer_name && order.customer_name !== '–') c.name  = order.customer_name
      if (order.customer_phone)                                c.phone = order.customer_phone
    }

    for (const note of notes) {
      if (customerMap[note.customer_email]) {
        customerMap[note.customer_email].notes.push({
          id:         note.id,
          text:       note.note,
          created_at: note.created_at,
        })
      }
    }

    return res.status(200).json({ customers: Object.values(customerMap) })
  }

  // ── POST: Notiz hinzufügen ────────────────────────────────
  if (req.method === 'POST') {
    const { action, email, note, noteId, name, phone } = req.body

    if (action === 'add_note') {
      const { error } = await supabase.from('customer_notes').insert({ customer_email: email, note })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }

    if (action === 'delete_note') {
      const { error } = await supabase.from('customer_notes').delete().eq('id', noteId)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }

    if (action === 'delete_customer') {
      await supabase.from('customer_notes').delete().eq('customer_email', email)
      return res.status(200).json({ ok: true })
    }

    if (action === 'update_customer') {
      const { error } = await supabase.from('orders')
        .update({ customer_name: name, customer_phone: phone })
        .eq('customer_email', email)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Unknown action' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}