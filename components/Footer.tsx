import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  instagram:   { label: 'Instagram',   icon: '📸', color: 'hover:text-pink-500'   },
  facebook:    { label: 'Facebook',    icon: '👤', color: 'hover:text-blue-600'   },
  tiktok:      { label: 'TikTok',      icon: '🎵', color: 'hover:text-gray-900'   },
  youtube:     { label: 'YouTube',     icon: '▶️', color: 'hover:text-red-600'    },
  whatsapp:    { label: 'WhatsApp',    icon: '💬', color: 'hover:text-green-500'  },
  google:      { label: 'Google Maps', icon: '🗺️', color: 'hover:text-blue-500'   },
  tripadvisor: { label: 'TripAdvisor', icon: '🦉', color: 'hover:text-green-400'  },
  yelp:        { label: 'Yelp',        icon: '⭐', color: 'hover:text-red-500'    },
  lieferando:  { label: 'Lieferando',  icon: '🛵', color: 'hover:text-orange-500' },
  x:           { label: 'X',           icon: '🐦', color: 'hover:text-gray-700'   },
  pinterest:   { label: 'Pinterest',   icon: '📌', color: 'hover:text-red-600'    },
  linkedin:    { label: 'LinkedIn',    icon: '💼', color: 'hover:text-blue-700'   },
}

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<any>({})
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data } = await supabase.from('shop_settings').select('social_links, opening_hours').eq('id', 'main').single()
    if (data) {
      setSocialLinks(data.social_links || {})
      setSettings(data)
    }
  }

  // Nur aktive Links mit URL
  const activeLinks = Object.entries(socialLinks).filter(([_, val]: any) => val.enabled && val.url?.trim())

  return (
    <footer className="bg-[#1a1a1a] text-white mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* ── Über uns ── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🍦</span>
              <div>
                <div className="font-black text-xl tracking-wide">SIMONETTI</div>
                <div className="text-xs text-gray-400 tracking-widest">E I S C A F É</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Frisches Eis & Gelato mit Lieferservice in Langenfeld. Täglich frisch zubereitet – direkt zu dir nach Hause!
            </p>
          </div>

          {/* ── Kontakt ── */}
          <div>
            <h3 className="font-bold text-sm tracking-widest uppercase text-gray-400 mb-4">Kontakt</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span>📍</span>
                <span>Konrad-Adenauer-Platz 2<br />40764 Langenfeld</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📞</span>
                <a href="tel:+4921731622780" className="hover:text-white transition">02173 / 16 22 780</a>
              </div>
              <div className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:bestellung@eiscafe-simonetti.de" className="hover:text-white transition">
                  bestellung@eiscafe-simonetti.de
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span>🌐</span>
                <a href="https://www.eiscafe-simonetti.de" className="hover:text-white transition">
                  www.eiscafe-simonetti.de
                </a>
              </div>
            </div>
          </div>

          {/* ── Links ── */}
          <div>
            <h3 className="font-bold text-sm tracking-widest uppercase text-gray-400 mb-4">Rechtliches</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <Link href="/impressum" className="block hover:text-white transition">Impressum</Link>
              <Link href="/datenschutz" className="block hover:text-white transition">Datenschutz</Link>
              <Link href="/agb" className="block hover:text-white transition">AGB</Link>
            </div>
          </div>
        </div>

        {/* ── Social Media Icons ── */}
        {activeLinks.length > 0 && (
          <div className="border-t border-gray-800 pt-8 mb-8">
            <h3 className="font-bold text-sm tracking-widest uppercase text-gray-400 mb-5 text-center">Folge uns</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {activeLinks.map(([id, val]: any) => {
                const cfg = PLATFORM_CONFIG[id]
                if (!cfg) return null
                return (
                  <a key={id} href={val.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full text-sm font-semibold text-gray-300 ${cfg.color} hover:bg-gray-700 transition`}
                    title={cfg.label}>
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Bottom Bar ── */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Eiscafé Simonetti · Langenfeld</span>
          <span>Made with 🍦 & ❤️</span>
        </div>

      </div>
    </footer>
  )
}