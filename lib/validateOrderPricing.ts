import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Serverseitige Preis-Untergrenze gegen manipulierte Order-Totals.
 *
 * Konservativ & false-positive-sicher: die Untergrenze ist die Summe der
 * DB-Basispreise (products.price × Menge) minus dem serverseitig validierten
 * Voucher-Rabatt. Extras, Sorten-Aufpreise, Liefergebühr und Trinkgeld erhöhen
 * den Endbetrag nur — daher liegt jede LEGITIME Bestellung über der Grenze.
 *
 * Blockiert damit „billige Bestellung für teure Artikel" (Client setzt total
 * z.B. auf 0,50 € für 50 € Ware). Unbekannte Produkte (gelöscht) fallen auf den
 * Client-Preis zurück; bei jedem unerwarteten Fehler wird fail-open geantwortet,
 * damit der Checkout niemals durch diese Prüfung bricht.
 */
export async function checkOrderFloor(params: {
  items: any[]
  subtotal?: number
  total: number
  voucherCode?: string | null
}): Promise<{ ok: boolean; floor?: number; baseSum?: number; discount?: number }> {
  try {
    const { items, subtotal, total, voucherCode } = params
    const ids = (items || []).map((it) => it?.id).filter(Boolean)

    let baseSum = 0
    if (ids.length > 0) {
      const { data: dbProducts } = await supabaseAdmin
        .from('products')
        .select('id, price')
        .in('id', ids)
      const priceMap = new Map((dbProducts || []).map((p: any) => [p.id, Number(p.price)]))
      for (const it of items || []) {
        const dbPrice = priceMap.get(it?.id)
        const unit = dbPrice != null ? dbPrice : Number(it?.price) || 0
        baseSum += unit * (Number(it?.quantity) || 0)
      }
    } else {
      baseSum = Number(subtotal) || 0
    }

    let discount = 0
    if (voucherCode) {
      const { data: v } = await supabaseAdmin.rpc('validate_voucher', {
        p_code: String(voucherCode).toUpperCase(),
        p_order_value: Number(subtotal) || baseSum,
      })
      if (v && v[0]?.valid) discount = Number(v[0].discount_amount) || 0
    }

    const floor = +(baseSum - discount).toFixed(2)
    if (Number(total) < floor - 0.02) return { ok: false, floor, baseSum, discount }
    return { ok: true, floor, baseSum, discount }
  } catch (e) {
    console.error('checkOrderFloor Fehler (fail-open):', e)
    return { ok: true }
  }
}
