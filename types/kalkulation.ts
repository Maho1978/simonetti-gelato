export type ProdKat = 'eis' | 'brot' | 'getraenk' | 'snack'
export type PortKey = '1k' | '2k' | '3k' | '500' | '1kg' | '250ml' | '500ml' | '1L' | 'free' | '1'
export type UmlageModus = 'portion' | 'gleich'

export interface Zutat {
  id: string
  name: string
  preis_netto: number
  einheit: string
  kategorie?: string | null
  lieferant?: string | null
  lieferant_id?: string | null
  artikelnr?: string | null
  min_bestand?: number | null
  ist_bestand?: number | null
}

export interface Betriebskosten {
  id: string
  name: string
  betrag: number
  kategorie?: string | null
  aktiv?: boolean
}

export interface RezeptPosition {
  id?: string
  produkt_id?: string
  basis_id?: string | null
  zutat_id?: string
  zutat_name?: string
  einheit: string
  menge: number
  schwund_pct?: number
  sort_order?: number
  zutat?: Zutat
}

export interface Produkt {
  id: string
  name: string
  port_key: string
  prod_kategorie: ProdKat
  verkauf_monat?: number
  rezept_positionen?: RezeptPosition[]
  port_menge?: number
  port_einheit?: string
}

export interface KalkEinstellungen {
  id: string
  ziel_marge: number
  mwst_ausser: number
  mwst_vor_ort: number
  umlage_modus?: UmlageModus
}

export interface ProduktKalkulation {
  produkt: Produkt
  wareneinsatz: number
  fix_pro_portion: number
  selbstkosten: number
  netto_min_vk: number
  brutto_ausser: number
  empf_vk: number
  empf_netto: number
  brutto_vor_ort: number
  empf_vk_vor_ort: number
  ist_marge: number
  food_cost_pct: number
  db_pro_portion: number
  db_monat: number
}
