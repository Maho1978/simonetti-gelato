import { kanbanSpalte, loestAlarmAus, istUnbezahlterZahlungsversuch } from './orderVisibility'

// Regressionstest zu den doppelt zubereiteten Bestellungen vom 31.07./02.08.2026.
// Wenn ein kuenftiger Umbau unbezahlte Platzhalter-Orders wieder als Kuechen-Arbeit
// anzeigt, muss dieser Test rot werden.

describe('Kanban-Sichtbarkeit', () => {
  describe('unbezahlte Platzhalter duerfen NIE Arbeit sein', () => {
    const platzhalter = [
      ['PayPal geklickt, nicht bezahlt', { status: 'AUSSTEHEND', payment_status: 'pending', payment_method: 'paypal' }],
      ['Karte begonnen, abgebrochen', { status: 'AUSSTEHEND', payment_status: 'pending', payment_method: 'stripe' }],
      ['Apple Pay abgebrochen', { status: 'AUSSTEHEND', payment_status: 'pending', payment_method: 'stripe' }],
      ['Betrag manipuliert', { status: 'AUSSTEHEND', payment_status: 'amount_mismatch', payment_method: 'card' }],
      ['Zahlungsstatus fehlt', { status: 'AUSSTEHEND', payment_status: null, payment_method: 'paypal' }],
    ] as const

    it.each(platzhalter)('%s: nicht sichtbar, kein Alarm', (_name, order) => {
      expect(istUnbezahlterZahlungsversuch(order)).toBe(true)
      expect(kanbanSpalte(order)).toBeNull()
      expect(loestAlarmAus(order)).toBe(false)
    })
  })

  describe('echte Bestellungen bleiben sichtbar', () => {
    // Barzahlung ist der kritischste Fall: payment_status bleibt bis zur Uebergabe
    // 'pending'. Wird sie faelschlich als unbezahlt gefiltert, verschwinden echte
    // Auftraege aus der Kueche.
    const echte = [
      ['Barzahlung (zahlt bei Uebergabe)', { status: 'OFFEN', payment_status: 'pending', payment_method: 'cash' }],
      ['Karte bezahlt', { status: 'OFFEN', payment_status: 'paid', payment_method: 'card' }],
      ['PayPal bezahlt', { status: 'OFFEN', payment_status: 'paid', payment_method: 'paypal' }],
      ['bezahlt, Webhook noch unterwegs', { status: 'AUSSTEHEND', payment_status: 'paid', payment_method: 'paypal' }],
    ] as const

    it.each(echte)('%s: sichtbar in IN_BEARBEITUNG mit Alarm', (_name, order) => {
      expect(istUnbezahlterZahlungsversuch(order)).toBe(false)
      expect(kanbanSpalte(order)).toBe('IN_BEARBEITUNG')
      expect(loestAlarmAus(order)).toBe(true)
    })
  })

  describe('laufende Bestellungen behalten ihre Spalte, ohne erneuten Alarm', () => {
    const laufend = [
      ['In Bearbeitung', { status: 'IN_BEARBEITUNG', payment_status: 'paid' }, 'IN_BEARBEITUNG'],
      ['Beim Fahrer', { status: 'AN_FAHRER', payment_status: 'paid' }, 'AN_FAHRER'],
      ['Geliefert', { status: 'GELIEFERT', payment_status: 'paid' }, 'GELIEFERT'],
      ['Bar unterwegs (noch nicht kassiert)', { status: 'AN_FAHRER', payment_status: 'pending' }, 'AN_FAHRER'],
    ] as const

    it.each(laufend)('%s -> %s', (_name, order, spalte) => {
      expect(kanbanSpalte(order)).toBe(spalte)
      expect(loestAlarmAus(order)).toBe(false)
    })
  })
})
