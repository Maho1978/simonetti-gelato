import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Send, Eye, Users, Search, CheckSquare, Square, Loader2, CheckCircle, AlertCircle, ChevronDown, Smartphone, Bell } from 'lucide-react'

// ── Push Subscriber Typ ───────────────────────────────────────────────────────
interface PushSubscriber { user_id: string; token: string; name: string; email: string }
type PushAudience = 'all' | 'manual'

// ── Typen ────────────────────────────────────────────────────────────────────
type CampaignType = 'free' | 'new_flavors' | 'promo' | 'seasonal'
type Audience     = 'all' | 'new' | 'returning' | 'manual'

interface Customer { email: string; name: string; orderCount: number; lastOrder: string }
interface CampaignState {
  type: CampaignType
  audience: Audience
  subject: string
  headline: string
  body: string
  ctaText: string
  ctaUrl: string
  voucherCode: string
  discount: string
  flavors: string
  seasonal: string
}

// ── Email HTML Builder ────────────────────────────────────────────────────────
const LOGO_URL = 'https://www.eiscafe-simonetti.de/images/simonetti-logo.jpg'

function buildEmailHtml(c: CampaignState, preview = false): string {
  const unsubHint = preview ? '' : `
    <p style="color:#ccc;font-size:11px;margin-top:16px;margin-bottom:0;">
      Du erhältst diese E-Mail als Kunde von Eiscafé Simonetti.
    </p>`

  let content = ''

  switch (c.type) {
    case 'free':
      content = `
        <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#2d2d2d;text-align:center;">${c.headline || 'Nachricht vom Eiscafé'}</h1>
        <div style="font-size:15px;color:#555;line-height:1.8;margin-bottom:28px;">${(c.body || '').replace(/\n/g, '<br/>')}</div>`
      break
    case 'new_flavors':
      content = `
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:60px;margin-bottom:12px;">🍦</div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#2d2d2d;">${c.headline || 'Neue Eissorten sind da!'}</h1>
          <p style="margin:0;color:#8da399;font-size:15px;">Frisch, cremig und unwiderstehlich</p>
        </div>
        <div style="background:#f0f9f6;border-radius:16px;padding:24px;margin-bottom:24px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#4a5d54;font-weight:700;margin-bottom:14px;">✨ Neue Sorten</div>
          ${(c.flavors || '').split('\n').filter(Boolean).map(f => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #d4ede7;">
              <span style="font-size:20px;">🍨</span>
              <span style="font-weight:700;color:#2d2d2d;font-size:15px;">${f.trim()}</span>
            </div>`).join('')}
        </div>
        ${c.body ? `<div style="font-size:14px;color:#666;line-height:1.8;margin-bottom:24px;">${c.body.replace(/\n/g,'<br/>')}</div>` : ''}`
      break
    case 'promo':
      content = `
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:60px;margin-bottom:12px;">🎉</div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#2d2d2d;">${c.headline || 'Spezialangebot nur für dich!'}</h1>
          ${c.body ? `<p style="margin:0;color:#666;font-size:14px;line-height:1.8;">${c.body.replace(/\n/g,'<br/>')}</p>` : ''}
        </div>
        ${c.voucherCode ? `
        <div style="background:linear-gradient(135deg,#4a5d54,#8da399);border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
          <div style="color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Dein persönlicher Rabattcode</div>
          <div style="background:white;border-radius:10px;padding:14px 24px;display:inline-block;margin-bottom:8px;">
            <span style="font-size:24px;font-weight:900;letter-spacing:4px;color:#4a5d54;">${c.voucherCode}</span>
          </div>
          ${c.discount ? `<div style="color:white;font-weight:700;font-size:16px;margin-top:8px;">${c.discount}% Rabatt auf deine nächste Bestellung</div>` : ''}
        </div>` : ''}`
      break
    case 'seasonal':
      content = `
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:60px;margin-bottom:12px;">${c.seasonal === 'sommer' ? '☀️' : c.seasonal === 'winter' ? '❄️' : c.seasonal === 'ostern' ? '🐣' : '🍁'}</div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#2d2d2d;">${c.headline || 'Grüße vom Eiscafé!'}</h1>
          ${c.body ? `<p style="margin:0;color:#666;font-size:14px;line-height:1.8;margin-top:12px;">${c.body.replace(/\n/g,'<br/>')}</p>` : ''}
        </div>`
      break
  }

  const cta = (c.ctaText && c.ctaUrl) ? `
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${c.ctaUrl}" style="display:inline-block;background:#2d2d2d;color:white;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:900;font-size:16px;">
        ${c.ctaText}
      </a>
    </div>` : `
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="https://www.eiscafe-simonetti.de" style="display:inline-block;background:#2d2d2d;color:white;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:900;font-size:16px;">
        🍦 Jetzt bestellen
      </a>
    </div>`

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf9f7;padding:30px 10px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
  <tr><td style="background:#2d2d2d;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
    <img src="${LOGO_URL}" width="80" height="80" style="border-radius:50%;object-fit:cover;border:3px solid #fff;display:block;margin:0 auto 12px;"/>
    <div style="color:#fff;font-size:18px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Eiscafé Simonetti</div>
    <div style="color:#888;font-size:10px;letter-spacing:4px;margin-top:4px;">G E L A T E R I A · L A N G E N F E L D</div>
  </td></tr>
  <tr><td style="background:#fff;padding:40px;border-radius:0 0 16px 16px;">
    ${content}
    ${cta}
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #f0ede8;text-align:center;">
      <p style="color:#aaa;font-size:12px;line-height:2;margin:0;">
        Eiscafé Simonetti · Konrad-Adenauer-Platz 2 · 40764 Langenfeld<br/>
        <a href="https://www.eiscafe-simonetti.de" style="color:#8da399;text-decoration:none;">www.eiscafe-simonetti.de</a>
      </p>
      ${unsubHint}
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES: Record<CampaignType, Partial<CampaignState>> = {
  free:        { subject: '', headline: '', body: '', ctaText: 'Jetzt bestellen', ctaUrl: 'https://www.eiscafe-simonetti.de' },
  new_flavors: { subject: '🍦 Neue Eissorten sind da!', headline: 'Neue Sorten – frisch eingetroffen!', flavors: 'Mango-Maracuja\nPistazie Royal\nErdbeer-Cheesecake', body: 'Schau vorbei und probiere unsere neuesten Kreationen – solange der Vorrat reicht!', ctaText: '🍦 Jetzt probieren', ctaUrl: 'https://www.eiscafe-simonetti.de' },
  promo:       { subject: '🎉 Exklusiver Rabatt nur für dich!', headline: 'Ein Dankeschön von uns!', voucherCode: 'DANKE10', discount: '10', body: 'Als treuer Kunde bekommst du diesen exklusiven Rabattcode – gültig für deine nächste Bestellung!', ctaText: '🛒 Jetzt bestellen', ctaUrl: 'https://www.eiscafe-simonetti.de' },
  seasonal:    { subject: '☀️ Sommergrüße vom Eiscafé!', headline: 'Der Sommer ruft – Eis auch!', seasonal: 'sommer', body: 'Heiße Temperaturen, kühles Eis – wir liefern Erfrischung direkt zu dir nach Hause. Bleib cool!', ctaText: '🍦 Jetzt kühlen lassen', ctaUrl: 'https://www.eiscafe-simonetti.de' },
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: 'Alle Kunden', new: 'Nur Neukunden', returning: 'Nur Stammkunden', manual: 'Manuell auswählen'
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function Campaigns() {
  const router = useRouter()

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<'email' | 'push'>('email')

  // ── E-Mail State (unverändert) ──
  const [customers, setCustomers]       = useState<Customer[]>([])
  const [selected,  setSelected]        = useState<Set<string>>(new Set())
  const [search,    setSearch]          = useState('')
  const [showPreview, setShowPreview]   = useState(false)
  const [sending,   setSending]         = useState(false)
  const [result,    setResult]          = useState<{ ok: boolean; sent: number; failed: number } | null>(null)
  const [knownEmails, setKnownEmails]   = useState<Set<string>>(new Set())
  const [loadingCustomers, setLoadingC] = useState(true)

  // ── Push State ──
  const [pushTitle,    setPushTitle]    = useState('')
  const [pushBody,     setPushBody]     = useState('')
  const [pushAudience, setPushAudience] = useState<PushAudience>('all')
  const [pushSending,  setPushSending]  = useState(false)
  const [pushResult,   setPushResult]   = useState<{ ok: boolean; sent: number; failed: number; message?: string } | null>(null)
  const [subscribers,  setSubscribers]  = useState<PushSubscriber[]>([])
  const [subSearch,    setSubSearch]    = useState('')
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set())
  const [loadingSubs,  setLoadingSubs]  = useState(false)

  const [campaign, setCampaign] = useState<CampaignState>({
    type: 'new_flavors', audience: 'all',
    ...TEMPLATES['new_flavors'],
    subject: TEMPLATES['new_flavors'].subject || '',
    headline: TEMPLATES['new_flavors'].headline || '',
    body: TEMPLATES['new_flavors'].body || '',
    ctaText: TEMPLATES['new_flavors'].ctaText || '',
    ctaUrl: TEMPLATES['new_flavors'].ctaUrl || '',
    voucherCode: '', discount: '', flavors: TEMPLATES['new_flavors'].flavors || '', seasonal: '',
  } as CampaignState)

  useEffect(() => { loadCustomers() }, [])

  useEffect(() => {
    if (activeTab !== 'push' || subscribers.length > 0) return
    setLoadingSubs(true)
    fetch('/api/push/subscribers')
      .then(r => r.json())
      .then(d => setSubscribers(d.subscribers || []))
      .catch(() => {})
      .finally(() => setLoadingSubs(false))
  }, [activeTab])

  const loadCustomers = async () => {
    setLoadingC(true)

    const [regRes, { data: orders }] = await Promise.all([
      fetch('/api/admin/registered-customers').then(r => r.json()).catch(() => ({ users: [] })),
      supabase.from('orders').select('email, customer_name, created_at'),
    ])

    const map: Record<string, Customer> = {}

    // Registrierte Kunden aus Auth (haben Email, aber ggf. noch keine Bestellung)
    ;((regRes.users || []) as { email: string; name: string }[]).forEach(u => {
      if (!u.email) return
      map[u.email] = { email: u.email, name: u.name || u.email, orderCount: 0, lastOrder: '' }
    })

    // Bestellungen zählen — Gast-Kunden werden neu angelegt
    ;(orders || []).forEach((o: any) => {
      if (!o.email) return
      if (!map[o.email]) {
        map[o.email] = { email: o.email, name: o.customer_name || o.email, orderCount: 0, lastOrder: o.created_at }
      }
      map[o.email].orderCount++
      if (!map[o.email].lastOrder || o.created_at > map[o.email].lastOrder) {
        map[o.email].lastOrder = o.created_at
      }
    })

    setKnownEmails(new Set(Object.keys(map)))
    setCustomers(Object.values(map).sort((a, b) => b.orderCount - a.orderCount))
    setLoadingC(false)
  }

  const applyTemplate = (type: CampaignType) => {
    const t = TEMPLATES[type]
    setCampaign(prev => ({ ...prev, type, subject: t.subject||'', headline: t.headline||'', body: t.body||'', ctaText: t.ctaText||'', ctaUrl: t.ctaUrl||'', flavors: t.flavors||'', seasonal: t.seasonal||'', voucherCode: t.voucherCode||'', discount: t.discount||'' }))
  }

  const set = (k: keyof CampaignState, v: string) => setCampaign(prev => ({ ...prev, [k]: v }))

  const filteredCustomers = customers.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  )

  const displayCustomers = campaign.audience === 'new'
    ? customers.filter(c => c.orderCount === 1 && (c.email.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())))
    : campaign.audience === 'returning'
    ? customers.filter(c => c.orderCount > 1 && (c.email.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())))
    : filteredCustomers

  const resolveRecipients = (): string[] => {
    switch (campaign.audience) {
      case 'all':       return customers.map(c => c.email)
      case 'new':       return customers.filter(c => c.orderCount === 1).map(c => c.email)
      case 'returning': return customers.filter(c => c.orderCount > 1).map(c => c.email)
      case 'manual':    return [...selected]
    }
  }

  const recipients = resolveRecipients()

  const handleSend = async () => {
    if (!campaign.subject) { alert('Bitte Betreff eingeben'); return }
    if (recipients.length === 0) { alert('Keine Empfänger'); return }
    if (!confirm(`Kampagne an ${recipients.length} Empfänger senden?`)) return

    setSending(true); setResult(null)
    const html = buildEmailHtml(campaign)
    const res  = await fetch('/api/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: campaign.subject, html, recipients }),
    })
    const data = await res.json()
    setResult(data)
    setSending(false)
  }

  // ── Push ─────────────────────────────────────────────────────────────────────
  const filteredSubs = subscribers.filter(s =>
    s.name.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(subSearch.toLowerCase())
  )
  const pushRecipientCount = pushAudience === 'all' ? subscribers.length : selectedSubs.size

  const handlePushSend = async () => {
    if (!pushTitle.trim() || !pushBody.trim()) { alert('Bitte Titel und Nachricht eingeben'); return }
    if (pushRecipientCount === 0) { alert('Keine Empfänger'); return }
    if (!confirm(`Push-Nachricht an ${pushRecipientCount} App-Nutzer senden?`)) return
    setPushSending(true); setPushResult(null)
    const payload: any = { title: pushTitle, body: pushBody }
    if (pushAudience === 'manual') payload.user_ids = [...selectedSubs]
    try {
      const res = await fetch('/api/push/send-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setPushResult(await res.json())
    } catch { setPushResult({ ok: false, sent: 0, failed: 0, message: 'Netzwerkfehler' }) }
    finally { setPushSending(false) }
  }

  const previewHtml = buildEmailHtml(campaign, true)

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📣 Kampagnen</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {activeTab === 'email'
                ? `${customers.length} Kunden · ${recipients.length} Empfänger`
                : `${subscribers.length} App-Nutzer · ${pushRecipientCount} ausgewählt`}
            </p>
          </div>
          {/* Tab-Switcher */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => setActiveTab('email')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'email' ? 'bg-white shadow text-[#4a5d54]' : 'text-gray-500 hover:text-gray-700'}`}>
              <Send size={15}/> E-Mail
            </button>
            <button onClick={() => setActiveTab('push')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'push' ? 'bg-white shadow text-[#4a5d54]' : 'text-gray-500 hover:text-gray-700'}`}>
              <Smartphone size={15}/> App Push
              {subscribers.length > 0 && <span className="bg-[#4a5d54] text-white text-xs px-1.5 py-0.5 rounded-full">{subscribers.length}</span>}
            </button>
          </div>
        </div>

        {/* ── PUSH TAB ── */}
        {activeTab === 'push' && (
          <div className="space-y-5 max-w-3xl">
            {pushResult && (
              <div className={`flex items-center gap-3 p-4 rounded-xl ${pushResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {pushResult.ok ? <CheckCircle size={20} className="text-green-600"/> : <AlertCircle size={20} className="text-red-500"/>}
                <span className="text-sm font-semibold">
                  {pushResult.ok
                    ? `✅ ${pushResult.sent} Push-Nachrichten gesendet${pushResult.failed > 0 ? `, ${pushResult.failed} fehlgeschlagen` : ''}${pushResult.message ? ` · ${pushResult.message}` : ''}`
                    : `❌ Fehler: ${pushResult.message || 'Unbekannt'}`}
                </span>
              </div>
            )}
            {/* Zielgruppe */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Zielgruppe</p>
              <div className="flex gap-3">
                {([
                  { key: 'all'    as PushAudience, label: 'Alle App-Nutzer',   icon: <Bell size={15}/>,       count: subscribers.length },
                  { key: 'manual' as PushAudience, label: 'Manuell auswählen', icon: <Users size={15}/>,      count: selectedSubs.size },
                ]).map(a => (
                  <button key={a.key} onClick={() => setPushAudience(a.key)}
                    className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-semibold transition ${pushAudience === a.key ? 'border-[#4a5d54] bg-[#f0f5f3] text-[#4a5d54]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                    <span className="flex items-center gap-2">{a.icon}{a.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${pushAudience === a.key ? 'bg-[#4a5d54] text-white' : 'bg-gray-100 text-gray-400'}`}>{a.count}</span>
                  </button>
                ))}
              </div>
              {/* Manuelle Auswahl */}
              {pushAudience === 'manual' && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">App-Nutzer auswählen</p>
                    <button onClick={() => setSelectedSubs(selectedSubs.size === filteredSubs.length ? new Set() : new Set(filteredSubs.map(s => s.user_id)))}
                      className="text-xs text-[#4a5d54] font-semibold hover:underline">
                      {selectedSubs.size === filteredSubs.length ? 'Alle abwählen' : 'Alle wählen'}
                    </button>
                  </div>
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
                    <input value={subSearch} onChange={e => setSubSearch(e.target.value)} placeholder="Name oder E-Mail..."
                      className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm"/>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {loadingSubs ? (
                      <div className="text-center py-6 text-gray-300 text-sm flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Laden...</div>
                    ) : filteredSubs.length === 0 ? (
                      <div className="text-center py-6 text-gray-300 text-sm">Keine App-Nutzer gefunden</div>
                    ) : filteredSubs.map(s => {
                      const isSel = selectedSubs.has(s.user_id)
                      return (
                        <button key={s.user_id} onClick={() => { const n = new Set(selectedSubs); isSel ? n.delete(s.user_id) : n.add(s.user_id); setSelectedSubs(n) }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${isSel ? 'bg-[#f0f5f3]' : 'hover:bg-gray-50'}`}>
                          {isSel ? <CheckSquare size={16} className="text-[#4a5d54] flex-shrink-0"/> : <Square size={16} className="text-gray-300 flex-shrink-0"/>}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-700 truncate">{s.name}</div>
                            <div className="text-xs text-gray-400 truncate">{s.email || s.user_id.slice(0,8)+'…'}</div>
                          </div>
                          <Smartphone size={13} className="text-gray-300 flex-shrink-0"/>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* Nachricht */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nachricht</p>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Titel <span className="text-red-400">*</span></label>
                <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="z.B. Neue Eissorten sind da! 🍦" maxLength={65}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm"/>
                <p className="text-xs text-gray-300 mt-1 text-right">{pushTitle.length}/65</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Nachricht <span className="text-red-400">*</span></label>
                <textarea value={pushBody} onChange={e => setPushBody(e.target.value)} placeholder="z.B. Frische neue Sorten warten auf dich!" rows={3} maxLength={200}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm resize-none"/>
                <p className="text-xs text-gray-300 mt-1 text-right">{pushBody.length}/200</p>
              </div>
              <button onClick={handlePushSend} disabled={pushSending || !pushTitle.trim() || !pushBody.trim() || pushRecipientCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4a5d54] text-white rounded-xl text-sm font-bold hover:bg-[#3a4d44] transition disabled:opacity-50 disabled:cursor-not-allowed">
                {pushSending ? <><Loader2 size={16} className="animate-spin"/> Wird gesendet…</> : <><Send size={16}/> Push an {pushRecipientCount} App-Nutzer senden</>}
              </button>
            </div>
          </div>
        )}

        {/* ── E-MAIL TAB ── */}
        {activeTab === 'email' && <>

        {/* E-Mail Aktionen */}
        <div className="flex gap-3 mb-6 justify-end">
          <button onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            <Eye size={16} /> {showPreview ? 'Editor' : 'Vorschau'}
          </button>
          <button onClick={handleSend} disabled={sending || recipients.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4a5d54] text-white rounded-xl text-sm font-bold hover:bg-[#3a4d44] transition disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Wird gesendet...' : `Senden (${recipients.length})`}
          </button>
        </div>

        {/* Result Banner */}
        {result && (
          <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.ok ? <CheckCircle size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-red-500" />}
            <div className="text-sm font-semibold">
              {result.ok
                ? `✅ Kampagne gesendet! ${result.sent} erfolgreich${result.failed > 0 ? `, ${result.failed} fehlgeschlagen` : ''}`
                : '❌ Fehler beim Senden — bitte prüfe die Brevo API'}
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>

          {/* ── Linke Spalte: Editor ── */}
          {!showPreview && (
            <div className="lg:col-span-2 space-y-5">

              {/* Kampagnen-Typ */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Kampagnen-Typ</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { key: 'new_flavors', icon: '🍦', label: 'Neue Sorten' },
                    { key: 'promo',       icon: '🎉', label: 'Rabattaktion' },
                    { key: 'seasonal',    icon: '☀️', label: 'Saisonales' },
                    { key: 'free',        icon: '✏️', label: 'Freitext' },
                  ] as { key: CampaignType; icon: string; label: string }[]).map(t => (
                    <button key={t.key} onClick={() => applyTemplate(t.key)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold transition ${campaign.type === t.key ? 'border-[#4a5d54] bg-[#f0f5f3] text-[#4a5d54]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      <span className="text-2xl">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inhalte */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Inhalt</p>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Betreff *</label>
                  <input value={campaign.subject} onChange={e => set('subject', e.target.value)}
                    placeholder="E-Mail Betreff"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Überschrift</label>
                  <input value={campaign.headline} onChange={e => set('headline', e.target.value)}
                    placeholder="Große Überschrift in der E-Mail"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm" />
                </div>

                {campaign.type === 'new_flavors' && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">Neue Sorten <span className="text-gray-400 font-normal">(eine pro Zeile)</span></label>
                    <textarea value={campaign.flavors} onChange={e => set('flavors', e.target.value)} rows={4}
                      placeholder="Mango-Maracuja&#10;Pistazie Royal&#10;Erdbeer-Cheesecake"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm resize-none" />
                  </div>
                )}

                {campaign.type === 'promo' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">Gutscheincode</label>
                      <input value={campaign.voucherCode} onChange={e => set('voucherCode', e.target.value.toUpperCase())}
                        placeholder="DANKE10"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm font-mono uppercase" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">Rabatt %</label>
                      <input value={campaign.discount} onChange={e => set('discount', e.target.value)} type="number"
                        placeholder="10"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm" />
                    </div>
                  </div>
                )}

                {campaign.type === 'seasonal' && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">Anlass</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[['sommer','☀️','Sommer'],['winter','❄️','Winter'],['ostern','🐣','Ostern'],['herbst','🍁','Herbst']].map(([val, icon, label]) => (
                        <button key={val} type="button" onClick={() => set('seasonal', val)}
                          className={`flex flex-col items-center py-2 rounded-xl border-2 text-xs font-semibold transition ${campaign.seasonal === val ? 'border-[#4a5d54] bg-[#f0f5f3] text-[#4a5d54]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                          <span className="text-xl mb-0.5">{icon}</span>{label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Text / Nachricht</label>
                  <textarea value={campaign.body} onChange={e => set('body', e.target.value)} rows={4}
                    placeholder="Deine persönliche Nachricht an die Kunden..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">Button Text</label>
                    <input value={campaign.ctaText} onChange={e => set('ctaText', e.target.value)}
                      placeholder="🍦 Jetzt bestellen"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">Button URL</label>
                    <input value={campaign.ctaUrl} onChange={e => set('ctaUrl', e.target.value)}
                      placeholder="https://eiscafe-simonetti.de"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {showPreview && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">E-Mail Vorschau</p>
                <p className="text-xs text-gray-300">Betreff: <span className="text-gray-500">{campaign.subject || '—'}</span></p>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <iframe srcDoc={previewHtml} className="w-full" style={{ height: '600px', border: 'none' }} />
              </div>
            </div>
          )}

          {/* ── Rechte Spalte: Zielgruppe ── */}
          <div className="space-y-5">

            {/* Zielgruppe */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Zielgruppe</p>
              <div className="space-y-2">
                {(['all','new','returning','manual'] as Audience[]).map(a => {
                  const count = a === 'all' ? customers.length
                    : a === 'new' ? customers.filter(c => c.orderCount === 1).length
                    : a === 'returning' ? customers.filter(c => c.orderCount > 1).length
                    : selected.size
                  return (
                    <button key={a} onClick={() => setCampaign(p => ({ ...p, audience: a }))}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-semibold transition ${campaign.audience === a ? 'border-[#4a5d54] bg-[#f0f5f3] text-[#4a5d54]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      <span>{AUDIENCE_LABELS[a]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.audience === a ? 'bg-[#4a5d54] text-white' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Empfänger-Liste — immer sichtbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Empfänger</p>
                {campaign.audience === 'manual' && (
                  <button onClick={() => {
                    if (selected.size === filteredCustomers.length) setSelected(new Set())
                    else setSelected(new Set(filteredCustomers.map(c => c.email)))
                  }} className="text-xs text-[#4a5d54] font-semibold hover:underline">
                    {selected.size === filteredCustomers.length ? 'Alle abwählen' : 'Alle wählen'}
                  </button>
                )}
              </div>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {loadingCustomers ? (
                  <div className="text-center py-6 text-gray-300 text-sm">Laden...</div>
                ) : displayCustomers.length === 0 ? (
                  <div className="text-center py-6 text-gray-300 text-sm">Keine Kunden gefunden</div>
                ) : displayCustomers.map(c => {
                  if (campaign.audience === 'manual') {
                    const isSelected = selected.has(c.email)
                    return (
                      <button key={c.email} onClick={() => {
                        const next = new Set(selected)
                        isSelected ? next.delete(c.email) : next.add(c.email)
                        setSelected(next)
                      }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${isSelected ? 'bg-[#f0f5f3]' : 'hover:bg-gray-50'}`}>
                        {isSelected ? <CheckSquare size={16} className="text-[#4a5d54] flex-shrink-0" /> : <Square size={16} className="text-gray-300 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-700 truncate">{c.name}</div>
                          <div className="text-xs text-gray-400 truncate">{c.email}</div>
                        </div>
                        <span className="text-xs text-gray-300 flex-shrink-0">{c.orderCount}×</span>
                      </button>
                    )
                  }
                  return (
                    <div key={c.email} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-default">
                      <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-green-400 block" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-700 truncate">{c.name}</div>
                        <div className="text-xs text-gray-400 truncate">{c.email}</div>
                      </div>
                      <span className="text-xs text-gray-300 flex-shrink-0">{c.orderCount}×</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Zusammenfassung */}
            <div className="bg-[#f0f5f3] rounded-2xl p-5">
              <p className="text-xs font-bold text-[#4a5d54] uppercase tracking-wide mb-3">Zusammenfassung</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Typ</span><span className="font-semibold">{campaign.type === 'free' ? 'Freitext' : campaign.type === 'new_flavors' ? 'Neue Sorten' : campaign.type === 'promo' ? 'Rabattaktion' : 'Saisonales'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Zielgruppe</span><span className="font-semibold">{AUDIENCE_LABELS[campaign.audience]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Empfänger</span><span className="font-bold text-[#4a5d54]">{recipients.length}</span></div>
              </div>
              <button onClick={() => setShowPreview(!showPreview)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-[#c4d8d0] rounded-xl text-sm font-semibold text-[#4a5d54] hover:bg-[#e8f0ed] transition">
                <Eye size={15} /> {showPreview ? 'Editor anzeigen' : 'Vorschau anzeigen'}
              </button>
            </div>

          </div>
        </div>

        </> /* Ende E-Mail Tab */}

      </div>
    </AdminLayout>
  )
}