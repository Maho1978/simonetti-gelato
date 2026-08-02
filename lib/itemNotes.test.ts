import fs from 'fs'
import path from 'path'

// Regressionstest zu Marios Frage vom 02.08.2026: "Kunde schreibt ohne Sahne xy".
//
// Im Warenkorb (components/MiniCart.tsx) kann pro Artikel eine Anmerkung erfasst
// werden ("ohne Sahne", "weniger suess"). Diese landet als `notes` im items-JSONB.
// Sie wurde aber WEDER auf dem Bon, NOCH im Kanban, NOCH in Mail/Telegram
// ausgegeben - der Wunsch erreichte die Kueche nie.
//
// Die Ausgabestellen sind teils HTML-Strings (Bon, Mail, Telegram) und damit nicht
// sinnvoll per Render-Test pruefbar. Deshalb wird hier verifiziert, dass jede
// Ausgabestelle die Artikel-Anmerkung ueberhaupt verarbeitet. Faellt jemand darauf
// zurueck, nur order.notes auszugeben, wird dieser Test rot.

const repo = path.join(__dirname, '..')
const read = (p: string) => fs.readFileSync(path.join(repo, p), 'utf8')

describe('Artikel-Anmerkung ("ohne Sahne") erreicht alle Ausgabekanaele', () => {
  it('Bon aus dem Kanban druckt item.notes', () => {
    const src = read('pages/admin/kanban.tsx')
    // im Druck-HTML (printOrder) muss die Artikel-Notiz eine eigene Zeile bekommen
    expect(src).toMatch(/item\.notes/)
    expect(src).toContain('item-note')
  })

  it('Kanban zeigt item.notes auf dem Bildschirm', () => {
    const src = read('pages/admin/kanban.tsx')
    // mindestens zwei Stellen: Annahme-Popup und Detailansicht
    const treffer = src.match(/item\.notes/g) || []
    expect(treffer.length).toBeGreaterThanOrEqual(3)
  })

  it('Bestell-Mail enthaelt item.notes', () => {
    expect(read('pages/api/emails/send-order-notification.ts')).toMatch(/item\.notes/)
  })

  it('Telegram-Meldung enthaelt die Artikel-Anmerkung', () => {
    expect(read('pages/api/telegram/notify.ts')).toMatch(/i\.notes/)
  })

  it('Bon-Komponente (PrintOrder) enthaelt item.notes', () => {
    expect(read('components/PrintOrder.tsx')).toMatch(/item\.notes/)
  })

  it('Warenkorb bietet das Eingabefeld weiterhin an', () => {
    // Falls das Feld je entfernt wird, sind die Ausgabestellen obsolet - dann soll
    // dieser Test bewusst auffallen.
    expect(read('components/MiniCart.tsx')).toMatch(/onUpdateNotes/)
  })
})
