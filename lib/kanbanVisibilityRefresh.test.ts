import fs from 'fs'
import path from 'path'

// Regressionstest zum Vorfall vom 02.08.2026 abends: Mario hatte 3 Browser-
// Fenster nebeneinander offen (Home Assistant / Kanban / Lieferando). Eine
// neue Bestellung (71,50 EUR) kam rein, während das Kanban-Fenster nicht die
// aktive Auswahl war — kein Ton, kein Popup, erst nach manuellem Neuladen
// sichtbar. Der 15-Sekunden-Poll (setInterval) läuft nicht zuverlässig weiter,
// wenn das Fenster/der Tab eine Weile inaktiv war (Browser-Drosselung,
// Speicherschoner-Neuladen). Fix: sofort nachladen, sobald das Fenster wieder
// aktiv wird, statt auf den nächsten Takt zu warten.

const src = fs.readFileSync(path.join(__dirname, '..', 'pages', 'admin', 'kanban.tsx'), 'utf8')

describe('Kanban lädt sofort nach, wenn das Fenster wieder aktiv wird', () => {
  it('reagiert auf visibilitychange', () => {
    expect(src).toMatch(/addEventListener\('visibilitychange', onVisible\)/)
  })

  it('reagiert zusätzlich auf window focus (deckt Fenster-Wechsel per Klick/Alt-Tab ab)', () => {
    expect(src).toMatch(/window\.addEventListener\('focus', onVisible\)/)
  })

  it('lädt nur bei tatsächlich sichtbarem Dokument, nicht bei jedem Event-Feuern', () => {
    expect(src).toMatch(/document\.visibilityState === 'visible'\) loadOrders\(\)/)
  })

  it('räumt beide Listener beim Unmount auf (kein Leak)', () => {
    const block = src.slice(src.indexOf('onVisible = ()'), src.indexOf('onVisible = ()') + 700)
    expect(block).toMatch(/removeEventListener\('visibilitychange', onVisible\)/)
    expect(block).toMatch(/removeEventListener\('focus', onVisible\)/)
  })

  it('der 15-Sekunden-Poll bleibt zusätzlich bestehen (Absicherung, kein Ersatz)', () => {
    expect(src).toMatch(/setInterval\(loadOrders, 15000\)/)
  })
})

describe('Ton-Freischaltung ist robust gegen Fenster-Neuladen', () => {
  it('versucht die Freischaltung bei jedem Klick, nicht nur dem ersten', () => {
    // Vorher wurde der Listener INNERHALB von unlock() selbst entfernt (also
    // nach dem allerersten Klick abgemeldet) — nach einem Neuladen des Fensters
    // (Speicherschoner) blieb der Ton dann dauerhaft gesperrt, bis die Seite
    // manuell neu geladen wurde. Die normale Aufräum-Funktion des Effekts beim
    // Unmount (return () => removeEventListener(...)) ist davon NICHT betroffen
    // und bleibt bestehen.
    const m = src.match(/const unlock = \(\) => \{[^}]*\}/)
    expect(m).not.toBeNull()
    expect(m![0]).not.toMatch(/removeEventListener/)
  })
})
