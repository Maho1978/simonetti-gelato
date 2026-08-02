// Gemeinsame Darstellung von Bestelldaten.
//
// Hintergrund (02.08.2026): `formatAddress` existierte viermal kopiert (Kanban,
// Bestell-Mails, Telegram, Kundenkonto) - ausgerechnet der Bon (PrintOrder) hatte
// keine Kopie und hat `delivery_address` direkt gerendert. Da das in der DB ein
// JSONB-Objekt ist, ist der Bon bei JEDER Lieferbestellung abgestuerzt
// ("Objects are not valid as a React child"). Deshalb liegt die Formatierung
// jetzt an einer Stelle, mit Tests.

export interface AddressLike {
  street?: string | null
  zip?: string | null
  city?: string | null
  name?: string | null
}

/** Lieferadresse als einzeilige Zeichenkette. Vertraegt Objekt, String, null. */
export function formatAddress(addr: AddressLike | string | null | undefined): string {
  if (!addr) return '–'
  if (typeof addr === 'string') return addr
  if (typeof addr === 'object') {
    const parts: string[] = []
    if (addr.street) parts.push(addr.street)
    if (addr.zip && addr.city) parts.push(`${addr.zip} ${addr.city}`)
    else if (addr.city) parts.push(addr.city)
    return parts.join(', ') || '–'
  }
  return String(addr)
}

/**
 * Eissorten eines Warenkorb-Artikels.
 * Die Bestelldaten nutzen `selectedFlavors`; aeltere/andere Wege `flavors`.
 * Der Bon hat nur `flavors` geprueft und deshalb NIE Sorten gedruckt.
 */
export function itemFlavors(item: any): string[] {
  return (item?.flavors || item?.selectedFlavors || []) as string[]
}

/**
 * Extras eines Artikels als Namensliste. Extras koennen als String oder als
 * Objekt `{ name, price }` vorliegen.
 */
export function itemExtras(item: any): string[] {
  const raw = (item?.extras || item?.selectedExtras || []) as any[]
  return raw.map(e => (typeof e === 'object' && e !== null ? e.name : e)).filter(Boolean)
}

/**
 * Zeilenpreis. `totalPrice` enthaelt bereits Extras/Sorten-Aufpreise und ist
 * deshalb dem Grundpreis vorzuziehen.
 */
export function itemLineTotal(item: any): number {
  if (typeof item?.totalPrice === 'number') return item.totalPrice
  return (item?.price || 0) * (item?.quantity || 1)
}
