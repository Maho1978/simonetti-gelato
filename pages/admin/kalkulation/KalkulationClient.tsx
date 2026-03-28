'use client'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useKalkulation } from '@/hooks/useKalkulation'
import type { BasisRezept, BasisPosition } from '@/hooks/useKalkulation'
import {
  calcProdukt, calcWareneinsatz, calcFixUmlage, classifyProdukt,
  PORTIONEN, PROD_KATS, BETRIEB_KATS, EUR, PCT,
} from '@/lib/kalkulation'
import type {
  Produkt, Zutat, Betriebskosten, RezeptPosition,
  KalkEinstellungen, ProdKat, PortKey, UmlageModus,
} from '@/types/kalkulation'

/* ── Farben ─────────────────────────────────────────────────── */
const C = {
  cream:'#FBF6EE', vanilla:'#F2E6CC', caramel:'#C4873A', espresso:'#2C1708',
  coffee:'#5C3317', muted:'#9E7B5A', border:'#DFD0B8', white:'#FFFFFF',
  red:'#C0392B', green:'#2E7D54', amber:'#D4860A', blue:'#2563EB', sand:'#E8D5B0',
}

/* ── kleine UI-Helfer ───────────────────────────────────────── */
const Bdg = ({ color, children }: { color: 'green'|'red'|'amber'|'blue'|'gray', children: React.ReactNode }) => {
  const m = { green:{bg:'#D1FAE5',c:C.green}, red:{bg:'#FEE2E2',c:C.red}, amber:{bg:'#FEF3C7',c:C.amber}, blue:{bg:'#DBEAFE',c:C.blue}, gray:{bg:'#F3F4F6',c:'#374151'} }
  const t = m[color]
  return <span style={{display:'inline-block',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:t.bg,color:t.c}}>{children}</span>
}
const Bar = ({ value, color = C.caramel }: { value: number; color?: string }) => (
  <div style={{height:7,background:C.vanilla,borderRadius:4,overflow:'hidden'}}>
    <div style={{height:'100%',width:`${Math.min(Math.max(value,0),100)}%`,background:color,borderRadius:4,transition:'width 0.4s'}}/>
  </div>
)
const Spinner = () => (
  <div style={{display:'inline-block',width:18,height:18,border:`2px solid ${C.border}`,borderTopColor:C.caramel,borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
)
const SaveBtn = ({ onClick, saving, children }: { onClick: ()=>void; saving: boolean; children: React.ReactNode }) => (
  <button onClick={onClick} disabled={saving}
    style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',background:C.espresso,color:C.vanilla,border:'none',borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1}}>
    {saving ? <Spinner/> : null}{children}
  </button>
)

/* ── Inline-Edit-Input mit Debounce ─────────────────────────── */
function TdInput({ value, onChange, type='text', width=100, align='left', step, delay=600 }:
  { value: string|number; onChange:(v:string)=>void; type?:string; width?:number; align?:string; step?:string; delay?:number }) {
  const [local, setLocal] = useState(String(value))
  const timer = useRef<any>(null)
  useEffect(() => { setLocal(String(value)) }, [value])
  const handleChange = (v: string) => {
    setLocal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), delay)
  }
  const style: React.CSSProperties = {
    width, padding:'4px 7px', border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:12,
    color:C.espresso, background:'transparent', outline:'none',
    fontFamily:"'DM Sans',sans-serif", textAlign: align as any, boxSizing:'border-box',
  }
  return <input type={type} value={local} step={step} onChange={e=>handleChange(e.target.value)} style={style}/>
}

/* ════════════════════════════════════════════════════════════
   HAUPTKOMPONENTE
════════════════════════════════════════════════════════════ */
export default function KalkulationClient() {
  const {
    zutaten, betriebskosten, produkte, einstellungen, basisRezepte,
    loading, error, betriebGesamt, gesamtPortionen, reload,
    calcBasisKosten,
    saveEinstellungen, saveBetriebskosten, deleteBetriebskosten,
    saveZutat, deleteZutat, saveProdukt, deleteProdukt,
    saveRezeptPosition, deleteRezeptPosition,
    saveBasis, deleteBasis, saveBasisPosition, deleteBasisPosition,
  } = useKalkulation()

  const [mainTab,    setMainTab]    = useState<'produkte'|'zutaten'|'betrieb'|'basis'|'uebersicht'>('produkte')
  const [aktivBasis, setAktivBasis] = useState<string|null>(null)
  const [aktivProd,  setAktivProd]  = useState<string|null>(null)
  const [prodTab,    setProdTab]    = useState<'rezept'|'detail'>('rezept')
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState<string|null>(null)
  const toastTimer = useRef<any>(null)

  /* ── Einstellungen lokal (sofort im UI, debounced save) ── */
  const [localEinst, setLocalEinst] = useState<Partial<KalkEinstellungen>>({})
  const einst = { ...einstellungen, ...localEinst } as KalkEinstellungen

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  const run = async (fn: ()=>Promise<void>, msg?: string) => {
    setSaving(true)
    try { await fn(); if (msg) showToast(msg) }
    catch (e: any) { showToast('Fehler: ' + e.message) }
    finally { setSaving(false) }
  }

  /* ── Aktives Produkt ─────────────────────────────────────── */
  const prod = produkte.find(p => p.id === aktivProd) ?? produkte[0] ?? null

  /* ── Fixkosten-Umlage je Produkt ─────────────────────────── */
  const fixMap = useMemo(() => {
    if (!einst) return {}
    return Object.fromEntries(produkte.map(p => [
      p.id,
      calcFixUmlage({ betriebGesamt, produkte, produktId: p.id, modus: einst.umlage_modus ?? 'portion' }),
    ]))
  }, [produkte, betriebGesamt, einst?.umlage_modus])

  /* ── Kalkulation für aktives Produkt ─────────────────────── */
  const kalk = useMemo(() => {
    if (!prod || !einst) return null
    return calcProdukt({ produkt: prod, fixProPortion: fixMap[prod.id] ?? 0, einstellungen: einst })
  }, [prod, fixMap, einst])

  /* ── Übersicht alle Produkte ─────────────────────────────── */
  const overview = useMemo(() => {
    if (!einst) return []
    return produkte.map(p => ({
      k: calcProdukt({ produkt: p, fixProPortion: fixMap[p.id] ?? 0, einstellungen: einst }),
      p,
    }))
  }, [produkte, fixMap, einst])

  const avgDB      = overview.length ? overview.reduce((s,u)=>s+u.k.db_pro_portion,0)/overview.length : 0
  const monatUmsatz= overview.reduce((s,u)=>s+u.k.empf_vk*(u.p.verkauf_monat??0),0)
  const monatDB    = overview.reduce((s,u)=>s+u.k.db_monat,0)
  const portion    = PORTIONEN.find(p => p.key === prod?.port_key)

  /* ── Neue Rezept-Position ─────────────────────────────────── */
  const addPosition = async (produktId: string) => {
    const firstZutat = zutaten[0]
    if (!firstZutat) { showToast('Zuerst Zutaten anlegen'); return }
    await run(() => saveRezeptPosition({
      produkt_id: produktId,
      zutat_id: firstZutat.id,
      zutat_name: firstZutat.name,
      einheit: firstZutat.einheit,
      menge: 0.1,
      schwund_pct: 0,
      sort_order: (prod?.rezept_positionen?.length ?? 0) + 1,
    }), 'Zutat hinzugefügt')
  }

  /* ── Neues Produkt ───────────────────────────────────────── */
  const addProdukt = async (kat: ProdKat) => {
    setSaving(true)
    try {
      const { data, error } = await (async () => {
        const res = await fetch('/api/kalkulation/produkt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Neues Produkt', prod_kategorie: kat, port_key: kat==='eis'?'3k':'1', verkauf_monat: 100 }),
        })
        return res.json()
      })()
      await reload()
      if (data?.id) setAktivProd(data.id)
    } catch (e: any) {
      // fallback: direkt speichern
      await saveProdukt({ name: 'Neues Produkt', prod_kategorie: kat, port_key: kat==='eis'?'3k':'1', verkauf_monat: 100 })
    } finally {
      setSaving(false)
    }
  }

  /* ── Styles ──────────────────────────────────────────────── */
  const inp: React.CSSProperties = {
    width:'100%', padding:'8px 11px', border:`1.5px solid ${C.border}`, borderRadius:7,
    fontSize:13, color:C.espresso, background:C.cream, outline:'none',
    boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif",
  }
  const sel: React.CSSProperties = {
    background:C.cream, border:`1.5px solid ${C.border}`, borderRadius:6,
    padding:'4px 7px', fontFamily:"'DM Sans',sans-serif", fontSize:12,
    color:C.espresso, cursor:'pointer', outline:'none',
  }
  const th: React.CSSProperties = {
    padding:'8px 10px', textAlign:'left', background:C.vanilla, color:C.muted,
    fontSize:10, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase',
    borderBottom:`1px solid ${C.border}`,
  }
  const td: React.CSSProperties = {
    padding:'8px 10px', borderBottom:`1px solid #F7F0E6`, verticalAlign:'middle',
  }
  const card: React.CSSProperties = {
    background:C.white, borderRadius:12, border:`1px solid ${C.border}`, overflow:'hidden',
  }
  const cH: React.CSSProperties = {
    background:C.vanilla, padding:'12px 17px', borderBottom:`1px solid ${C.border}`,
    display:'flex', alignItems:'center', justifyContent:'space-between',
  }
  const cT: React.CSSProperties = {
    fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:600, color:C.espresso,
  }
  const lbl: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:600, letterSpacing:'1.1px',
    textTransform:'uppercase', color:C.muted, marginBottom:4,
  }
  const mTabBtn = (a: boolean): React.CSSProperties => ({
    padding:'9px 20px', border:'none', cursor:'pointer',
    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
    borderRadius:8, background:a?C.caramel:'transparent',
    color:a?C.white:C.muted, transition:'all 0.15s',
  })
  const sTabBtn = (a: boolean): React.CSSProperties => ({
    padding:'6px 14px', border:'none', cursor:'pointer',
    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
    borderRadius:7, background:a?C.espresso:'transparent',
    color:a?C.white:C.muted, transition:'all 0.15s',
  })
  const pillBtn = (a: boolean): React.CSSProperties => ({
    padding:'5px 12px', borderRadius:20,
    border:`1.5px solid ${a?C.caramel:C.border}`,
    background:a?C.caramel:'transparent',
    color:a?C.white:C.muted, cursor:'pointer',
    fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
  })
  const toggleBtn = (a: boolean): React.CSSProperties => ({
    padding:'7px 14px', border:`1.5px solid ${a?C.caramel:C.border}`,
    background:a?C.caramel:'transparent', color:a?C.white:C.muted,
    cursor:'pointer', fontSize:12, fontWeight:600,
    fontFamily:"'DM Sans',sans-serif", borderRadius:0, transition:'all 0.15s',
  })

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',gap:14,fontFamily:"'DM Sans',sans-serif",color:C.muted}}>
      <Spinner/> Daten werden geladen…
    </div>
  )
  if (error) return (
    <div style={{padding:40,fontFamily:"'DM Sans',sans-serif",color:C.red}}>
      Fehler: {error} <button onClick={reload} style={{marginLeft:12,padding:'6px 14px',background:C.espresso,color:C.white,border:'none',borderRadius:6,cursor:'pointer'}}>Neu laden</button>
    </div>
  )

  /* ── CSS ─────────────────────────────────────────────────── */
  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
input:focus,select:focus{border-color:${C.caramel}!important;outline:none}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
input[type=number]{-moz-appearance:textfield}
.dbt{background:none;border:none;cursor:pointer;color:${C.muted};font-size:14px;padding:2px 8px;border-radius:4px;transition:all 0.1s}
.dbt:hover{color:${C.red};background:#FEE2E2}
.abt{background:none;border:1.5px dashed ${C.caramel};color:${C.caramel};border-radius:8px;padding:8px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;width:100%;margin-top:6px;transition:background 0.15s}
.abt:hover{background:${C.vanilla}}
.prodcard{border:2px solid transparent;border-radius:9px;padding:9px 12px;cursor:pointer;transition:all 0.15s;background:#FFFDF8;margin-bottom:7px}
.prodcard:hover{border-color:${C.border};background:#FFF8EE}
.prodcard.active{border-color:${C.caramel};background:#FFF3E0}
tr:hover td{background:#FFFBF5!important}
.toggle-group{display:flex;border-radius:8px;overflow:hidden;border:1.5px solid ${C.border}}
.toggle-group button:first-child{border-right:1px solid ${C.border}}
.fade{animation:fadeIn 0.2s ease}
.toast{position:fixed;top:20px;right:24px;padding:11px 20px;background:${C.espresso};color:${C.vanilla};border-radius:10px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;z-index:9999;animation:slideIn 0.25s ease;box-shadow:0 4px 16px rgba(0,0,0,0.25)}
`

  /* ── RENDER ──────────────────────────────────────────────── */
  return (
    <div style={{minHeight:'100vh',background:C.cream,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* HEADER */}
      <div style={{background:C.espresso,padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`3px solid ${C.caramel}`,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",color:C.vanilla,fontSize:20,fontWeight:700}}>Eiscafé Simonetti</div>
          <div style={{color:C.caramel,fontSize:11,letterSpacing:'2px',textTransform:'uppercase',marginTop:1}}>Produktdeckungskalkulation</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          {/* Umlage-Umschalter */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
            <span style={{fontSize:10,color:C.sand,letterSpacing:'0.8px',textTransform:'uppercase'}}>Fixkosten-Umlage</span>
            <div className="toggle-group">
              <button style={toggleBtn(einst?.umlage_modus==='portion')}
                onClick={()=>run(()=>saveEinstellungen({umlage_modus:'portion'}))}>
                Nach Menge
              </button>
              <button style={toggleBtn(einst?.umlage_modus==='gleich')}
                onClick={()=>run(()=>saveEinstellungen({umlage_modus:'gleich'}))}>
                Pauschal je Produkt
              </button>
            </div>
          </div>
          {/* Globale Parameter */}
          <div style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.07)',borderRadius:8,padding:'6px 10px'}}>
            <span style={{fontSize:11,color:C.sand}}>Ziel-DB</span>
            <input type="range" min={30} max={80} step={1} value={einst?.ziel_marge??62}
              onChange={e=>{
                const v = Number(e.target.value)
                setLocalEinst(p=>({...p,ziel_marge:v}))
                clearTimeout((window as any)._margeTmr)
                ;(window as any)._margeTmr = setTimeout(()=>saveEinstellungen({ziel_marge:v}),600)
              }}
              style={{width:80,accentColor:C.caramel}}/>
            <span style={{fontSize:13,fontWeight:700,color:C.vanilla,minWidth:38}}>{PCT(einst?.ziel_marge??62)}</span>
            <span style={{fontSize:11,color:C.muted,marginLeft:4}}>MwSt.</span>
            <input type="number" value={einst?.mwst_ausser??7}
              onChange={e=>{ const v=Number(e.target.value); setLocalEinst(p=>({...p,mwst_ausser:v})); setTimeout(()=>saveEinstellungen({mwst_ausser:v}),600) }}
              style={{...inp,width:42,padding:'4px 6px',background:'rgba(255,255,255,0.1)',color:C.vanilla,border:'1px solid #4A2010',textAlign:'center'}}/>
            <span style={{fontSize:11,color:C.muted}}>/</span>
            <input type="number" value={einst?.mwst_vor_ort??19}
              onChange={e=>{ const v=Number(e.target.value); setLocalEinst(p=>({...p,mwst_vor_ort:v})); setTimeout(()=>saveEinstellungen({mwst_vor_ort:v}),600) }}
              style={{...inp,width:42,padding:'4px 6px',background:'rgba(255,255,255,0.1)',color:C.vanilla,border:'1px solid #4A2010',textAlign:'center'}}/>
            <span style={{fontSize:11,color:C.muted}}>%</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#4ADE80',display:'inline-block'}}/>
            <span style={{fontSize:11,color:'#4ADE80'}}>Supabase live</span>
          </div>
        </div>
      </div>

      {/* MAIN TABS */}
      <div style={{background:C.vanilla,borderBottom:`1px solid ${C.border}`,padding:'8px 28px',display:'flex',gap:5,flexWrap:'wrap'}}>
        {([['produkte','Produkte & Kalkulation'],['zutaten','Zutaten-Datenbank'],['betrieb','Betriebskosten'],['basis','🧪 Basis-Rezepte'],['uebersicht','Gesamtübersicht']] as const).map(([k,l])=>(
          <button key={k} style={mTabBtn(mainTab===k)} onClick={()=>setMainTab(k as any)}>{l}</button>
        ))}
        <div style={{marginLeft:'auto',fontSize:12,color:C.muted,alignSelf:'center'}}>
          {zutaten.length} Zutaten · {produkte.length} Produkte · {EUR(betriebGesamt)}/Mo.
        </div>
      </div>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'20px 16px'}}>

        {/* ═══ TAB: PRODUKTE ══════════════════════════════════════════════ */}
        {mainTab==='produkte' && prod && kalk && (
          <div style={{display:'grid',gridTemplateColumns:'220px 1fr 285px',gap:17}} className="fade">

            {/* Sidebar */}
            <div style={card}>
              <div style={{...cH,paddingBottom:10}}>
                <span style={cT}>Produkte</span>
              </div>
              <div style={{padding:'8px 9px',overflowY:'auto',maxHeight:'calc(100vh - 200px)'}}>
                {PROD_KATS.map(kat => {
                  const items = produkte.filter(p=>p.prod_kategorie===kat.key)
                  return (
                    <div key={kat.key} style={{marginBottom:13}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 3px 5px'}}>
                        <span style={{fontSize:10,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:C.muted}}>{kat.icon} {kat.label}</span>
                        <button onClick={()=>addProdukt(kat.key as ProdKat)} disabled={saving}
                          style={{background:'none',border:'none',cursor:'pointer',color:C.caramel,fontSize:18,lineHeight:1,fontWeight:300}}>+</button>
                      </div>
                      {items.map(p => (
                        <div key={p.id} className={`prodcard${aktivProd===p.id||(!aktivProd&&p===produkte[0])?' active':''}`}
                          onClick={()=>setAktivProd(p.id)}>
                          <div style={{fontWeight:600,fontSize:13,color:C.espresso}}>{p.name}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{(p.verkauf_monat??0).toLocaleString('de-DE')} Port./Mo.</div>
                        </div>
                      ))}
                      {!items.length && (
                        <div onClick={()=>addProdukt(kat.key as ProdKat)}
                          style={{border:`1.5px dashed ${C.border}`,borderRadius:9,padding:8,textAlign:'center',cursor:'pointer',fontSize:11,color:C.muted}}>
                          + hinzufügen
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Editor */}
            <div style={{display:'flex',flexDirection:'column',gap:13}}>

              {/* Produkt-Meta */}
              <div style={card}>
                <div style={cH}>
                  <span style={cT}>{prod.name}</span>
                  <div style={{display:'flex',gap:8}}>
                    {saving && <Spinner/>}
                    <button onClick={()=>run(()=>deleteProdukt(prod.id),'Produkt gelöscht')}
                      style={{background:'#FEE2E2',border:'none',borderRadius:6,padding:'4px 12px',color:C.red,cursor:'pointer',fontSize:11,fontWeight:600}}>
                      Löschen
                    </button>
                  </div>
                </div>
                <div style={{padding:'13px 17px',display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
                  <div style={{flex:2,minWidth:150}}>
                    <label style={lbl}>Produktname</label>
                    <input style={inp} value={prod.name}
                      onChange={e=>saveProdukt({id:prod.id,name:e.target.value})}/>
                  </div>
                  <div style={{flex:1,minWidth:130}}>
                    <label style={lbl}>Kategorie</label>
                    <select style={{...inp,padding:'8px 11px'}} value={prod.prod_kategorie}
                      onChange={e=>run(()=>saveProdukt({id:prod.id,prod_kategorie:e.target.value as ProdKat}),'Gespeichert')}>
                      {PROD_KATS.map(k=><option key={k.key} value={k.key}>{k.icon} {k.label}</option>)}
                    </select>
                  </div>
                  <div style={{flex:1,minWidth:110}}>
                    <label style={lbl}>Portionen/Monat</label>
                    <input type="number" style={inp} value={prod.verkauf_monat??0}
                      onChange={e=>saveProdukt({id:prod.id,verkauf_monat:parseInt(e.target.value)||0})}/>
                  </div>
                  {prod.prod_kategorie==='eis' && (
                    <div style={{flex:2,minWidth:230}}>
                      <label style={lbl}>Portionsgröße</label>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                        {PORTIONEN.filter(p=>p.key!=='1').map(p=>(
                          <button key={p.key} style={pillBtn(prod.port_key===p.key)}
                            onClick={()=>run(()=>saveProdukt({id:prod.id,port_key:p.key as PortKey}),'Gespeichert')}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Tabs */}
              <div style={{display:'flex',gap:5}}>
                {([['rezept','Zutaten & Rezept'],['detail','Kalkulations-Detail']] as const).map(([k,l])=>(
                  <button key={k} style={sTabBtn(prodTab===k)} onClick={()=>setProdTab(k)}>{l}</button>
                ))}
              </div>

              {/* Zutaten-Tab */}
              {prodTab==='rezept' && (
                <div style={card} className="fade">
                  <div style={cH}>
                    <span style={cT}>Zutaten & Wareneinsatz</span>
                    <span style={{fontSize:11,color:C.muted}}>Preise aus zentraler Datenbank — Änderung wirkt auf alle Rezepte</span>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead><tr>
                        <th style={th}>Zutat</th>
                        <th style={th}>Preis/Einheit</th>
                        <th style={{...th,textAlign:'right'}}>Menge</th>
                        <th style={th}>Einheit</th>
                        <th style={{...th,textAlign:'right'}}>Schwund %</th>
                        <th style={{...th,textAlign:'right'}}>Kosten</th>
                        <th style={th}/>
                      </tr></thead>
                      <tbody>
                        {(prod.rezept_positionen??[]).map(pos => {
                          const portFaktor = PORTIONEN.find(p=>p.key===prod.port_key)?.faktor??1
                          const z = pos.zutat
                          const preis = z?.preis_netto ?? 0
                          const kosten = pos.menge * preis * portFaktor / (1-(pos.schwund_pct??0)/100)
                          return (
                            <tr key={pos.id}>
                              <td style={td}>
                                <select style={{...sel,width:160}} value={pos.zutat_id??''}
                                  onChange={e=>{
                                    const z2 = zutaten.find(z=>z.id===e.target.value)
                                    run(()=>saveRezeptPosition({
                                      id:pos.id, zutat_id:e.target.value,
                                      zutat_name:z2?.name, einheit:z2?.einheit??pos.einheit,
                                    }))
                                  }}>
                                  {zutaten.map(z2=><option key={z2.id} value={z2.id}>{z2.name}</option>)}
                                </select>
                              </td>
                              <td style={{...td,fontSize:11,color:C.muted}}>{EUR(preis)}/{pos.einheit}</td>
                              <td style={{...td,textAlign:'right'}}>
                                <TdInput type="number" step="0.001" value={pos.menge} width={65} align="right"
                                  onChange={v=>saveRezeptPosition({id:pos.id,menge:parseFloat(v)||0})}/>
                              </td>
                              <td style={td}><span style={{fontSize:12,color:C.muted}}>{pos.einheit}</span></td>
                              <td style={{...td,textAlign:'right'}}>
                                <TdInput type="number" step="1" value={pos.schwund_pct??0} width={50} align="right"
                                  onChange={v=>saveRezeptPosition({id:pos.id,schwund_pct:parseFloat(v)||0})}/>
                              </td>
                              <td style={{...td,textAlign:'right',fontWeight:600,color:C.caramel}}>{EUR(kosten)}</td>
                              <td style={td}><button className="dbt" onClick={()=>run(()=>deleteRezeptPosition(pos.id),'Zutat entfernt')}>×</button></td>
                            </tr>
                          )
                        })}
                        <tr style={{background:C.vanilla}}>
                          <td colSpan={5} style={{...td,fontWeight:700,paddingTop:12}}>Wareneinsatz gesamt ({portion?.label??'1 Portion'})</td>
                          <td style={{...td,fontWeight:700,fontSize:14,color:C.caramel,textAlign:'right',paddingTop:12}}>{EUR(kalk.wareneinsatz)}</td>
                          <td/>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{padding:'5px 13px 12px'}}>
                    <button className="abt" onClick={()=>addPosition(prod.id)}>+ Zutat hinzufügen</button>
                  </div>
                </div>
              )}

              {/* Detail-Tab */}
              {prodTab==='detail' && (
                <div style={card} className="fade">
                  <div style={cH}><span style={cT}>Schritt-für-Schritt Kalkulation</span></div>
                  <div style={{padding:'14px 17px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                      <tbody>
                        {[
                          ['Wareneinsatz (Rezept)',              EUR(kalk.wareneinsatz),      '', ''],
                          ['+ Betriebskosten / Portion',        EUR(kalk.fix_pro_portion),   einst?.umlage_modus==='portion'?'Nach Menge':'Pauschal je Produkt', ''],
                          ['= Selbstkosten gesamt',             EUR(kalk.selbstkosten),       '', 'bold'],
                          ['Ziel-Deckungsbeitrag',              PCT(einst?.ziel_marge??62),  '', ''],
                          ['→ Mindest-Netto-VK',                EUR(kalk.netto_min_vk),      '', ''],
                          [`+ MwSt. ${einst?.mwst_ausser??7}% (Außer-Haus)`, EUR(kalk.brutto_ausser - kalk.netto_min_vk), '', ''],
                          ['Empfohlener VK (auf 10ct)',         EUR(kalk.empf_vk),           'Preisempfehlung', 'highlight'],
                          [`Vor-Ort-Preis (${einst?.mwst_vor_ort??19}% MwSt.)`, EUR(kalk.empf_vk_vor_ort), '', ''],
                        ].map(([l,v,hint,st])=>(
                          <tr key={l} style={{background:st==='highlight'?C.vanilla:st==='bold'?'#FFFBF5':'transparent'}}>
                            <td style={{...td,fontWeight:st==='bold'||st==='highlight'?700:400,color:C.coffee}}>{l}</td>
                            <td style={{...td,textAlign:'right',fontWeight:st==='bold'||st==='highlight'?700:500,
                              fontSize:st==='highlight'?17:13,
                              color:st==='highlight'?C.caramel:C.espresso,
                              fontFamily:st==='highlight'?"'Playfair Display',serif":"'DM Sans',sans-serif"}}>{v}</td>
                            <td style={{...td,fontSize:10,color:C.muted,textAlign:'right'}}>{hint}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{marginTop:12,padding:'10px 12px',background:'#D1FAE5',borderRadius:8,fontSize:12,color:C.green}}>
                      DB pro Portion: <strong>{EUR(kalk.db_pro_portion)}</strong> · Bei {(prod.verkauf_monat??0).toLocaleString('de-DE')} Portionen/Monat = <strong>{EUR(kalk.db_monat)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rechtes Panel */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Preis-Box */}
              <div style={{background:C.espresso,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'18px 18px 14px'}}>
                  <div style={{fontSize:10,color:C.caramel,letterSpacing:'1.5px',textTransform:'uppercase',fontWeight:600,marginBottom:7}}>
                    Mindest-VK · {prod.name}
                  </div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:700,color:C.vanilla,lineHeight:1}}>
                    {EUR(kalk.empf_vk)}
                  </div>
                  <div style={{fontSize:12,color:C.sand,marginTop:4}}>{portion?.label??'1 Portion'} · {einst?.mwst_ausser??7}% MwSt.</div>
                  <div style={{fontSize:11,color:'#6B4C35',marginTop:2}}>Vor-Ort: {EUR(kalk.empf_vk_vor_ort)} ({einst?.mwst_vor_ort??19}% MwSt.)</div>
                  <div style={{marginTop:13,paddingTop:13,borderTop:'1px solid #3B2010'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{color:C.sand,fontSize:12}}>Ist-Marge</span>
                      <Bdg color={kalk.ist_marge>=60?'green':kalk.ist_marge>=45?'amber':'red'}>{PCT(kalk.ist_marge)}</Bdg>
                    </div>
                    <Bar value={kalk.ist_marge} color={kalk.ist_marge>=60?'#4ADE80':kalk.ist_marge>=45?'#FCD34D':'#F87171'}/>
                  </div>
                </div>
              </div>

              {/* Kostenstruktur */}
              <div style={card}>
                <div style={cH}><span style={cT}>Kostenstruktur</span></div>
                <div style={{padding:'12px 15px'}}>
                  {[
                    {l:'Wareneinsatz',   v:kalk.wareneinsatz,    color:C.caramel},
                    {l:'Betriebskosten', v:kalk.fix_pro_portion, color:C.blue},
                  ].map(m=>(
                    <div key={m.l} style={{marginBottom:11}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                        <span style={{color:C.muted}}>{m.l}</span>
                        <span style={{fontWeight:600}}>{EUR(m.v)} <span style={{fontWeight:400,color:C.muted,fontSize:11}}>({PCT(kalk.selbstkosten>0?(m.v/kalk.selbstkosten)*100:0)})</span></span>
                      </div>
                      <Bar value={kalk.selbstkosten>0?(m.v/kalk.selbstkosten)*100:0} color={m.color}/>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 7px',background:C.vanilla,borderRadius:6,marginTop:6}}>
                    <span style={{fontSize:12,fontWeight:700}}>Selbstkosten</span>
                    <span style={{fontSize:14,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{EUR(kalk.selbstkosten)}</span>
                  </div>
                </div>
              </div>

              {/* Umlage-Info */}
              <div style={{...card,padding:'12px 15px',background:'#FFFBF0',border:`1px solid ${C.sand}`}}>
                <div style={{fontSize:11,fontWeight:700,color:C.amber,marginBottom:5}}>
                  Fixkosten-Umlage ({einst?.umlage_modus==='portion'?'Nach Menge':'Pauschal je Produkt'})
                </div>
                {einst?.umlage_modus==='portion' ? (
                  <div style={{fontSize:12,color:C.coffee,lineHeight:1.7}}>
                    {EUR(betriebGesamt)} ÷ {gesamtPortionen.toLocaleString('de-DE')} Port.<br/>
                    = <strong>{EUR(kalk.fix_pro_portion)}</strong> pro Portion
                  </div>
                ) : (
                  <div style={{fontSize:12,color:C.coffee,lineHeight:1.7}}>
                    {EUR(betriebGesamt)} ÷ {produkte.length} Produkte<br/>
                    = {EUR(betriebGesamt/Math.max(produkte.length,1))}/Produkt<br/>
                    ÷ {prod.verkauf_monat??0} Port. = <strong>{EUR(kalk.fix_pro_portion)}</strong>/Port.
                  </div>
                )}
              </div>

              {/* Monatliche Hochrechnung */}
              <div style={card}>
                <div style={cH}><span style={cT}>Monatliche Hochrechnung</span></div>
                <div style={{padding:'11px 14px'}}>
                  {[
                    ['Portionen/Monat', `${(prod.verkauf_monat??0).toLocaleString('de-DE')}×`],
                    ['Brutto-Umsatz',   EUR(kalk.empf_vk*(prod.verkauf_monat??0))],
                    ['DB gesamt',       EUR(kalk.db_monat)],
                    ['Fixkostendeckung',EUR(kalk.fix_pro_portion*(prod.verkauf_monat??0))],
                  ].map(([l,v])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.cream}`}}>
                      <span style={{fontSize:12,color:C.muted}}>{l}</span>
                      <span style={{fontSize:13,fontWeight:600}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: ZUTATEN-DATENBANK ═════════════════════════════════════ */}
        {mainTab==='zutaten' && (
          <div className="fade">
            <div style={card}>
              <div style={cH}>
                <span style={cT}>Zentrale Zutaten-Datenbank</span>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,color:C.muted}}>Preisänderung wirkt sofort auf alle Rezepte</span>
                  <SaveBtn onClick={()=>saveZutat({name:'Neue Zutat',einheit:'kg',kategorie:'Rohstoffe',preis_netto:0})} saving={saving}>
                    + Zutat anlegen
                  </SaveBtn>
                </div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr>
                    <th style={th}>Name</th>
                    <th style={th}>Kategorie</th>
                    <th style={th}>Einheit</th>
                    <th style={{...th,textAlign:'right'}}>Preis netto</th>
                    <th style={th}>Lieferant</th>
                    <th style={th}>Artikel-Nr.</th>
                    <th style={th}/>
                  </tr></thead>
                  <tbody>
                    {zutaten.map(z => (
                      <tr key={z.id}>
                        <td style={td}>
                          <TdInput value={z.name} width={160}
                            onChange={v=>saveZutat({id:z.id,name:v})}/>
                        </td>
                        <td style={td}>
                          <select style={sel} value={z.kategorie}
                            onChange={e=>saveZutat({id:z.id,kategorie:e.target.value as any})}>
                            {['Rohstoffe','Verpackung','Personal','Energie','Miete','Sonstiges'].map(k=><option key={k}>{k}</option>)}
                          </select>
                        </td>
                        <td style={td}>
                          <select style={sel} value={z.einheit}
                            onChange={e=>saveZutat({id:z.id,einheit:e.target.value as any})}>
                            {['kg','g','L','ml','Stk','EL','TL','Scheibe','Portion'].map(u=><option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={{...td,textAlign:'right'}}>
                          <TdInput type="number" step="0.01" value={z.preis_netto} width={75} align="right"
                            onChange={v=>saveZutat({id:z.id,preis_netto:parseFloat(v)||0})}/>
                          <span style={{fontSize:11,color:C.muted,marginLeft:4}}>€</span>
                        </td>
                        <td style={td}>
                          <TdInput value={z.lieferant??''} width={100}
                            onChange={v=>saveZutat({id:z.id,lieferant:v})}/>
                        </td>
                        <td style={td}>
                          <TdInput value={z.artikelnr??''} width={80}
                            onChange={v=>saveZutat({id:z.id,artikelnr:v})}/>
                        </td>
                        <td style={td}><button className="dbt" onClick={()=>run(()=>deleteZutat(z.id),'Zutat deaktiviert')}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{padding:'10px 16px',background:'#FFFEF5',borderTop:`1px solid ${C.border}`,fontSize:12,color:C.muted}}>
                💡 Wenn du den Preis einer Zutat änderst, wird die Kalkulation aller Produkte die diese Zutat nutzen sofort aktualisiert.
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: BETRIEBSKOSTEN ════════════════════════════════════════ */}
        {mainTab==='betrieb' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:17}} className="fade">
            <div style={card}>
              <div style={cH}>
                <span style={cT}>Monatliche Betriebskosten</span>
                <SaveBtn onClick={()=>run(()=>saveBetriebskosten({name:'Neuer Posten',betrag:100,kategorie:'Sonstiges',aktiv:true}),'Hinzugefügt')} saving={saving}>
                  + Hinzufügen
                </SaveBtn>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr>
                    <th style={th}>Kostenart</th>
                    <th style={th}>Kategorie</th>
                    <th style={{...th,textAlign:'right'}}>€ / Monat</th>
                    <th style={{...th,textAlign:'right'}}>Anteil</th>
                    <th style={th}/>
                  </tr></thead>
                  <tbody>
                    {betriebskosten.map(b => (
                      <tr key={b.id}>
                        <td style={td}><TdInput value={b.name} width={220} onChange={v=>saveBetriebskosten({id:b.id,name:v})}/></td>
                        <td style={td}>
                          <select style={sel} value={b.kategorie}
                            onChange={e=>saveBetriebskosten({id:b.id,kategorie:e.target.value})}>
                            {['Miete','Energie','Versicherung','Personal','Verwaltung','Unternehmerlohn','Sonstiges'].map(k=><option key={k}>{k}</option>)}
                          </select>
                        </td>
                        <td style={{...td,textAlign:'right'}}>
                          <TdInput type="number" step="10" value={b.betrag} width={90} align="right"
                            onChange={v=>saveBetriebskosten({id:b.id,betrag:parseFloat(v)||0})}/>
                        </td>
                        <td style={{...td,textAlign:'right',color:C.muted,fontSize:12}}>
                          {betriebGesamt>0 ? PCT((b.betrag/betriebGesamt)*100) : '—'}
                        </td>
                        <td style={td}><button className="dbt" onClick={()=>run(()=>deleteBetriebskosten(b.id),'Gelöscht')}>×</button></td>
                      </tr>
                    ))}
                    <tr style={{background:C.vanilla}}>
                      <td colSpan={2} style={{...td,fontWeight:700,paddingTop:12}}>Gesamt / Monat</td>
                      <td style={{...td,fontWeight:700,fontSize:17,color:C.caramel,textAlign:'right',fontFamily:"'Playfair Display',serif",paddingTop:12}}>{EUR(betriebGesamt)}</td>
                      <td colSpan={2}/>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{padding:'10px 16px 12px',background:'#FFFEF5',borderTop:`1px solid ${C.border}`,fontSize:12,color:C.muted}}>
                💡 Personal ist in der Gastronomie meist der größte Fixkostenpunkt — und der Unternehmerlohn muss immer eingeplant sein!
              </div>
            </div>

            {/* Rechts: Struktur + Break-Even */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={card}>
                <div style={cH}><span style={cT}>Struktur nach Kategorie</span></div>
                <div style={{padding:'12px 15px'}}>
                  {Object.entries(
                    betriebskosten.reduce((acc,b)=>{acc[b.kategorie]=(acc[b.kategorie]||0)+b.betrag;return acc;},{} as Record<string,number>)
                  ).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
                    <div key={k} style={{marginBottom:11}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                        <span style={{color:C.muted,fontWeight:600}}>{k}</span>
                        <span style={{fontWeight:700}}>{EUR(v)}</span>
                      </div>
                      <Bar value={betriebGesamt>0?(v/betriebGesamt)*100:0}
                        color={k==='Unternehmerlohn'?C.green:k==='Personal'?C.blue:k==='Miete'?C.caramel:C.muted}/>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:C.espresso,borderRadius:12,padding:'16px'}}>
                <div style={{fontSize:10,color:C.caramel,letterSpacing:'1.5px',textTransform:'uppercase',fontWeight:600,marginBottom:8}}>Break-Even</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:C.vanilla}}>
                  {Math.ceil(betriebGesamt/Math.max(avgDB,0.01)).toLocaleString('de-DE')}
                </div>
                <div style={{fontSize:11,color:C.sand,marginTop:3}}>Portionen/Monat um alle Kosten zu decken</div>
                <div style={{marginTop:8,fontSize:12,color:gesamtPortionen>=betriebGesamt/Math.max(avgDB,0.01)?'#4ADE80':'#F87171'}}>
                  {gesamtPortionen>=betriebGesamt/Math.max(avgDB,0.01)
                    ? `✓ Geplant: ${gesamtPortionen.toLocaleString('de-DE')} — Break-Even erreicht`
                    : `✗ Geplant: ${gesamtPortionen.toLocaleString('de-DE')} — noch ${Math.ceil(betriebGesamt/Math.max(avgDB,0.01)-gesamtPortionen).toLocaleString('de-DE')} fehlen`
                  }
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ═══ TAB: BASIS-REZEPTE ════════════════════════════════════════ */}
        {mainTab==='basis' && (
          <div style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:17}} className="fade">

            {/* Sidebar */}
            <div style={card}>
              <div style={cH}>
                <span style={cT}>Basis-Rezepte</span>
                <button onClick={async ()=>{
                  const res = await saveBasis({name:'Neue Basis', ergibt_menge:1000, ergibt_einheit:'g'}) as any
                  await reload()
                  if (res?.id) setAktivBasis(res.id)
                }} disabled={saving}
                  style={{background:'none',border:'none',cursor:'pointer',color:C.caramel,fontSize:20,fontWeight:300}}>+</button>
              </div>
              <div style={{padding:'8px 9px'}}>
                {basisRezepte.map(b => {
                  const kostenProG = calcBasisKosten(b)
                  return (
                    <div key={b.id}
                      className={`prodcard${aktivBasis===b.id?' active':''}`}
                      onClick={()=>setAktivBasis(b.id)}>
                      <div style={{fontWeight:600,fontSize:13,color:C.espresso}}>{b.name}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                        {b.ergibt_menge}{b.ergibt_einheit} · {(kostenProG*1000).toFixed(4)} €/kg
                      </div>
                    </div>
                  )
                })}
                {basisRezepte.length === 0 && (
                  <div style={{textAlign:'center',padding:'20px 10px',color:C.muted,fontSize:12}}>
                    Noch keine Basis-Rezepte
                  </div>
                )}
              </div>
            </div>

            {/* Editor */}
            {(() => {
              const basis = basisRezepte.find(b => b.id === aktivBasis) ?? basisRezepte[0] ?? null
              if (!basis) return (
                <div style={{...card,display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontSize:13}}>
                  Basis-Rezept auswählen oder erstellen
                </div>
              )
              const kostenProG = calcBasisKosten(basis)
              const gesamtkosten = (basis.basis_positionen ?? []).reduce((sum, pos) => {
                const preis = (pos.zutat as any)?.preis_netto ?? 0
                return sum + pos.menge * preis / (1-(pos.schwund_pct??0)/100)
              }, 0)
              return (
                <div style={{display:'flex',flexDirection:'column',gap:13}}>
                  {/* Meta */}
                  <div style={card}>
                    <div style={cH}>
                      <span style={cT}>{basis.name}</span>
                      <button onClick={()=>run(()=>deleteBasis(basis.id),'Basis gelöscht')}
                        style={{background:'#FEE2E2',border:'none',borderRadius:6,padding:'4px 12px',color:C.red,cursor:'pointer',fontSize:11,fontWeight:600}}>
                        Löschen
                      </button>
                    </div>
                    <div style={{padding:'13px 17px',display:'flex',gap:12,flexWrap:'wrap'}}>
                      <div style={{flex:2,minWidth:150}}>
                        <label style={lbl}>Name</label>
                        <TdInput value={basis.name} width={220} delay={800}
                          onChange={v=>saveBasis({id:basis.id, name:v})}/>
                      </div>
                      <div style={{flex:1,minWidth:100}}>
                        <label style={lbl}>Ergibt Menge</label>
                        <TdInput type="number" value={basis.ergibt_menge} width={100} delay={800}
                          onChange={v=>saveBasis({id:basis.id, ergibt_menge:parseFloat(v)||0})}/>
                      </div>
                      <div style={{flex:1,minWidth:80}}>
                        <label style={lbl}>Einheit</label>
                        <select style={{...sel,padding:'8px 11px'}} value={basis.ergibt_einheit}
                          onChange={e=>saveBasis({id:basis.id, ergibt_einheit:e.target.value})}>
                          {['g','kg','L','ml','Stk'].map(u=><option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Zutaten der Basis */}
                  <div style={card}>
                    <div style={cH}>
                      <span style={cT}>Zutaten</span>
                      <div style={{fontSize:12,color:C.muted}}>
                        Gesamtkosten: <strong style={{color:C.caramel}}>{gesamtkosten.toFixed(4)} €</strong>
                        &nbsp;·&nbsp;
                        <strong style={{color:C.caramel}}>{(kostenProG*1000).toFixed(4)} €/kg</strong>
                      </div>
                    </div>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                        <thead><tr>
                          <th style={th}>Zutat</th>
                          <th style={{...th,textAlign:'right'}}>Menge</th>
                          <th style={th}>Einheit</th>
                          <th style={{...th,textAlign:'right'}}>Schwund %</th>
                          <th style={{...th,textAlign:'right'}}>Preis/Einheit</th>
                          <th style={{...th,textAlign:'right'}}>Kosten</th>
                          <th style={th}/>
                        </tr></thead>
                        <tbody>
                          {(basis.basis_positionen ?? []).map(pos => {
                            const preis = (pos.zutat as any)?.preis_netto ?? 0
                            const kosten = pos.menge * preis / (1-(pos.schwund_pct??0)/100)
                            return (
                              <tr key={pos.id}>
                                <td style={td}>
                                  <select style={{...sel,width:160}} value={pos.zutat_id??''}
                                    onChange={e=>{
                                      const z2 = zutaten.find(z=>z.id===e.target.value)
                                      saveBasisPosition({id:pos.id, zutat_id:e.target.value, zutat_name:z2?.name, einheit:z2?.einheit??pos.einheit})
                                    }}>
                                    {zutaten.map(z2=><option key={z2.id} value={z2.id}>{z2.name}</option>)}
                                  </select>
                                </td>
                                <td style={{...td,textAlign:'right'}}>
                                  <TdInput type="number" step="0.001" value={pos.menge} width={70} align="right"
                                    onChange={v=>saveBasisPosition({id:pos.id, menge:parseFloat(v)||0})}/>
                                </td>
                                <td style={td}>
                                  <select style={sel} value={pos.einheit}
                                    onChange={e=>saveBasisPosition({id:pos.id, einheit:e.target.value})}>
                                    {['g','kg','L','ml','Stk','EL','TL'].map(u=><option key={u}>{u}</option>)}
                                  </select>
                                </td>
                                <td style={{...td,textAlign:'right'}}>
                                  <TdInput type="number" step="1" value={pos.schwund_pct??0} width={50} align="right"
                                    onChange={v=>saveBasisPosition({id:pos.id, schwund_pct:parseFloat(v)||0})}/>
                                </td>
                                <td style={{...td,textAlign:'right',color:C.muted,fontSize:11}}>{preis.toFixed(4)} €</td>
                                <td style={{...td,textAlign:'right',fontWeight:600,color:C.caramel}}>{kosten.toFixed(4)} €</td>
                                <td style={td}><button className="dbt" onClick={()=>deleteBasisPosition(pos.id)}>×</button></td>
                              </tr>
                            )
                          })}
                          <tr style={{background:C.vanilla}}>
                            <td colSpan={5} style={{...td,fontWeight:700}}>Gesamt → {basis.ergibt_menge} {basis.ergibt_einheit}</td>
                            <td style={{...td,fontWeight:700,fontSize:14,color:C.caramel,textAlign:'right'}}>{gesamtkosten.toFixed(4)} €</td>
                            <td/>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{padding:'5px 13px 12px'}}>
                      <button className="abt" onClick={async ()=>{
                        const firstZutat = zutaten[0]
                        if (!firstZutat) { showToast('Zuerst Zutaten anlegen'); return }
                        await saveBasisPosition({
                          basis_id: basis.id,
                          zutat_id: firstZutat.id,
                          zutat_name: firstZutat.name,
                          einheit: firstZutat.einheit,
                          menge: 100,
                          schwund_pct: 0,
                          sort_order: (basis.basis_positionen?.length ?? 0) + 1,
                        })
                      }}>+ Zutat hinzufügen</button>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div style={{padding:'14px 17px',background:'#FFFBF0',border:`1px solid ${C.sand}`,borderRadius:10,fontSize:13,color:C.coffee}}>
                    💡 <strong>Verwendung in Produkten:</strong> Wähle im Produkt-Rezept diese Basis als Zutat aus.
                    Der Preis wird automatisch aus dem Rezept berechnet: <strong>{(kostenProG*1000).toFixed(4)} €/kg</strong>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ═══ TAB: GESAMTÜBERSICHT ════════════════════════════════════════ */}
        {mainTab==='uebersicht' && (
          <div className="fade">
            {/* KPI */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:18}}>
              {[
                {l:'Monatl. Umsatz (Plan)', v:EUR(monatUmsatz),           sub:'bei empf. Preisen',    col:C.green},
                {l:'Betriebskosten/Monat',  v:EUR(betriebGesamt),         sub:`${betriebskosten.length} Positionen`, col:C.red},
                {l:'DB gesamt (Plan)',       v:EUR(monatDB),               sub:'netto alle Produkte',  col:C.caramel},
                {l:'Gewinn nach Kosten',     v:EUR(monatDB-betriebGesamt), sub:'monatl. Planung',      col:monatDB>betriebGesamt?C.green:C.red},
              ].map(k=>(
                <div key={k.l} style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:'15px 17px'}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:7}}>{k.l}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:k.col}}>{k.v}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Tabelle */}
            <div style={card}>
              <div style={cH}>
                <span style={cT}>Alle Produkte — Deckungsbeitrags-Analyse</span>
                <span style={{fontSize:12,color:C.muted}}>Ø DB: {EUR(avgDB)}/Portion · Klick → Produkt öffnen</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr>
                    <th style={th}>Produkt</th>
                    <th style={th}>Kat.</th>
                    <th style={{...th,textAlign:'right'}}>Warenk.</th>
                    <th style={{...th,textAlign:'right'}}>Fix/Port.</th>
                    <th style={{...th,textAlign:'right'}}>Selbstk.</th>
                    <th style={{...th,textAlign:'right'}}>Min-VK</th>
                    <th style={{...th,textAlign:'right'}}>DB/Port.</th>
                    <th style={{...th,textAlign:'right'}}>Port./Mo.</th>
                    <th style={{...th,textAlign:'right'}}>DB/Monat</th>
                    <th style={{...th,textAlign:'right'}}>Marge</th>
                    <th style={{...th,textAlign:'center'}}>Status</th>
                  </tr></thead>
                  <tbody>
                    {overview.map(({k,p})=>{
                      const cl = classifyProdukt(k, avgDB)
                      const kat = PROD_KATS.find(x=>x.key===p.prod_kategorie)
                      return (
                        <tr key={p.id} style={{cursor:'pointer'}}
                          onClick={()=>{setAktivProd(p.id);setMainTab('produkte')}}>
                          <td style={{...td,fontWeight:600}}>{p.name}</td>
                          <td style={{...td,fontSize:15}}>{kat?.icon}</td>
                          <td style={{...td,textAlign:'right'}}>{EUR(k.wareneinsatz)}</td>
                          <td style={{...td,textAlign:'right'}}>{EUR(k.fix_pro_portion)}</td>
                          <td style={{...td,textAlign:'right',fontWeight:600}}>{EUR(k.selbstkosten)}</td>
                          <td style={{...td,textAlign:'right',fontWeight:700,color:C.caramel,fontFamily:"'Playfair Display',serif"}}>{EUR(k.empf_vk)}</td>
                          <td style={{...td,textAlign:'right',fontWeight:700,color:k.db_pro_portion>=avgDB?C.green:C.red}}>{EUR(k.db_pro_portion)}</td>
                          <td style={{...td,textAlign:'right'}}>{(p.verkauf_monat??0).toLocaleString('de-DE')}</td>
                          <td style={{...td,textAlign:'right',fontWeight:700,color:k.db_monat>0?C.green:C.red}}>{EUR(k.db_monat)}</td>
                          <td style={{...td,textAlign:'right'}}>{PCT(k.ist_marge)}</td>
                          <td style={{...td,textAlign:'center'}}><Bdg color={cl.color}>{cl.label}</Bdg></td>
                        </tr>
                      )
                    })}
                    <tr style={{background:C.vanilla,fontWeight:700}}>
                      <td colSpan={6} style={{...td,paddingTop:12}}>GESAMT</td>
                      <td style={{...td,textAlign:'right',paddingTop:12}}>{EUR(avgDB)} <span style={{fontSize:10,fontWeight:400,color:C.muted}}>(Ø)</span></td>
                      <td style={{...td,textAlign:'right',paddingTop:12}}>{gesamtPortionen.toLocaleString('de-DE')}</td>
                      <td style={{...td,textAlign:'right',fontSize:15,color:monatDB>betriebGesamt?C.green:C.red,fontFamily:"'Playfair Display',serif",paddingTop:12}}>{EUR(monatDB)}</td>
                      <td colSpan={2}/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{marginTop:14,padding:'13px 17px',borderRadius:10,
              background:monatDB>betriebGesamt?'#D1FAE5':'#FEE2E2',
              border:`1px solid ${monatDB>betriebGesamt?'#6EE7B7':'#FCA5A5'}`,
              fontSize:13,fontWeight:600,color:monatDB>betriebGesamt?C.green:C.red}}>
              {monatDB>betriebGesamt
                ? `✓ Planung positiv: DB ${EUR(monatDB)} deckt Betriebskosten ${EUR(betriebGesamt)} — Überschuss: ${EUR(monatDB-betriebGesamt)}`
                : `⚠ Achtung: DB ${EUR(monatDB)} reicht nicht für Betriebskosten ${EUR(betriebGesamt)} — Lücke: ${EUR(betriebGesamt-monatDB)}`
              }
            </div>
          </div>
        )}

      </div>
    </div>
  )
}