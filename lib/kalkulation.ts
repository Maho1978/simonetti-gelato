// lib/kalkulation.ts
import type { Produkt, RezeptPosition, Zutat, KalkEinstellungen, ProduktKalkulation } from '@/types/kalkulation'

export const PORTIONEN = [
  { key: '1k',  label: '1 Kugel',     faktor: 0.4 },
  { key: '2k',  label: '2 Kugeln',    faktor: 0.7 },
  { key: '3k',  label: '3 Kugeln',    faktor: 1.0 },
  { key: '500', label: '500g Becher', faktor: 2.8 },
  { key: '1kg', label: '1kg Becher',  faktor: 5.5 },
  { key: '1',   label: '1 Portion',   faktor: 1.0 },
] as const

export const PROD_KATS = [
  { key: 'eis',      label: 'Eis & Eiskrem',      icon: '🍦' },
  { key: 'brot',     label: 'Brot & Backwaren',   icon: '🍞' },
  { key: 'getraenk', label: 'Getraenke',           icon: '☕' },
  { key: 'snack',    label: 'Snacks & Sonstiges',  icon: '🥐' },
] as const

export const BETRIEB_KATS = [
  'Miete', 'Energie', 'Versicherung', 'Personal',
  'Verwaltung', 'Unternehmerlohn', 'Sonstiges',
] as const

export function getPortionFaktor(portKey: string): number {
  return PORTIONEN.find(p => p.key === portKey)?.faktor ?? 1.0
}

/** Wareneinsatz einer Rezeptposition (mit Schwund und Portionsfaktor) */
export function calcPositionKosten(pos: RezeptPosition, portFaktor: number): number {
  const preis = pos.zutat?.preis_netto ?? 0
  const rohkosten = pos.menge * preis * portFaktor
  return rohkosten / (1 - (pos.schwund_pct ?? 0) / 100)
}

/** Gesamter Wareneinsatz eines Produkts */
export function calcWareneinsatz(produkt: Produkt): number {
  const pF = getPortionFaktor(produkt.port_key)
  return (produkt.rezept_positionen ?? []).reduce((sum, pos) => {
    return sum + calcPositionKosten(pos, pF)
  }, 0)
}

/** Fixkosten-Umlage je nach Modus */
export function calcFixUmlage(params: {
  betriebGesamt: number
  produkte: Produkt[]
  produktId: string
  modus: 'portion' | 'gleich'
}): number {
  const { betriebGesamt, produkte, produktId, modus } = params
  const prod = produkte.find(p => p.id === produktId)
  if (!prod) return 0

  if (modus === 'portion') {
    // Gleichmaessig nach Gesamtportionen
    const gesamtPortionen = produkte.reduce((s, p) => s + (p.verkauf_monat ?? 0), 0)
    return gesamtPortionen > 0 ? betriebGesamt / gesamtPortionen : 0
  } else {
    // Gleichmaessig nach Produktanzahl, dann durch eigene Portionen
    const perProdukt = produkte.length > 0 ? betriebGesamt / produkte.length : 0
    return (prod.verkauf_monat ?? 0) > 0 ? perProdukt / prod.verkauf_monat : 0
  }
}

/** Vollstaendige Kalkulation eines Produkts */
export function calcProdukt(params: {
  produkt: Produkt
  fixProPortion: number
  einstellungen: KalkEinstellungen
}): ProduktKalkulation {
  const { produkt, fixProPortion, einstellungen } = params
  const { ziel_marge, mwst_ausser, mwst_vor_ort } = einstellungen

  const wi = calcWareneinsatz(produkt)
  const gk = wi + fixProPortion
  const nMin = gk / (1 - ziel_marge / 100)
  const bA = nMin * (1 + mwst_ausser / 100)
  const eVK = Math.ceil(bA * 10) / 10        // auf 10ct aufrunden
  const eN = eVK / (1 + mwst_ausser / 100)
  const bV = nMin * (1 + mwst_vor_ort / 100)
  const eVKvorOrt = Math.ceil(bV * 10) / 10
  const istMarge = eN > 0 ? ((eN - gk) / eN) * 100 : 0
  const fc = eN > 0 ? (wi / eN) * 100 : 0
  const db = eN - gk
  const dbMonat = db * (produkt.verkauf_monat ?? 0)

  return {
    produkt,
    wareneinsatz: wi,
    fix_pro_portion: fixProPortion,
    selbstkosten: gk,
    netto_min_vk: nMin,
    brutto_ausser: bA,
    empf_vk: eVK,
    empf_netto: eN,
    brutto_vor_ort: bV,
    empf_vk_vor_ort: eVKvorOrt,
    ist_marge: istMarge,
    food_cost_pct: fc,
    db_pro_portion: db,
    db_monat: dbMonat,
  }
}

/** Portfolio-Klassifikation (Gastronovi-Methode) */
export function classifyProdukt(k: ProduktKalkulation, avgDB: number) {
  if (k.db_pro_portion >= avgDB && k.ist_marge >= 55) return { label: 'Gewinner',  color: 'green' } as const
  if (k.db_pro_portion >= avgDB && k.ist_marge < 55)  return { label: 'Renner',    color: 'amber' } as const
  if (k.db_pro_portion < avgDB  && k.ist_marge >= 55) return { label: 'Schlafer',  color: 'blue'  } as const
  return { label: 'Verlierer', color: 'red' } as const
}

export const EUR = (v: number) =>
  (v ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

export const PCT = (v: number) =>
  `${(v ?? 0).toFixed(1).replace('.', ',')} %`