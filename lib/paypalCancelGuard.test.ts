import fs from 'fs'
import path from 'path'

// Regressionstest zu SIM-2026-6144 (02.08.2026, 23,40 EUR, nie bezahlt).
//
// Zwei Effekte im Checkout arbeiteten gegeneinander:
//  1. Ein Effekt stellt beim Laden der Seite die gemerkte PayPal-Order aus dem
//     sessionStorage wieder her (damit ein Retry keine zweite Order anlegt).
//  2. Ein Effekt storniert eine offene PayPal-Order, sobald die Zahlart nicht
//     mehr 'paypal' ist.
// useEffect feuert AUCH beim ersten Rendern, und die Standard-Zahlart ist
// 'stripe'. Also hat jedes Laden der Seite die gerade wiederhergestellte Order
// sofort storniert. Auf dem Handy nutzt PayPal eine Weiterleitung statt eines
// Popups -> beim Zurueckkommen wird die Seite neu aufgebaut -> Order war weg,
// bevor der Kunde zahlen konnte.
//
// Der Storno-Effekt MUSS den ersten Lauf ueberspringen.

const src = fs.readFileSync(path.join(__dirname, '..', 'pages', 'checkout.tsx'), 'utf8')

describe('PayPal-Storno darf nicht beim Laden der Seite feuern', () => {
  it('der Storno-Effekt hat eine Erst-Lauf-Sperre', () => {
    // Block des Effekts mit Abhaengigkeit [paymentMethod] herausschneiden
    const start = src.indexOf('cancelPendingPaypalOrder()\n    }\n  }, [paymentMethod])')
    expect(start).toBeGreaterThan(-1)
    const block = src.slice(Math.max(0, start - 900), start)
    // Vor dem Storno muss ein Guard-Ref geprueft und gesetzt werden
    expect(block).toMatch(/zahlartWechselGeprueft\.current/)
    expect(block).toMatch(/return/)
  })

  it('der Guard-Ref wird als useRef(false) angelegt', () => {
    expect(src).toMatch(/const zahlartWechselGeprueft = useRef\(false\)/)
  })

  it('die Wiederherstellung aus sessionStorage existiert weiterhin', () => {
    // Sonst legt ein Retry nach Reload wieder eine zweite Order an (der
    // urspruengliche Duplikat-Bug).
    expect(src).toMatch(/sessionStorage\.getItem\(PAYPAL_PENDING_KEY\)/)
  })

  it('onCancel des PayPal-Buttons storniert weiterhin', () => {
    // Popup bewusst geschlossen = echter Abbruch, das soll weiter stornieren.
    expect(src).toMatch(/onCancel=\{\(\) => cancelPendingPaypalOrder\(\)\}/)
  })
})

describe('45-Min.-Frist gegen Wiederverwendung geloeschter Orders', () => {
  // Kanban-Auto-Delete raeumt unbezahlte AUSSTEHEND-Orders nach 60 Min. weg.
  // Eine aeltere gemerkte Order-ID darf deshalb nie wiederverwendet werden -
  // die Zahlung kaeme sonst bei PayPal an, faende aber keine Bestellung mehr.

  it('Frist ist definiert und liegt unter den 60 Min. des Auto-Delete', () => {
    const m = src.match(/PAYPAL_PENDING_MAX_AGE_MS = (\d+) \* 60 \* 1000/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeLessThan(60)
  })

  it('Restore aus sessionStorage prueft die Frist und raeumt abgelaufene Eintraege weg', () => {
    expect(src).toMatch(/Date\.now\(\) - ts < PAYPAL_PENDING_MAX_AGE_MS/)
  })

  it('Wiederverwendung im createOrder-Callback prueft die Frist ebenfalls (Tab-offen-Fall, kein Reload)', () => {
    expect(src).toMatch(/paypalOrderTsRef\.current < PAYPAL_PENDING_MAX_AGE_MS|Date\.now\(\) - paypalOrderTsRef\.current < PAYPAL_PENDING_MAX_AGE_MS/)
  })

  it('ts wird bei Wiederverwendung NICHT aufgefrischt (sonst laeuft die Frist am Auto-Delete vorbei)', () => {
    // Nur bei NEU angelegter Order darf der Zeitstempel gesetzt werden.
    expect(src).toMatch(/if \(!reuse\) paypalOrderTsRef\.current = Date\.now\(\)/)
    // Persistiert wird der Anlage-Zeitstempel, nicht Date.now()
    expect(src).toMatch(/ts: paypalOrderTsRef\.current/)
  })

  it('order-success raeumt den gemerkten Eintrag nach JEDER erfolgreichen Bestellung ab', () => {
    const fs = require('fs'); const path = require('path')
    const success = fs.readFileSync(path.join(__dirname, '..', 'pages', 'order-success.tsx'), 'utf8')
    expect(success).toMatch(/removeItem\('simonetti-pending-paypal-order'\)/)
  })
})
