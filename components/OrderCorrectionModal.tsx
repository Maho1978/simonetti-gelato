import { useMemo, useState } from 'react'
import { Minus, X, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Item = {
  name?: string
  productName?: string
  price?: number
  quantity: number
  totalPrice?: number
  selectedExtras?: Array<{ name?: string } | string>
  selectedFlavors?: string[]
  [k: string]: any
}

type Order = {
  id: string
  order_number?: string
  customer_name?: string
  payment_method?: string
  payment_intent_id?: string
  items?: Item[]
  total?: number
  subtotal?: number
  delivery_fee?: number
  tip?: number
  discount?: number
  correction_log?: any[]
  [k: string]: any
}

function detectPaymentKind(order: Order): 'cash' | 'paypal' | 'stripe' {
  if (order.payment_method === 'cash' || order.payment_intent_id?.startsWith('cash-')) return 'cash'
  if (order.payment_method === 'paypal') return 'paypal'
  if (order.payment_intent_id && !order.payment_intent_id.startsWith('pi_') && !order.payment_intent_id.startsWith('cash-')) return 'paypal'
  return 'stripe'
}

function itemLabel(item: Item): string {
  const base = item.name || item.productName || 'Artikel'
  const extras = (item.selectedExtras || []).map(e => (typeof e === 'string' ? e : e?.name)).filter(Boolean).join(', ')
  return extras ? `${base} (${extras})` : base
}

function unitTotalPrice(item: Item): number {
  if (item.totalPrice && item.quantity > 0) return item.totalPrice / item.quantity
  return item.price || 0
}

export default function OrderCorrectionModal({
  order,
  onClose,
  onPrint,
  onRefreshed,
}: {
  order: Order
  onClose: () => void
  onPrint: (updatedOrder: Order) => void
  onRefreshed: () => void
}) {
  const original = useMemo(() => order.items || [], [order])
  const oldTotal = Number(order.total || 0)

  // Pro Index die neue Menge (Start = Original-Menge)
  const [newQty, setNewQty] = useState<number[]>(original.map(it => it.quantity || 0))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const paymentKind = detectPaymentKind(order)

  const newSubtotal = useMemo(
    () => original.reduce((sum, it, i) => sum + unitTotalPrice(it) * (newQty[i] ?? 0), 0),
    [original, newQty],
  )
  const deliveryFee = Number(order.delivery_fee || 0)
  const tip = Number(order.tip || 0)
  const discount = Number(order.discount || 0)
  const newTotal = +(newSubtotal + deliveryFee + tip - discount).toFixed(2)
  const refundAmount = +(oldTotal - newTotal).toFixed(2)
  const noChange = refundAmount <= 0
  const allRemoved = newQty.every(q => q <= 0)

  const dec = (i: number) =>
    setNewQty(q => q.map((v, idx) => (idx === i ? Math.max(0, v - 1) : v)))

  async function callRefund(): Promise<{ ok: boolean; error?: string }> {
    if (paymentKind === 'cash') return { ok: true }
    const { data: { session } } = await supabase.auth.getSession()
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    }
    if (paymentKind === 'stripe') {
      const r = await fetch('/api/refunds/stripe', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ orderId: order.id, amount: Math.round(refundAmount * 100) }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return { ok: false, error: data?.error || `Stripe Refund Fehler (${r.status})` }
      return { ok: true }
    }
    // paypal
    const r = await fetch('/api/refunds/paypal', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ orderId: order.id, amount: refundAmount.toFixed(2) }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, error: data?.error || `PayPal Refund Fehler (${r.status})` }
    return { ok: true }
  }

  async function handleSave() {
    setError(null)
    setWarning(null)
    if (noChange) {
      setError('Keine Änderung — bitte mindestens einen Artikel reduzieren oder Abbrechen.')
      return
    }
    if (paymentKind === 'cash') {
      const ok = window.confirm(`Bitte ${refundAmount.toFixed(2)} € BAR an den Kunden zurückgeben. Weiter?`)
      if (!ok) return
    }
    setSubmitting(true)

    // 1. Refund (Stripe/PayPal) — Cash überspringt
    const refundRes = await callRefund()
    if (!refundRes.ok) {
      setSubmitting(false)
      setError(refundRes.error || 'Refund fehlgeschlagen')
      return
    }

    // 2. Items + Total + correction_log speichern
    const updatedItems = original
      .map((it, i) => {
        const nq = newQty[i] ?? 0
        if (nq <= 0) return null
        const unit = unitTotalPrice(it)
        return { ...it, quantity: nq, totalPrice: +(unit * nq).toFixed(2) }
      })
      .filter(Boolean)

    const removedSummary = original
      .map((it, i) => {
        const removed = (it.quantity || 0) - (newQty[i] ?? 0)
        if (removed <= 0) return null
        return {
          name: itemLabel(it),
          removedQuantity: removed,
          refundAmount: +(unitTotalPrice(it) * removed).toFixed(2),
        }
      })
      .filter(Boolean)

    const correctionEntry = {
      date: new Date().toISOString(),
      removedItems: removedSummary,
      oldTotal,
      newTotal,
      refundAmount,
      refundMethod: paymentKind,
    }
    const newLog = Array.isArray(order.correction_log) ? [...order.correction_log, correctionEntry] : [correctionEntry]

    const patchRes = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: updatedItems,
        total: newTotal,
        subtotal: +newSubtotal.toFixed(2),
        correction_log: newLog,
      }),
    })

    if (!patchRes.ok) {
      setSubmitting(false)
      const data = await patchRes.json().catch(() => ({}))
      setWarning(
        `⚠️ Erstattung war erfolgreich (${refundAmount.toFixed(2)} €), aber Bestelldaten konnten nicht aktualisiert werden: ${data?.error || patchRes.status}. Bitte manuell prüfen.`,
      )
      return
    }

    // 3. Neuen Bon drucken
    const updatedOrder: Order = {
      ...order,
      items: updatedItems as Item[],
      total: newTotal,
      subtotal: +newSubtotal.toFixed(2),
      correction_log: newLog,
    }
    try { onPrint(updatedOrder) } catch {}

    setSubmitting(false)
    onRefreshed()
    onClose()
  }

  const orderNr = order.order_number || order.id?.slice(-6).toUpperCase()
  const paymentLabel = paymentKind === 'cash' ? '💵 Barzahlung' : paymentKind === 'paypal' ? '🅿️ PayPal' : '💳 Stripe/Klarna'
  const refundButtonLabel = paymentKind === 'cash'
    ? `Speichern & ${refundAmount.toFixed(2)} € bar zurückgeben`
    : `Speichern & ${refundAmount.toFixed(2)} € erstatten`

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget && !submitting) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="font-bold text-base">Bestellung korrigieren · #{orderNr}</h3>
          <button onClick={() => !submitting && onClose()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between text-sm">
          <div className="text-gray-700"><span className="font-semibold">{order.customer_name || '–'}</span></div>
          <div className="text-gray-600">{paymentLabel}</div>
        </div>

        <div className="px-5 py-3 flex-1 overflow-y-auto">
          {original.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-sm">Keine Artikel in dieser Bestellung.</div>
          ) : (
            <div className="space-y-2">
              {original.map((it, i) => {
                const unit = unitTotalPrice(it)
                const nq = newQty[i] ?? 0
                const removed = nq <= 0
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 ${
                      removed ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`flex-1 min-w-0 ${removed ? 'line-through text-red-600' : ''}`}>
                      <div className="font-semibold text-sm truncate">{itemLabel(it)}</div>
                      <div className="text-xs text-gray-500">{unit.toFixed(2)} € / Stück · ursprünglich {it.quantity}x</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => dec(i)}
                        disabled={nq <= 0 || submitting}
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-black disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Reduzieren"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-bold tabular-nums">{nq}x</span>
                      <span className="w-16 text-right text-sm font-semibold tabular-nums">
                        {(unit * nq).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Alter Gesamtbetrag</span>
            <span className="tabular-nums">{oldTotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900">
            <span>Neuer Gesamtbetrag</span>
            <span className="tabular-nums">{newTotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-base font-black text-green-700 pt-1 border-t border-gray-200">
            <span>Erstattung</span>
            <span className="tabular-nums">{refundAmount > 0 ? refundAmount.toFixed(2) : '0.00'} €</span>
          </div>
          {allRemoved && (
            <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              Alle Artikel entfernt. Liefergebühr/Trinkgeld bleiben — bei kompletter Stornierung manuell prüfen.
            </div>
          )}
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">{error}</div>
          )}
          {warning && (
            <div className="text-xs text-orange-800 bg-orange-50 border border-orange-300 rounded-lg px-2 py-1.5">{warning}</div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={submitting || noChange}
            className="flex-[2] py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {refundButtonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
