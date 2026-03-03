'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const C = {
  cream:'#FBF6EE', vanilla:'#F2E6CC', caramel:'#C4873A', espresso:'#2C1708',
  muted:'#9E7B5A', border:'#DFD0B8', white:'#FFFFFF', red:'#C0392B', green:'#2E7D54',
}

export interface Kategorie {
  id: string
  bereich: 'zutat' | 'produkt' | 'betrieb'
  name: string
  farbe: string
  icon: string
  sort_order: number
  aktiv: boolean
}

const FARBEN = [
  '#854D0E','#1E40AF','#065F46','#5B21B6','#374151',
  '#C4873A','#2E7D54','#C0392B','#6B4C35','#9E7B5A',
]

const ICONS = ['🌾','🥛','🍓','🌿','📦','🍦','🍞','☕','🥐','🏠','⚡','👥','🛡️','📋','👤','💊','🧴','🥩','🧀','🫙']

interface Props {
  kategorien: Kategorie[]
  bereich: 'zutat' | 'produkt' | 'betrieb'
  onClose: () => void
  onReload: () => void
}

export default function KategorienManager({ kategorien, bereich, onClose, onReload }: Props) {
  const supabase = createClientComponentClient()
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFarbe, setNewFarbe] = useState(FARBEN[0])
  const [newIcon, setNewIcon] = useState('📦')
  const [error, setError] = useState('')

  const items = kategorien.filter(k => k.bereich === bereich && k.aktiv).sort((a,b) => a.sort_order - b.sort_order)

  const bereichLabel = { zutat: 'Zutaten', produkt: 'Produkte', betrieb: 'Betriebskosten' }[bereich]

  const add = async () => {
    if (!newName.trim()) { setError('Name eingeben'); return }
    if (items.find(k => k.name.toLowerCase() === newName.toLowerCase())) {
      setError('Kategorie existiert bereits'); return
    }
    setSaving(true)
    const { error: err } = await supabase.from('kategorien').insert({
      bereich, name: newName.trim(), farbe: newFarbe, icon: newIcon,
      sort_order: items.length + 1, aktiv: true,
    })
    if (err) setError(err.message)
    else { setNewName(''); setError(''); onReload() }
    setSaving(false)
  }

  const del = async (id: string) => {
    setSaving(true)
    await supabase.from('kategorien').update({ aktiv: false }).eq('id', id)
    onReload()
    setSaving(false)
  }

  const updateName = async (id: string, name: string) => {
    await supabase.from('kategorien').update({ name }).eq('id', id)
    onReload()
  }

  const inp: React.CSSProperties = {
    flex:1, padding:'8px 11px', border:`1.5px solid ${C.border}`, borderRadius:7,
    fontSize:13, color:C.espresso, background:C.cream, outline:'none',
    fontFamily:"'DM Sans',sans-serif",
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(44,23,8,0.45)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
    }} onClick={e => { if(e.target===e.currentTarget) onClose() }}>
      <div style={{
        background:C.white, borderRadius:16, border:`1px solid ${C.border}`,
        width:460, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 12px 48px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{background:C.vanilla, padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:C.espresso}}>
              {bereichLabel}-Kategorien
            </div>
            <div style={{fontSize:11, color:C.muted, marginTop:2}}>{items.length} Kategorien · Klick zum Umbenennen</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:C.muted}}>×</button>
        </div>

        {/* Liste */}
        <div style={{overflowY:'auto', flex:1, padding:'12px 16px'}}>
          {items.map(k => (
            <div key={k.id} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 10px', borderRadius:8, marginBottom:6,
              border:`1.5px solid ${C.border}`, background:C.cream,
            }}>
              <div style={{
                width:32, height:32, borderRadius:8, fontSize:16,
                background:k.farbe+'22', display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0,
              }}>{k.icon}</div>
              <input
                defaultValue={k.name}
                onBlur={e => { if(e.target.value !== k.name) updateName(k.id, e.target.value) }}
                style={{...inp, flex:1, padding:'5px 8px', background:'transparent', border:'none',
                  fontWeight:600, fontSize:13}}
              />
              <div style={{
                width:14, height:14, borderRadius:'50%', background:k.farbe, flexShrink:0,
              }}/>
              <button onClick={() => del(k.id)}
                style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:16,padding:'0 4px',flexShrink:0}}
                title="Löschen">×</button>
            </div>
          ))}
        </div>

        {/* Neue Kategorie */}
        <div style={{borderTop:`1px solid ${C.border}`, padding:'14px 16px', background:'#FFFEF5'}}>
          <div style={{fontSize:11, fontWeight:600, color:C.muted, letterSpacing:'1px', textTransform:'uppercase', marginBottom:8}}>
            Neue Kategorie
          </div>
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <input
              style={inp}
              placeholder="Name eingeben…"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError('') }}
              onKeyDown={e => { if(e.key==='Enter') add() }}
            />
            <button onClick={add} disabled={saving || !newName.trim()}
              style={{
                padding:'8px 16px', background:C.espresso, color:C.vanilla, border:'none',
                borderRadius:7, fontWeight:600, fontSize:12, cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif", opacity:saving||!newName.trim()?0.5:1,
              }}>
              + Hinzufügen
            </button>
          </div>

          {/* Icon + Farbe Auswahl */}
          <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
            <div>
              <div style={{fontSize:10, color:C.muted, marginBottom:5, fontWeight:600}}>ICON</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:4, maxWidth:200}}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setNewIcon(ic)}
                    style={{
                      width:30, height:30, borderRadius:6, fontSize:16, border:`1.5px solid ${ic===newIcon?C.caramel:C.border}`,
                      background:ic===newIcon?C.vanilla:'transparent', cursor:'pointer',
                    }}>{ic}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10, color:C.muted, marginBottom:5, fontWeight:600}}>FARBE</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
                {FARBEN.map(f => (
                  <button key={f} onClick={() => setNewFarbe(f)}
                    style={{
                      width:24, height:24, borderRadius:'50%', background:f, border:`2.5px solid ${f===newFarbe?C.espresso:'transparent'}`,
                      cursor:'pointer',
                    }}/>
                ))}
              </div>
            </div>
            <div style={{
              width:40, height:40, borderRadius:10, background:newFarbe+'22',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
              border:`1.5px solid ${newFarbe}`, marginTop:16,
            }}>{newIcon}</div>
          </div>

          {error && <div style={{fontSize:12, color:C.red, marginTop:8}}>{error}</div>}
        </div>
      </div>
    </div>
  )
}