// Entscheidet, was im Kanban als Arbeit fuer die Kueche sichtbar ist.
//
// Hintergrund (02.08.2026): Bestellungen mit Status AUSSTEHEND sind Platzhalter,
// die VOR der Zahlung angelegt werden (Stripe, PayPal, Apple/Google Pay), damit bei
// einem Browser-Abbruch nach der Zahlung kein Geld ohne Bestellung dasteht. Solange
// nicht bezahlt wurde, ist das aber nur ein laufender oder abgebrochener Zahlungs-
// versuch - KEINE Bestellung. Das Kanban hat sie trotzdem in die Spalte
// "In Bearbeitung" gelegt und Alarm ausgeloest, worauf Personal zweimal dasselbe
// zubereitet hat (SIM-2026-9410/3273, SIM-2026-3528/1408).
//
// Diese Regeln liegen bewusst hier statt inline im Kanban, damit sie durch Tests
// abgesichert sind (siehe orderVisibility.test.ts).

export interface OrderLike {
  status?: string | null
  payment_status?: string | null
  payment_method?: string | null
}

export interface AlarmOrder extends OrderLike {
  id: string
  created_at?: string | null
}

/**
 * Ein unbezahlter AUSSTEHEND-Platzhalter ist kein echter Auftrag.
 *
 * Wichtig: Barzahlung ist davon NICHT betroffen. Bar-Bestellungen werden als
 * OFFEN mit payment_status 'pending' angelegt (checkout.tsx -> saveOrder), weil
 * der Kunde erst bei der Uebergabe zahlt. Nur AUSSTEHEND ist der Platzhalter.
 */
export function istUnbezahlterZahlungsversuch(order: OrderLike): boolean {
  return order.status === 'AUSSTEHEND' && order.payment_status !== 'paid'
}

/**
 * Zielspalte im Kanban - oder null, wenn die Bestellung gar nicht angezeigt
 * werden darf.
 */
export function kanbanSpalte(order: OrderLike): string | null {
  if (istUnbezahlterZahlungsversuch(order)) return null
  const s = order.status
  return s === 'AUSSTEHEND' || s === 'OFFEN' ? 'IN_BEARBEITUNG' : s || 'IN_BEARBEITUNG'
}

/**
 * Soll fuer diese neu eingegangene Bestellung Alarmton + Popup ausgeloest werden?
 * Nur fuer echte Bestellungen - ein unbezahlter Zahlungsversuch hat bisher das
 * Personal auf eine Phantom-Bestellung aufmerksam gemacht.
 */
export function loestAlarmAus(order: OrderLike): boolean {
  return order.status === 'OFFEN' || (order.status === 'AUSSTEHEND' && order.payment_status === 'paid')
}

/** Nach dieser Zeit ohne Annahme schlaegt eine offene Bestellung erneut Alarm. */
export const ERINNERUNG_NACH_MS = 3 * 60 * 1000

/**
 * Welche Bestellungen sollen bei diesem Ladevorgang Popup + Ton ausloesen?
 *
 * Zwei Faelle:
 *  1. Neu — noch nie gesehen (weder im laufenden Polling noch vor einem Neuladen).
 *  2. Wiedervorlage — laengst gesehen, aber immer noch nicht angenommen. Ohne das
 *     bleibt eine einmal weggeklickte oder waehrend eines Tab-Neuladens verpasste
 *     Bestellung fuer immer still liegen (Vorfall SIM-2026-5473, 05.08.2026:
 *     Bestellung kam 14:44, Telegram lief, im Café hat sie niemand gesehen).
 *
 * Bewusst KEINE Alters-Obergrenze: frueher galt beim ersten Laden eine 10-Minuten-
 * Frist, die genau diese Bestellung verschluckt hat. Massgeblich ist allein, ob sie
 * noch unbearbeitet ist.
 */
export function zuAlarmierendeBestellungen<T extends AlarmOrder>(
  orders: T[],
  opts: {
    bekannteIds: Set<string>
    zuletztErinnert: Map<string, number>
    jetzt: number
  }
): T[] {
  const { bekannteIds, zuletztErinnert, jetzt } = opts
  return orders.filter((o) => {
    if (!loestAlarmAus(o)) return false
    if (!bekannteIds.has(o.id)) return true

    const zuletzt = zuletztErinnert.get(o.id) ?? new Date(o.created_at || 0).getTime()
    return jetzt - zuletzt >= ERINNERUNG_NACH_MS
  })
}
