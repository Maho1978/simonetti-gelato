import {
  kanbanSpalte,
  loestAlarmAus,
  istUnbezahlterZahlungsversuch,
  zuAlarmierendeBestellungen,
  ERINNERUNG_NACH_MS,
} from './orderVisibility'

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

// Regressionstests zum Vorfall SIM-2026-5473 (05.08.2026): Bestellung kam 14:44,
// Telegram lief korrekt, aber im Kanban blieb Popup + Ton aus — eine 10-Minuten-
// Frist beim Seitenaufruf hatte die Bestellung stillschweigend unterdrückt.
describe('Popup-/Ton-Alarm im Kanban', () => {
  const jetzt = new Date('2026-08-05T15:00:00Z').getTime()
  const offeneBestellung = (id: string, minutenAlt: number) => ({
    id,
    status: 'OFFEN',
    payment_status: 'paid',
    payment_method: 'paypal',
    created_at: new Date(jetzt - minutenAlt * 60 * 1000).toISOString(),
  })

  const leer = () => ({ bekannteIds: new Set<string>(), zuletztErinnert: new Map<string, number>(), jetzt })

  it('alarmiert eine neue Bestellung', () => {
    const orders = [offeneBestellung('a', 0)]
    expect(zuAlarmierendeBestellungen(orders, leer()).map(o => o.id)).toEqual(['a'])
  })

  it('alarmiert eine noch offene Bestellung auch, wenn sie beim Laden schon alt ist', () => {
    // Kern des Vorfalls: Tab wurde neu geladen, Bestellung war da schon >10 Min alt.
    const orders = [offeneBestellung('alt', 42)]
    expect(zuAlarmierendeBestellungen(orders, leer()).map(o => o.id)).toEqual(['alt'])
  })

  it('alarmiert eine bereits gesehene Bestellung nicht sofort erneut', () => {
    const orders = [offeneBestellung('a', 5)]
    const opts = {
      bekannteIds: new Set(['a']),
      zuletztErinnert: new Map([['a', jetzt - 30 * 1000]]),
      jetzt,
    }
    expect(zuAlarmierendeBestellungen(orders, opts)).toEqual([])
  })

  it('erinnert erneut, wenn eine offene Bestellung zu lange unangenommen liegt', () => {
    // Sicherheitsnetz: einmal weggeklickt oder übersehen darf nicht "für immer still".
    const orders = [offeneBestellung('vergessen', 30)]
    const opts = {
      bekannteIds: new Set(['vergessen']),
      zuletztErinnert: new Map([['vergessen', jetzt - ERINNERUNG_NACH_MS - 1000]]),
      jetzt,
    }
    expect(zuAlarmierendeBestellungen(orders, opts).map(o => o.id)).toEqual(['vergessen'])
  })

  it('erinnert NICHT mehr, sobald die Bestellung angenommen wurde', () => {
    const orders = [{ ...offeneBestellung('angenommen', 30), status: 'IN_BEARBEITUNG' }]
    const opts = {
      bekannteIds: new Set(['angenommen']),
      zuletztErinnert: new Map([['angenommen', jetzt - ERINNERUNG_NACH_MS - 1000]]),
      jetzt,
    }
    expect(zuAlarmierendeBestellungen(orders, opts)).toEqual([])
  })

  it('alarmiert nie für unbezahlte Zahlungsversuche', () => {
    const orders = [{ id: 'phantom', status: 'AUSSTEHEND', payment_status: 'pending', created_at: new Date(jetzt).toISOString() }]
    expect(zuAlarmierendeBestellungen(orders, leer())).toEqual([])
  })
})
