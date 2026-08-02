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
