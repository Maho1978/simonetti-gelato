// types/kalkulation.ts
export type Einheit = 'kg' | 'g' | 'L' | 'ml' | 'Stk' | 'EL' | 'TL' | 'Scheibe' | 'Portion'
export type ZutatenKat = 'Rohstoffe' | 'Verpackung' | 'Personal' | 'Energie' | 'Miete' | 'Sonstiges'
export type ProdKat = 'eis' | 'brot' | 'getraenk' | 'snack'
export type PortKey = '1k' | '2k' | '3k' | '500' | '1kg' | '1'
export type UmlageModus = 'portion' | 'gleich'

export interface Zutat {
  id: string
  name: string
  einheit: Einheit
  kategorie: ZutatenKat
  preis_netto: number
  lieferant?: string
  artikelnr?: string
  notiz?: string
  aktiv: boolean
  created_at: string
  updated_at: string
}

export interface Betriebskosten {
  id: string
  name: string
  betrag: number
  kategorie: string
  aktiv: boolean
  notiz?: string
  created_at: string
  updated_at: string
}

export interface Produkt {
  id: string
  name: string
  prod_kategorie: ProdKat
  port_key: PortKey
  verkauf_monat: number
  ziel_marge: number
  mwst_ausser: number
  mwst_vor_ort: number
  aktiv: boolean
  notiz?: string
  created_at: string
  updated_at: string
  // joined
  rezept_positionen?: RezeptPosition[]
}

export interface RezeptPosition {
  id: string
  produkt_id: string
  zutat_id?: string
  zutat_name?: string
  einheit: Einheit
  menge: number
  schwund_pct: number
  sort_order: number
  // joined
  zutat?: Zutat
}

export interface KalkEinstellungen {
  id: string
  ziel_marge: number
  mwst_ausser: number
  mwst_vor_ort: number
  umlage_modus: UmlageModus
  updated_at: string
}

export interface ProduktKalkulation {
  produkt: Produkt
  wareneinsatz: number
  fix_pro_portion: number
  selbstkosten: number
  netto_min_vk: number
  brutto_ausser: number
  empf_vk: number      // auf 10ct gerundet
  empf_netto: number
  brutto_vor_ort: number
  empf_vk_vor_ort: number
  ist_marge: number
  food_cost_pct: number
  db_pro_portion: number
  db_monat: number
}