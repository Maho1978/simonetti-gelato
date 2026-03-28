// hooks/useKalkulation.ts

import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Zutat, Betriebskosten, Produkt, RezeptPosition, KalkEinstellungen } from '@/types/kalkulation'
import type { Kategorie } from '@/components/kalkulation/KategorienManager'

export function useKalkulation() {
  
  const [zutaten,        setZutaten]        = useState<Zutat[]>([])
  const [betriebskosten, setBetriebskosten] = useState<Betriebskosten[]>([])
  const [produkte,       setProdukte]       = useState<Produkt[]>([])
  const [einstellungen,  setEinstellungen]  = useState<KalkEinstellungen | null>(null)
  const [kategorien,     setKategorien]     = useState<Kategorie[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)

  // â”€â”€ Alle Daten laden â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [z, b, p, e, k] = await Promise.all([
        supabase.from('zutaten').select('*').eq('aktiv', true).order('name'),
        supabase.from('betriebskosten').select('*').eq('aktiv', true).order('kategorie'),
        supabase.from('produkte')
          .select(`*, rezept_positionen(*, zutat:zutaten(*))`)
          .eq('aktiv', true)
          .order('prod_kategorie'),
        supabase.from('kalk_einstellungen').select('*').single(),
        supabase.from('kategorien').select('*').eq('aktiv', true).order('sort_order'),
      ])
      if (z.error) throw z.error
      if (b.error) throw b.error
      if (p.error) throw p.error
      setZutaten(z.data ?? [])
      setBetriebskosten(b.data ?? [])
      setProdukte(p.data ?? [])
      setEinstellungen(e.data)
      setKategorien(k.data ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  // â”€â”€ Realtime Subscriptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Realtime deaktiviert — verhindert Fokus-Verlust beim Tippen

  // â”€â”€ CRUD: Einstellungen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveEinstellungen = async (data: Partial<KalkEinstellungen>) => {
    if (!einstellungen) return
    const { error } = await supabase
      .from('kalk_einstellungen')
      .update(data)
      .eq('id', einstellungen.id)
    if (error) throw error
    setEinstellungen(prev => prev ? {...prev, ...data} : prev)
  }

  // â”€â”€ CRUD: Betriebskosten â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ CRUD: Zutaten â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ CRUD: Produkte â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ CRUD: Rezept-Positionen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveRezeptPosition = async (pos: Partial<RezeptPosition> & { id?: string }) => {
    if (pos.id) {
      const { error } = await supabase.from('rezept_positionen').update(pos).eq('id', pos.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('rezept_positionen').insert(pos)
      if (error) throw error
    }
    await load()
  }

  const deleteRezeptPosition = async (id: string) => {
    const { error } = await supabase.from('rezept_positionen').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  // â”€â”€ Hilfswerte â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const betriebGesamt   = betriebskosten.reduce((s, b) => s + b.betrag, 0)
  const gesamtPortionen = produkte.reduce((s, p) => s + (p.verkauf_monat ?? 0), 0)

  // â”€â”€ Kategorien-Helfer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const zutatenKats   = kategorien.filter(k => k.bereich === 'zutat')
  const produktKats   = kategorien.filter(k => k.bereich === 'produkt')
  const betriebKats   = kategorien.filter(k => k.bereich === 'betrieb')

  return {
    // Daten
    zutaten, betriebskosten, produkte, einstellungen, kategorien,
    zutatenKats, produktKats, betriebKats,
    loading, error,
    betriebGesamt, gesamtPortionen,
    // Actions
    reload: load,
    saveEinstellungen,
    saveBetriebskosten, deleteBetriebskosten,
    saveZutat, deleteZutat,
    saveProdukt, deleteProdukt,
    saveRezeptPosition, deleteRezeptPosition,
  }
}