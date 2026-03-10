import { useState, useEffect } from 'react'
import { X, Copy, Check, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BannerSettings {
  code: string
  discount: number
  text: string
}

export default function WelcomeBanner() {
  const [settings, setSettings] = useState<BannerSettings | null>(null)
  const [visible, setVisible]   = useState(false)
  const [closing, setClosing]   = useState(false)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('welcome-banner-dismissed')
    if (dismissed) return

    supabase
      .from('shop_settings')
      .select('welcome_banner_enabled, welcome_banner_code, welcome_banner_discount, welcome_banner_text')
      .eq('id', 'main')
      .single()
      .then(({ data }) => {
        if (data?.welcome_banner_enabled) {
          setSettings({
            code:     data.welcome_banner_code     || 'WILLKOMMEN10',
            discount: data.welcome_banner_discount || 10,
            text:     data.welcome_banner_text     || 'Willkommen! Nur für Neukunden',
          })
          setTimeout(() => setVisible(true), 800)
        }
      })
  }, [])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('welcome-banner-dismissed', '1')
    }, 350)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(settings?.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!visible || !settings) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-50 bg-black/60"
        style={{
          backdropFilter: 'blur(4px)',
          opacity: closing ? 0 : 1,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Modal */}
      <div
        className="fixed z-50 left-1/2 top-1/2"
        style={{
          transform: closing
            ? 'translate(-50%, -50%) scale(0.92)'
            : 'translate(-50%, -50%) scale(1)',
          opacity: closing ? 0 : 1,
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          width: 'min(480px, calc(100vw - 32px))',
        }}
      >
        <div className="relative bg-[#1a1a1a] text-white overflow-hidden" style={{ borderRadius: '4px' }}>

          {/* Gold top bar */}
          <div className="h-1 w-full bg-[#c9a66b]" />

          {/* Close */}
          <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition z-10">
            <X size={18} />
          </button>

          <div className="px-10 py-10 text-center">

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-[#c9a66b]/15 border border-[#c9a66b]/30 flex items-center justify-center">
                <Sparkles size={28} className="text-[#c9a66b]" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#c9a66b] text-black px-4 py-1.5 mb-5" style={{ borderRadius: '2px' }}>
              <span className="text-xs font-bold uppercase tracking-widest">
                {settings.discount}% Rabatt
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">
              Willkommen! 🍦
            </h2>

            {/* Text */}
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
              {settings.text}
            </p>

            {/* Code Box */}
            <div className="bg-white/5 border border-white/10 p-5 mb-6" style={{ borderRadius: '4px' }}>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Dein Gutscheincode</p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-2xl font-bold text-[#c9a66b] tracking-widest">
                  {settings.code}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#c9a66b] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#d4b07a] transition"
                  style={{ borderRadius: '2px' }}
                >
                  {copied ? <><Check size={13} /> Kopiert</> : <><Copy size={13} /> Kopieren</>}
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleClose}
              className="w-full py-4 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-gray-100 transition"
              style={{ borderRadius: '2px' }}
            >
              Jetzt bestellen
            </button>

            <p className="text-xs text-gray-600 mt-4">Im Checkout eingeben · Nur für Neukunden</p>
          </div>
        </div>
      </div>
    </>
  )
}