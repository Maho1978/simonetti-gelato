// hooks/useKalkulation.ts

import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Zutat, Betriebskosten, Produkt, RezeptPosition, KalkEinstellungen } from '@/types/kalkulation'
import type { Kategorie } from '@/components/kalkulation/KategorienManager'

export interface BasisRezept {
  id: string
  name: string
  beschreibung?: string
  ergibt_menge: number
  ergibt_einheit: string
  aktiv: boolean
  basis_positionen?: BasisPosition[]
}

export interface BasisPosition {
  id: string
  basis_id: string
  zutat_id: string
  zutat_name?: string
  menge: number
  einheit: string
  schwund_pct: number
  sort_order: number
  zutat?: Zutat
}

export function useKalkulation() {
  
  const [zutaten,        setZutaten]        = useState<Zutat[]>([])
  const [betriebskosten, setBetriebskosten] = useState<Betriebskosten[]>([])
  const [produkte,       setProdukte]       = useState<Produkt[]>([])
  const [einstellungen,  setEinstellungen]  = useState<KalkEinstellungen | null>(null)
  const [kategorien,     setKategorien]     = useState<Kategorie[]>([])
  const [basisRezepte,   setBasisRezepte]   = useState<BasisRezept[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)

  // ── Alle Daten laden ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [z, b, p, e, k, br] = await Promise.all([
        supabase.from('zutaten').select('*').eq('aktiv', true).order('name'),
        supabase.from('betriebskosten').select('*').eq('aktiv', true).order('kategorie'),
        supabase.from('produkte')
          .select(`*, rezept_positionen(*, zutat:zutaten(*), basis:basis_rezepte(*))`)
          .eq('aktiv', true)
          .order('prod_kategorie'),
        supabase.from('kalk_einstellungen').select('*').single(),
        supabase.from('kategorien').select('*').eq('aktiv', true).order('sort_order'),
        supabase.from('basis_rezepte')
          .select('*, basis_positionen(*, zutat:zutaten(*))')
          .eq('aktiv', true)
          .order('name'),
      ])
      if (z.error) throw z.error
      if (b.error) throw b.error
      if (p.error) throw p.error
      setZutaten(z.data ?? [])
      setBetriebskosten(b.data ?? [])
      setProdukte(p.data ?? [])
      setEinstellungen(e.data)
      setKategorien(k.data ?? [])
      setBasisRezepte(br.data ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime deaktiviert — verhindert Fokus-Verlust beim Tippen

  // ── CRUD: Einstellungen ───────────────────────────────────────────────
  const saveEinstellungen = async (data: Partial<KalkEinstellungen>) => {
    if (!einstellungen) return
    const { error } = await supabase
      .from('kalk_einstellungen')
      .update(data)
      .eq('id', einstellungen.id)
    if (error) throw error
    setEinstellungen(prev => prev ? {...prev, ...data} : prev)
  }

  // ── CRUD: Betriebskosten ──────────────────────────────────────────────
  const saveBetriebskosten = async (item: Partial<Betriebskosten> & { id?: string }) => {
    if (item.id) {
      const { error } = await supabase.from('betriebskosten').update(item).eq('id', item.id)
      if (error) throw error
      setBetriebskosten(prev => prev.map(b => b.id === item.id ? {...b, ...item} : b))
    } else {
      const { error } = await supabase.from('betriebskosten').insert(item)
      if (error) throw error
      await load()
    }
  }

  const deleteBetriebskosten = async (id: string) => {
    const { error } = await supabase.from('betriebskosten').delete().eq('id', id)
    if (error) throw error
    setBetriebskosten(prev => prev.filter(b => b.id !== id))
  }

  // ── CRUD: Zutaten ─────────────────────────────────────────────────────
  const saveZutat = async (item: Partial<Zutat> & { id?: string }) => {
    if (item.id) {
      const { error } = await supabase.from('zutaten').update(item).eq('id', item.id)
      if (error) throw error
      setZutaten(prev => prev.map(z => z.id === item.id ? {...z, ...item} : z))
    } else {
      const { error } = await supabase.from('zutaten').insert({...item, aktiv: true})
      if (error) throw error
      await load()
    }
  }

  const deleteZutat = async (id: string) => {
    const { error } = await supabase.from('zutaten').update({ aktiv: false }).eq('id', id)
    if (error) throw error
    setZutaten(prev => prev.filter(z => z.id !== id))
  }

  // ── CRUD: Produkte ────────────────────────────────────────────────────
  const saveProdukt = async (item: Partial<Produkt> & { id?: string }) => {
    const { rezept_positionen, ...data } = item as any
    if (data.id) {
      const { error } = await supabase.from('produkte').update(data).eq('id', data.id)
      if (error) throw error
      setProdukte(prev => prev.map(p => p.id === data.id ? {...p, ...data} : p))
    } else {
      const { error } = await supabase.from('produkte').insert({...data, aktiv: true})
      if (error) throw error
      await load()
    }
  }

  const deleteProdukt = async (id: string) => {
    const { error } = await supabase.from('produkte').update({ aktiv: false }).eq('id', id)
    if (error) throw error
    setProdukte(prev => prev.filter(p => p.id !== id))
  }

  // ── CRUD: Rezept-Positionen ───────────────────────────────────────────
  const saveRezeptPosition = async (pos: Partial<RezeptPosition> & { id?: string }) => {
    if (pos.id) {
      const { error } = await supabase.from('rezept_positionen').update(pos).eq('id', pos.id)
      if (error) throw error
      setProdukte(prev => prev.map(p => ({
        ...p,
        rezept_positionen: (p.rezept_positionen ?? []).map((rp: any) =>
          rp.id === pos.id ? {...rp, ...pos} : rp
        )
      })))
    } else {
      const { error } = await supabase.from('rezept_positionen').insert(pos)
      if (error) throw error
      await load()
    }
  }

  const deleteRezeptPosition = async (id: string) => {
    const { error } = await supabase.from('rezept_positionen').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  // ── CRUD: Basis-Rezepte ───────────────────────────────────────────────
  const saveBasis = async (item: Partial<BasisRezept> & { id?: string }) => {
    const { basis_positionen, ...data } = item as any
    if (data.id) {
      const { error } = await supabase.from('basis_rezepte').update(data).eq('id', data.id)
      if (error) throw error
      setBasisRezepte(prev => prev.map(b => b.id === data.id ? {...b, ...data} : b))
    } else {
      const { data: inserted, error } = await supabase
        .from('basis_rezepte').insert({...data, aktiv: true}).select()
      if (error) throw error
      await load()
      return inserted?.[0]
    }
  }

  const deleteBasis = async (id: string) => {
    const { error } = await supabase.from('basis_rezepte').update({ aktiv: false }).eq('id', id)
    if (error) throw error
    setBasisRezepte(prev => prev.filter(b => b.id !== id))
  }

  const saveBasisPosition = async (pos: Partial<BasisPosition> & { id?: string }) => {
    if (pos.id) {
      const { error } = await supabase.from('basis_positionen').update(pos).eq('id', pos.id)
      if (error) throw error
      setBasisRezepte(prev => prev.map(b => ({
        ...b,
        basis_positionen: (b.basis_positionen ?? []).map(bp =>
          bp.id === pos.id ? {...bp, ...pos} : bp
        )
      })))
    } else {
      const { error } = await supabase.from('basis_positionen').insert(pos)
      if (error) throw error
      await load()
    }
  }

  const deleteBasisPosition = async (id: string) => {
    const { error } = await supabase.from('basis_positionen').delete().eq('id', id)
    if (error) throw error
    setBasisRezepte(prev => prev.map(b => ({
      ...b,
      basis_positionen: (b.basis_positionen ?? []).filter(bp => bp.id !== id)
    })))
  }

  // ── Hilfswerte ────────────────────────────────────────────────────────
  const betriebGesamt   = betriebskosten.reduce((s, b) => s + b.betrag, 0)
  const gesamtPortionen = produkte.reduce((s, p) => s + (p.verkauf_monat ?? 0), 0)

  // Kosten pro g/kg einer Basis berechnen
  const calcBasisKosten = (basis: BasisRezept): number => {
    const gesamtkosten = (basis.basis_positionen ?? []).reduce((sum, pos) => {
      const preis = pos.zutat?.preis_netto ?? 0
      const menge = pos.menge / (1 - (pos.schwund_pct ?? 0) / 100)
      return sum + menge * preis
    }, 0)
    return basis.ergibt_menge > 0 ? gesamtkosten / basis.ergibt_menge : 0
  }

  const zutatenKats = kategorien.filter(k => k.bereich === 'zutat')
  const produktKats = kategorien.filter(k => k.bereich === 'produkt')
  const betriebKats = kategorien.filter(k => k.bereich === 'betrieb')

  return {
    zutaten, betriebskosten, produkte, einstellungen, kategorien, basisRezepte,
    zutatenKats, produktKats, betriebKats,
    loading, error,
    betriebGesamt, gesamtPortionen,
    reload: load,
    calcBasisKosten,
    saveEinstellungen,
    saveBetriebskosten, deleteBetriebskosten,
    saveZutat, deleteZutat,
    saveProdukt, deleteProdukt,
    saveRezeptPosition, deleteRezeptPosition,
    saveBasis, deleteBasis,
    saveBasisPosition, deleteBasisPosition,
  }
}