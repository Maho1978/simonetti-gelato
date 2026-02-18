import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Hero() {
  const [settings, setSettings] = useState({
    deliveryTime: '30-45 Min.',
    isOpen: true,
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('shop_settings')
          .select('delivery_time, is_open')
          .eq('id', 'main')
          .single()

        if (data) {
          setSettings({
            deliveryTime: data.delivery_time || '30-45 Min.',
            isOpen: data.is_open ?? true,
          })
        }
      } catch (err) {
        console.error('Fehler beim Laden der Settings:', err)
      }
    }
    loadSettings()
  }, [])

  return (
    <div style={{ backgroundColor: '#fdfcfb' }} className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Text */}
          <div className="animate-fade-in">
            <h1 className="font-display font-bold italic leading-tight mb-6"
              style={{ fontSize: '5rem', lineHeight: '0.9', color: '#4a5d54' }}>
              Eisliebe<br />geliefert.
            </h1>
            <p className="text-lg mb-8 max-w-md" style={{ color: '#666', lineHeight: '1.7' }}>
              Das echte italienische Simonetti-Erlebnis jetzt direkt bei dir in Langenfeld zu Hause.
              Handwerklich hergestellt, eiskalt geliefert.
            </p>

            <Link href="#produkte"
              className="inline-block font-bold px-10 py-5 rounded-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ backgroundColor: '#4a5d54', color: '#fdfcfb', boxShadow: '0 10px 30px rgba(74,93,84,0.25)' }}
            >
              JETZT BESTELLEN
            </Link>

            {/* Stats */}
            <div className="mt-10 flex gap-10">
              <div>
                <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#8da399' }}>LIEFERZEIT</div>
                <div className="text-xl font-bold" style={{ color: '#4a5d54' }}>{settings.deliveryTime}</div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#8da399' }}>STATUS</div>
                <div className="text-xl font-bold" style={{ color: settings.isOpen ? '#27ae60' : '#e74c3c' }}>
                  {settings.isOpen ? '● Geöffnet' : '● Geschlossen'}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#8da399' }}>LIEFERGEBIET</div>
                <div className="text-xl font-bold" style={{ color: '#4a5d54' }}>Langenfeld</div>
              </div>
            </div>
          </div>

          {/* Bild / Emoji */}
          <div className="flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: '#f5f1ea', width: '420px', height: '420px' }}>
              <span style={{ fontSize: '12rem' }}>🍦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wellen-Trenner */}
      <div style={{ height: '60px', backgroundColor: '#f9f8f4', clipPath: 'ellipse(55% 100% at 50% 100%)' }}></div>
    </div>
  )
}