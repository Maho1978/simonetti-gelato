f = r'C:\Projekte\simonetti-hybrid\hooks\useKalkulation.ts'
content = open(f, encoding='utf-8').read()

old = """  const calcBasisKosten = (basis: BasisRezept): number => {
    const gesamtkosten = (basis.basis_positionen ?? []).reduce((sum, pos) => {
      const preis = pos.zutat?.preis_netto ?? 0
      const menge = pos.menge / (1 - (pos.schwund_pct ?? 0) / 100)
      return sum + menge * preis
    }, 0)
    return basis.ergibt_menge > 0 ? gesamtkosten / basis.ergibt_menge : 0
  }"""

new = """  const calcBasisKosten = (basis: BasisRezept): number => {
    // Konvertiert alles zu kg für einheitliche Berechnung
    const toKg = (menge: number, einheit: string): number => {
      switch (einheit) {
        case 'g':   return menge / 1000
        case 'kg':  return menge
        case 'ml':  return menge / 1000
        case 'L':   return menge
        default:    return menge // Stk, EL, TL als direkte Menge
      }
    }
    const gesamtkosten = (basis.basis_positionen ?? []).reduce((sum, pos) => {
      const preis = (pos.zutat as any)?.preis_netto ?? 0  // Preis pro kg/L/Stk
      const mengeKg = toKg(pos.menge, pos.einheit)
      const mengeNachSchwund = mengeKg / (1 - (pos.schwund_pct ?? 0) / 100)
      return sum + mengeNachSchwund * preis
    }, 0)
    // Ergibt_menge auch konvertieren
    const ergibtKg = toKg(basis.ergibt_menge, basis.ergibt_einheit)
    return ergibtKg > 0 ? gesamtkosten / ergibtKg : 0
  }"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK")
else:
    print("FEHLER")
    idx = content.find("calcBasisKosten")
    print(repr(content[idx:idx+300]))
