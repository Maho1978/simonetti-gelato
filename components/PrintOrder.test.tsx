import { render } from '@testing-library/react'
import PrintOrder from './PrintOrder'

// Regressionstests zum Bon (02.08.2026). Der Bon war fuer JEDE Lieferbestellung
// kaputt: delivery_address ist in der DB ein JSONB-Objekt und wurde direkt
// gerendert -> React-Absturz. Zusaetzlich wurden Sorten und Extras nie gedruckt,
// weil der Bon `flavors`/`extras` gelesen hat, die Bestelldaten aber
// `selectedFlavors`/`selectedExtras` liefern.

// Struktur exakt wie in der orders-Tabelle (aus einer echten Bestellung entnommen)
const lieferOrder: any = {
  id: 'b23ee5fe-64fc-4aa4-a93f-01a2637ade92',
  order_number: 'SIM-2026-1234',
  customer_name: 'Astrid Welp',
  customer_phone: '01786916656',
  customer_email: 'kunde@example.de',
  delivery_address: { zip: '40764', city: 'Langenfeld', name: 'Astrid Welp', street: 'Meisentalstr. 83' },
  items: [
    {
      name: 'Spaghetti', quantity: 1, price: 9.5, totalPrice: 9.5,
      selectedFlavors: ['Vanille', 'Erdbeere'],
      selectedExtras: [{ name: 'Sahne', price: 0.8 }],
    },
  ],
  subtotal: 9.5, delivery_fee: 3, tip: 2.31, total: 14.81,
  notes: 'Bitte klingeln bei Meier, 2. Stock links',
  status: 'OFFEN', payment_method: 'paypal',
  created_at: '2026-08-02T12:50:51.988Z',
}

describe('Bon (PrintOrder)', () => {
  it('stuerzt bei einer Lieferadresse als JSONB-Objekt nicht ab und druckt sie lesbar', () => {
    const { container } = render(<PrintOrder order={lieferOrder} />)
    expect(container.textContent).toContain('Meisentalstr. 83')
    expect(container.textContent).toContain('40764 Langenfeld')
  })

  it('druckt die Anmerkung des Kunden', () => {
    const { container } = render(<PrintOrder order={lieferOrder} />)
    expect(container.textContent).toContain('Bitte klingeln bei Meier, 2. Stock links')
  })

  it('druckt die Eissorten', () => {
    const { container } = render(<PrintOrder order={lieferOrder} />)
    expect(container.textContent).toContain('Vanille')
    expect(container.textContent).toContain('Erdbeere')
  })

  it('druckt die Extras', () => {
    const { container } = render(<PrintOrder order={lieferOrder} />)
    expect(container.textContent).toContain('Sahne')
  })

  it('funktioniert bei Abholung ohne Lieferadresse', () => {
    const abholung = { ...lieferOrder, delivery_address: null, order_type: 'pickup' }
    const { container } = render(<PrintOrder order={abholung} />)
    expect(container.textContent).toContain('SIM-2026-1234')
  })

  it('kommt mit einer Bestellung ohne Anmerkung/Sorten/Extras klar', () => {
    const schlicht = {
      ...lieferOrder,
      notes: null,
      items: [{ name: 'Espresso', quantity: 2, price: 2.5 }],
    }
    const { container } = render(<PrintOrder order={schlicht} />)
    expect(container.textContent).toContain('Espresso')
    expect(container.textContent).not.toContain('Sorten:')
  })
})
