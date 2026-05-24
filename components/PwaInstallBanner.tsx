import { useEffect, useState } from 'react'

const DISMISS_KEY = 'pwa-install-dismissed-v1'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  // iOS Safari
  if ((window.navigator as any).standalone === true) return true
  return false
}

function detectIOS(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent || ''
  const isIPhoneOrIPad = /iPhone|iPad|iPod/.test(ua)
  // iPadOS 13+ identifies as Mac with touch
  const isIPadOS = ua.includes('Mac') && 'ontouchend' in document
  return isIPhoneOrIPad || isIPadOS
}

export default function PwaInstallBanner() {
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandalone()) return
    if (window.localStorage?.getItem(DISMISS_KEY) === '1') return

    const ios = detectIOS()
    setIsIOS(ios)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    const onInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // iOS hat kein beforeinstallprompt — Banner nach kurzer Verzögerung zeigen
    let iosTimer: ReturnType<typeof setTimeout> | null = null
    if (ios) {
      iosTimer = setTimeout(() => setVisible(true), 2500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [])

  const dismiss = () => {
    try { window.localStorage?.setItem(DISMISS_KEY, '1') } catch {}
    setVisible(false)
    setShowIOSHelp(false)
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHelp(true)
      return
    }
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted' || choice.outcome === 'dismissed') {
        setDeferredPrompt(null)
        setVisible(false)
        if (choice.outcome === 'dismissed') {
          try { window.localStorage?.setItem(DISMISS_KEY, '1') } catch {}
        }
      }
    } catch {
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: 12,
          right: 12,
          bottom: 12,
          zIndex: 9999,
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
          background: '#ffffff',
          color: '#1f2937',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.08)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
        role="dialog"
        aria-live="polite"
      >
        <img
          src="/favicon-192.png"
          alt=""
          width={40}
          height={40}
          style={{ borderRadius: 10, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Jetzt als App installieren</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Schneller bestellen, ohne Browser-Leiste
          </div>
        </div>
        <button
          onClick={handleInstall}
          style={{
            background: '#c8a96e',
            color: '#ffffff',
            border: 'none',
            borderRadius: 999,
            padding: '8px 14px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isIOS ? 'Anleitung' : 'Installieren'}
        </button>
        <button
          onClick={dismiss}
          aria-label="Schließen"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
            padding: '4px 6px',
          }}
        >
          ×
        </button>
      </div>

      {showIOSHelp && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowIOSHelp(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 12,
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '18px 18px 22px',
              maxWidth: 460,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Auf iPhone installieren</div>
              <button
                onClick={() => setShowIOSHelp(false)}
                aria-label="Schließen"
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
              <li>Unten in Safari auf <strong>Teilen</strong> tippen <span aria-hidden>📤</span></li>
              <li>Im Menü auf <strong>„Zum Home-Bildschirm"</strong> tippen <span aria-hidden>➕</span></li>
              <li>Oben rechts auf <strong>Hinzufügen</strong> tippen</li>
            </ol>
            <div style={{ marginTop: 14, fontSize: 12, color: '#6b7280' }}>
              Funktioniert nur in Safari (nicht in Chrome auf iPhone).
            </div>
            <button
              onClick={dismiss}
              style={{
                marginTop: 14,
                width: '100%',
                background: '#1f2937',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  )
}
