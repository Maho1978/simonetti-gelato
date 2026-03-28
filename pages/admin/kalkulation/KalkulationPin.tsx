'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  cream:'#FBF6EE', vanilla:'#F2E6CC', caramel:'#C4873A', espresso:'#2C1708',
  coffee:'#5C3317', muted:'#9E7B5A', border:'#DFD0B8', white:'#FFFFFF',
  red:'#C0392B', green:'#2E7D54', sand:'#E8D5B0',
}

const SESSION_KEY    = 'simo_kalk_unlocked'
const TIMEOUT_MIN    = 5          // Minuten bis Auto-Lock
const MAX_ATTEMPTS   = 5          // danach 30s Sperre
const LOCKOUT_SEC    = 30
const PIN_LENGTH     = 8          // Maximale PIN-Länge

// Einfacher Hash (kein Klartext im Storage)
async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('simonetti_' + pin))
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')
}

interface Props {
  children: React.ReactNode
}

export default function KalkulationPin({ children }: Props) {
  const [phase, setPhase]         = useState<'loading'|'setup'|'locked'|'unlocked'>('loading')
  const [input, setInput]         = useState('')
  const [confirm, setConfirm]     = useState('')
  const [step, setStep]           = useState<'enter'|'confirm'>('enter')
  const [error, setError]         = useState('')
  const [attempts, setAttempts]   = useState(0)
  const [lockout, setLockout]     = useState(0)  // Sekunden
  const [shake, setShake]         = useState(false)
  const timerRef  = useRef<any>(null)
  const lockRef   = useRef<any>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // ── Initialisierung ────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('shop_settings').select('kalk_pin_hash').eq('id', 'main').single()
      const pinSet     = !!data?.kalk_pin_hash
      const unlocked   = sessionStorage.getItem(SESSION_KEY)
      const unlockedAt = unlocked ? parseInt(unlocked) : 0
      const elapsed    = (Date.now() - unlockedAt) / 1000 / 60
      if (!pinSet)                  setPhase('setup')
      else if (elapsed < TIMEOUT_MIN) setPhase('unlocked')
      else                            setPhase('locked')
    }
    init()
  }, [])

  // ── Auto-Lock nach Inaktivität ─────────────────────────────────
  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      sessionStorage.removeItem(SESSION_KEY)
      setPhase('locked')
      setInput('')
    }, TIMEOUT_MIN * 60 * 1000)
  }, [])

  useEffect(() => {
    if (phase !== 'unlocked') return
    resetTimer()
    const events = ['mousemove','keydown','click','touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer))
    return () => {
      clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [phase, resetTimer])

  // ── Lockout-Countdown ──────────────────────────────────────────
  useEffect(() => {
    if (lockout <= 0) return
    lockRef.current = setInterval(() => {
      setLockout(p => {
        if (p <= 1) { clearInterval(lockRef.current); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(lockRef.current)
  }, [lockout])

  // ── PIN-Pad fokus ──────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'locked' || phase === 'setup') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [phase])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  // ── PIN Setup ─────────────────────────────────────────────────
  const handleSetup = async () => {
    if (input.length < 4) { setError('Mindestens 4 Stellen'); return }
    if (step === 'enter') {
      setConfirm(input); setInput(''); setStep('confirm'); setError(''); return
    }
    if (input !== confirm) {
      setError('PINs stimmen nicht überein'); setInput(''); triggerShake(); return
    }
    const hash = await hashPin(input)
    await supabase.from('shop_settings').update({ kalk_pin_hash: hash }).eq('id', 'main')
    sessionStorage.setItem(SESSION_KEY, Date.now().toString())
    setPhase('unlocked')
  }

  // ── PIN Check ─────────────────────────────────────────────────
  const handleUnlock = async () => {
    if (lockout > 0) return
    const hash    = await hashPin(input)
    const { data } = await supabase.from('shop_settings').select('kalk_pin_hash').eq('id', 'main').single()
    const stored  = data?.kalk_pin_hash
    if (hash === stored) {
      sessionStorage.setItem(SESSION_KEY, Date.now().toString())
      setAttempts(0); setInput(''); setPhase('unlocked')
    } else {
      const next = attempts + 1
      setAttempts(next)
      setInput('')
      triggerShake()
      if (next >= MAX_ATTEMPTS) {
        setLockout(LOCKOUT_SEC)
        setError(`Zu viele Versuche — bitte ${LOCKOUT_SEC}s warten`)
      } else {
        setError(`Falsche PIN (${MAX_ATTEMPTS - next} Versuche verbleibend)`)
      }
    }
  }

  // ── PIN zurücksetzen (nur mit Supabase-Passwort möglich → hier: confirm-Dialog) ──
  const handleReset = async () => {
    const ok = window.confirm('PIN zurücksetzen? Du musst danach eine neue PIN vergeben.')
    if (ok) {
      await supabase.from('shop_settings').update({ kalk_pin_hash: null }).eq('id', 'main')
      sessionStorage.removeItem(SESSION_KEY)
      setPhase('setup'); setInput(''); setStep('enter'); setError('')
    }
  }

  // ── PIN-Pad Eingabe ────────────────────────────────────────────
  const handleKey = (val: string) => {
    if (lockout > 0) return
    if (val === '⌫') { setInput(p => p.slice(0,-1)); return }
    if (val === '✓') {
      if (phase === 'setup') handleSetup()
      else handleUnlock()
      return
    }
    if (input.length >= PIN_LENGTH) return
    const next = input + val
    setInput(next)
    setError('')
    // Auto-submit bei 6 Stellen
    if (next.length === PIN_LENGTH) {
      setTimeout(async () => {
        if (phase === 'setup') {
          setInput(next)
          await handleSetupWithVal(next)
        } else {
          await handleUnlockWithVal(next)
        }
      }, 120)
    }
  }

  const handleSetupWithVal = async (val: string) => {
    if (val.length < 4) { setError('Mindestens 4 Stellen'); return }
    if (step === 'enter') { setConfirm(val); setInput(''); setStep('confirm'); setError(''); return }
    if (val !== confirm) { setError('PINs stimmen nicht überein'); setInput(''); triggerShake(); return }
    const hash = await hashPin(val)
    await supabase.from('shop_settings').update({ kalk_pin_hash: hash }).eq('id', 'main')
    sessionStorage.setItem(SESSION_KEY, Date.now().toString())
    setPhase('unlocked')
  }

  const handleUnlockWithVal = async (val: string) => {
    if (lockout > 0) return
    const hash   = await hashPin(val)
    const { data } = await supabase.from('shop_settings').select('kalk_pin_hash').eq('id', 'main').single()
    const stored = data?.kalk_pin_hash
    if (hash === stored) {
      sessionStorage.setItem(SESSION_KEY, Date.now().toString())
      setAttempts(0); setInput(''); setPhase('unlocked')
    } else {
      const next = attempts + 1
      setAttempts(next); setInput(''); triggerShake()
      if (next >= MAX_ATTEMPTS) {
        setLockout(LOCKOUT_SEC)
        setError(`Zu viele Versuche — ${LOCKOUT_SEC}s warten`)
      } else {
        setError(`Falsche PIN (${MAX_ATTEMPTS - next} verbleibend)`)
      }
    }
  }

  if (phase === 'loading') return null
  if (phase === 'unlocked') return <>{children}</>

  // ── LOCK SCREEN ────────────────────────────────────────────────
  const isSetup   = phase === 'setup'
  const title     = isSetup
    ? (step === 'enter' ? 'PIN festlegen' : 'PIN bestätigen')
    : 'Rezepturen geschützt'
  const subtitle  = isSetup
    ? (step === 'enter' ? '4–8 Stellen wählen' : 'PIN nochmal eingeben')
    : 'PIN eingeben zum Entsperren'

  const dots = Array.from({length:PIN_LENGTH}, (_,i) => (
    <div key={i} style={{
      width:14, height:14, borderRadius:'50%',
      background: i < input.length ? C.caramel : 'transparent',
      border: `2px solid ${i < input.length ? C.caramel : C.border}`,
      transition:'all 0.15s',
    }}/>
  ))

  const pad = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['⌫','0','✓'],
  ]

  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.pin-screen{animation:fadeIn 0.3s ease}
.pin-dots{animation:${shake?'shake 0.45s ease':'none'}}
.pad-btn{
  width:68px;height:68px;border-radius:50%;border:1.5px solid ${C.border};
  background:${C.white};color:${C.espresso};font-size:22px;font-weight:500;
  font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.12s;
  display:flex;align-items:center;justify-content:center;
}
.pad-btn:hover:not(:disabled){background:${C.vanilla};border-color:${C.caramel}}
.pad-btn:active:not(:disabled){transform:scale(0.93);background:${C.vanilla}}
.pad-btn:disabled{opacity:0.35;cursor:not-allowed}
.pad-btn.confirm{background:${C.espresso};color:${C.vanilla};border-color:${C.espresso};font-size:18px}
.pad-btn.confirm:hover:not(:disabled){background:${C.coffee}}
  `

  return (
    <div style={{
      minHeight:'100vh', background:C.cream,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <style>{CSS}</style>

      <div className="pin-screen" style={{
        background:C.white, borderRadius:20,
        border:`1px solid ${C.border}`,
        boxShadow:'0 8px 40px rgba(44,23,8,0.10)',
        padding:'40px 36px 36px',
        width:320, textAlign:'center',
      }}>

        {/* Logo */}
        <div style={{marginBottom:24}}>
          <div style={{
            width:56, height:56, borderRadius:16,
            background:C.espresso, margin:'0 auto 14px',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26,
          }}>🍦</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:C.espresso}}>{title}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>{subtitle}</div>
        </div>

        {/* Dots */}
        <div className="pin-dots" style={{display:'flex',justifyContent:'center',gap:10,marginBottom:10}}>
          {dots}
        </div>

        {/* Fehler / Lockout */}
        <div style={{minHeight:22,marginBottom:12}}>
          {lockout > 0 && (
            <div style={{fontSize:12,color:C.red,fontWeight:600}}>
              🔒 Gesperrt — noch {lockout}s
            </div>
          )}
          {error && !lockout && (
            <div style={{fontSize:12,color:C.red}}>{error}</div>
          )}
          {!error && !lockout && isSetup && step==='confirm' && (
            <div style={{fontSize:12,color:C.green}}>✓ Gut — jetzt nochmal eingeben</div>
          )}
        </div>

        {/* PIN-Pad */}
        <div style={{display:'flex',flexDirection:'column',gap:10,alignItems:'center',marginBottom:20}}>
          {pad.map((row, ri) => (
            <div key={ri} style={{display:'flex',gap:10}}>
              {row.map(k => (
                <button
                  key={k}
                  className={`pad-btn${k==='✓'?' confirm':''}`}
                  disabled={lockout>0 || (k==='✓' && input.length<4)}
                  onClick={() => handleKey(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Unsichtbares Keyboard-Input für Desktop */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          value={input}
          onChange={e=>{
            const v = e.target.value.replace(/\D/g,'').slice(0,PIN_LENGTH)
            setInput(v)
            setError('')
          }}
          onKeyDown={e=>{ if(e.key==='Enter') { if(phase==='setup') handleSetup(); else handleUnlock() } }}
          style={{position:'absolute',opacity:0,pointerEvents:'none',width:1,height:1}}
        />

        {/* Footer */}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,display:'flex',justifyContent:'center',gap:16}}>
          {!isSetup && (
            <button onClick={handleReset}
              style={{background:'none',border:'none',color:C.muted,fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              PIN vergessen?
            </button>
          )}
          <div style={{fontSize:11,color:C.muted,display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:C.green,display:'inline-block'}}/>
            Auto-Lock nach {TIMEOUT_MIN} Min.
          </div>
        </div>
      </div>
    </div>
  )
}