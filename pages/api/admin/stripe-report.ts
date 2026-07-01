import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

async function allPages<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = []
  for await (const item of iter) items.push(item)
  return items
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const isAdmin = user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === 'admin'
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const { month } = req.query // e.g. "2026-06"
  if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Ungültiger Monat. Format: YYYY-MM' })
  }

  const [year, mon] = month.split('-').map(Number)
  const fromTs  = Math.floor(new Date(year, mon - 1, 1).getTime() / 1000)
  const toTs    = Math.floor(new Date(year, mon, 1).getTime() / 1000)
  const fromISO = new Date(year, mon - 1, 1).toISOString()
  const toISO   = new Date(year, mon, 1).toISOString()

  try {
    const [charges, refunds, balTxs, payouts, paypalResult] = await Promise.all([
      allPages(stripe.charges.list({ created: { gte: fromTs, lt: toTs }, limit: 100 })),
      allPages(stripe.refunds.list({ created: { gte: fromTs, lt: toTs }, limit: 100 })),
      allPages(stripe.balanceTransactions.list({ created: { gte: fromTs, lt: toTs }, limit: 100, type: 'charge' })),
      allPages(stripe.payouts.list({ arrival_date: { gte: fromTs, lt: toTs }, limit: 100 })),
      supabaseAdmin
        .from('orders')
        .select('id, total, created_at, payment_status')
        .eq('payment_method', 'paypal')
        .eq('payment_status', 'paid')
        .gte('paid_at', fromISO)
        .lt('paid_at', toISO),
    ])

    const succeeded = charges.filter(c => c.status === 'succeeded')
    const totalFees = balTxs.reduce((s, tx) => s + tx.fee, 0)
    const bruttoEinnahmen = succeeded.reduce((s, c) => s + c.amount, 0)
    const erstattungen    = refunds.reduce((s, r) => s + r.amount, 0)

    const methodMap: Record<string, { count: number; amount: number }> = {}
    for (const c of succeeded) {
      const m = (c.payment_method_details as any)?.type || 'unbekannt'
      if (!methodMap[m]) methodMap[m] = { count: 0, amount: 0 }
      methodMap[m].count++
      methodMap[m].amount += c.amount - (c.amount_refunded || 0)
    }

    const paypalOrders = paypalResult.data || []
    const paypalBrutto = Math.round(paypalOrders.reduce((s, o) => s + (o.total || 0), 0) * 100)

    res.status(200).json({
      month,
      stripe: {
        transactions: {
          total: succeeded.length,
          refunded: charges.filter(c => c.refunded).length,
          partialRefund: charges.filter(c => c.amount_refunded > 0 && !c.refunded).length,
        },
        amounts: {
          bruttoEinnahmen,
          erstattungen,
          nettoUmsatz: bruttoEinnahmen - erstattungen,
          stripeFees: totalFees,
          nettoNachGebuehren: bruttoEinnahmen - erstattungen - totalFees,
        },
        paymentMethods: Object.entries(methodMap)
          .map(([type, d]) => ({ type, ...d }))
          .sort((a, b) => b.amount - a.amount),
        payouts: payouts
          .filter(p => p.status === 'paid')
          .map(p => ({ date: p.arrival_date, amount: p.amount, description: p.description || 'Stripe Auszahlung' })),
      },
      paypal: {
        count: paypalOrders.length,
        bruttoEinnahmen: paypalBrutto,
      },
      gesamt: {
        bruttoEinnahmen: bruttoEinnahmen - erstattungen + paypalBrutto,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
