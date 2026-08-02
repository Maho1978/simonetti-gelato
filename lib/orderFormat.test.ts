import { formatAddress, itemFlavors, itemExtras, itemLineTotal } from './orderFormat'

describe('formatAddress', () => {
  it('formatiert das JSONB-Objekt aus der DB', () => {
    expect(formatAddress({ zip: '40764', city: 'Langenfeld', street: 'Meisentalstr. 83' }))
      .toBe('Meisentalstr. 83, 40764 Langenfeld')
  })

  it('gibt einen String unveraendert zurueck', () => {
    expect(formatAddress('Hauptstr. 1, 40764 Langenfeld')).toBe('Hauptstr. 1, 40764 Langenfeld')
  })

  it('vertraegt null (Abholung) ohne Absturz', () => {
    expect(formatAddress(null)).toBe('–')
    expect(formatAddress(undefined)).toBe('–')
  })

  it('kommt mit unvollstaendiger Adresse klar', () => {
    expect(formatAddress({ city: 'Langenfeld' })).toBe('Langenfeld')
    expect(formatAddress({})).toBe('–')
  })
})

describe('Artikel-Details', () => {
  // Die Bestelldaten nutzen selectedFlavors/selectedExtras. Wer nur flavors/extras
  // liest, zeigt bei echten Bestellungen NICHTS an - genau dieser Fehler steckte
  // im Bon (PrintOrder).
  it('liest Sorten aus selectedFlavors', () => {
    expect(itemFlavors({ selectedFlavors: ['Vanille', 'Erdbeere'] })).toEqual(['Vanille', 'Erdbeere'])
  })

  it('liest Sorten auch aus flavors', () => {
    expect(itemFlavors({ flavors: ['Schoko'] })).toEqual(['Schoko'])
  })

  it('liefert leere Liste statt undefined', () => {
    expect(itemFlavors({})).toEqual([])
    expect(itemExtras({})).toEqual([])
  })

  it('liest Extras als Objekt und als String', () => {
    expect(itemExtras({ selectedExtras: [{ name: 'Sahne', price: 0.8 }] })).toEqual(['Sahne'])
    expect(itemExtras({ extras: ['Streusel'] })).toEqual(['Streusel'])
  })

  it('nimmt totalPrice, weil darin Extras enthalten sind', () => {
    expect(itemLineTotal({ price: 9.5, quantity: 1, totalPrice: 10.3 })).toBe(10.3)
  })

  it('faellt auf price mal Menge zurueck', () => {
    expect(itemLineTotal({ price: 2.5, quantity: 2 })).toBe(5)
  })
})
