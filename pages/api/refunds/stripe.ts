import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function verifyAdmin(req: NextApiRequest): Promise<boolean> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return false
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth.slice(7))
  if (error || !user) return false
  return user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === 'admin'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!await verifyAdmin(req)) return res.status(403).json({ error: 'Forbidden' })

  const { orderId, amount } = req.body as { orderId?: string; amount?: number }

  if (!orderId) return res.status(400).json({ error: 'orderId fehlt' })
  if (!amount || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount (Cent) muss positive Zahl > 0 sein' })
  }

  const { data: order, error: dbErr } = await supabaseAdmin
    .from('orders')
    .select('id, payment_intent_id, payment_method, total, refund_amount')
    .eq('id', orderId)
    .single()

  if (dbErr || !order) return res.status(404).json({ error: 'Bestellung nicht gefunden' })

  const pi = order.payment_intent_id
  if (!pi || !pi.startsWith('pi_')) {
    return res.status(422).json({
      error: 'Keine gültige Stripe PaymentIntent-ID auf dieser Bestellung. Manuell im Stripe-Dashboard erstatten.',
    })
  }

  const previous = Number(order.refund_amount) || 0

  try {
    // Idempotency-Key deterministisch aus orderId + bisher erstattet + Betrag:
    // blockiert exakte Doppel-Erstattung (Netzwerk-Retry/Doppelklick) für 24h,
    // erlaubt aber legitime spätere Teilerstattungen (anderer "previous"-Stand).
    const idempotencyKey = `refund_${orderId}_${previous}_${Math.round(amount)}`
    const refund = await stripe.refunds.create(
      {
        payment_intent: pi,
        amount: Math.round(amount),
      },
      { idempotencyKey },
    )

    const refundEur = Math.round(amount) / 100
    const newTotal = previous + refundEur

    await supabaseAdmin
      .from('orders')
      .update({
        refund_amount: newTotal,
        refund_date: new Date().toISOString(),
      })
      .eq('id', orderId)

    return res.status(200).json({
      ok: true,
      refundId: refund.id,
      status: refund.status,
      amountRefunded: refundEur,
      totalRefunded: newTotal,
    })
  } catch (err: any) {
    console.error('Stripe refund error:', err)
    return res.status(502).json({
      error: err?.message || 'Stripe Refund fehlgeschlagen',
      code: err?.code,
    })
  }
}
