import Head from 'next/head'
import Link from 'next/link'
import { Banknote, MapPin, Clock, Mail } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const DAY_LABELS: Record<string, string> = {
  monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch',
  thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag',
}
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DEFAULT_DELIVERY = { closed: false, open: '14:00', close: '18:30' }

function getDeliveryHours(h: any) {
  if (!h) return DEFAULT_DELIVERY
  if (h.open !== undefined && !h.delivery) {
    return { closed: h.closed ?? false, open: h.open, close: h.close }
  }
  return { ...DEFAULT_DELIVERY, ...(h.delivery || {}) }
}

const PAYMENT_METHODS = [
  {
    id: 'cash',
    src: null,
    icon: 'cash',
    label: 'Barzahlung bei Lieferung',
    description: 'Passend halten, bitte — kein Wechselgeld garantiert.',
  },
  {
    id: 'card',
    src: null,
    icons: ['/icons/payments/visa.svg', '/icons/payments/mastercard.svg'],
    label: 'Kreditkarte',
    sublabel: 'Visa & Mastercard',
    description: 'Sichere Zahlung über Stripe — SSL-verschlüsselt, direkt im Browser.',
  },
  {
    id: 'paypal',
    src: '/icons/payments/paypal.svg',
    label: 'PayPal',
    description: 'Schnelle Zahlung mit PayPal-Käuferschutz.',
  },
  {
    id: 'apple-pay',
    src: '/icons/payments/apple-pay.svg',
    label: 'Apple Pay',
    description: 'Einfach mit Face ID oder Touch ID auf iPhone und Mac bezahlen.',
  },
  {
    id: 'google-pay',
    src: '/icons/payments/google-pay.svg',
    label: 'Google Pay',
    description: 'Ein-Klick-Zahlung mit gespeicherten Google-Karten.',
  },
  {
    id: 'link',
    src: '/icons/payments/link.svg',
    label: 'Link by Stripe',
    description: 'Gespeicherte Zahlungsdaten für schnellen Checkout beim nächsten Besuch.',
  },
]

interface Zone {
  id: string
  zip: string
  city: string
  enabled: boolean
}

interface DeliveryDay {
  day: string
  label: string
  closed: boolean
  open: string
  close: string
}

interface Props {
  deliveryFee: number
  minOrderValue: number
  zones: Zone[]
  deliveryDays: DeliveryDay[]
  shopEmail: string
}

export default function ZahlungLieferung({ deliveryFee, minOrderValue, zones, deliveryDays, shopEmail }: Props) {
  const activeZones = zones.filter(z => z.enabled)
  const hasMinOrder = minOrderValue > 0

  return (
    <>
      <Head>
        <title>Zahlung &amp; Lieferung | Eiscafé Simonetti</title>
        <meta
          name="description"
          content="Alle Zahlungsmöglichkeiten und Liefergebiete von Eiscafé Simonetti in Langenfeld – Kreditkarte, PayPal, Apple Pay, Google Pay und mehr."
        />
        <link rel="canonical" href="https://www.eiscafe-simonetti.de/zahlung-lieferung" />
      </Head>

      <div className="min-h-screen bg-[#111] text-white">
        <div className="max-w-3xl mx-auto px-5 py-14">

          {/* ── Breadcrumb ── */}
          <nav className="text-xs text-gray-500 mb-10 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C4973A] transition">Startseite</Link>
            <span>/</span>
            <span className="text-gray-400">Zahlung &amp; Lieferung</span>
          </nav>

          {/* ── Titel ── */}
          <h1 className="font-cinzel text-3xl md:text-4xl text-[#C4973A] tracking-wider mb-2">
            Zahlung &amp; Lieferung
          </h1>
          <p className="text-gray-400 text-sm mb-14 font-cormorant text-base">
            Alles auf einen Blick — wie Sie bezahlen und wohin wir liefern.
          </p>

          {/* ══════════════════════════════
              SEKTION 1 — Zahlungsmöglichkeiten
          ══════════════════════════════ */}
          <section className="mb-14">
            <h2 className="font-cinzel text-xl text-[#C4973A] tracking-widest uppercase mb-2">
              Zahlungsmöglichkeiten
            </h2>
            <div className="w-12 h-px bg-[#C4973A] mb-6 opacity-50" />
            <p className="text-gray-300 text-sm mb-8">
              Bei Eiscafé Simonetti können Sie bequem auf folgende Arten bezahlen:
            </p>

            <div className="space-y-3">
              {PAYMENT_METHODS.map(m => (
                <div
                  key={m.id}
                  className="flex items-start gap-4 bg-[#1a1a1a] border border-[rgba(196,151,58,0.12)] rounded-xl px-5 py-4"
                >
                  {/* Logo-Bereich */}
                  <div className="flex items-center gap-2 shrink-0 w-28">
                    {m.id === 'card' && m.icons ? (
                      <>
                        {m.icons.map(src => (
                          <span key={src} className="flex items-center justify-center bg-[#f5f5f5] rounded px-2 py-1">
                            <img src={src} alt="" className="h-5 object-contain" />
                          </span>
                        ))}
                      </>
                    ) : m.id === 'cash' ? (
                      <span className="flex items-center justify-center bg-[#f5f5f5] rounded px-2 py-1.5">
                        <Banknote size={20} color="#C4973A" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center bg-[#f5f5f5] rounded px-2 py-1">
                        <img src={m.src!} alt={m.label} className="h-5 object-contain" />
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm leading-snug">
                      {m.label}
                      {m.id === 'card' && (
                        <span className="text-gray-400 font-normal ml-1 text-xs">(Visa &amp; Mastercard)</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-5 flex items-center gap-1.5">
              <span className="text-[#C4973A]">🔒</span>
              Alle Online-Zahlungen sind SSL-verschlüsselt und werden sicher über Stripe verarbeitet.
            </p>
          </section>

          {/* ══════════════════════════════
              SEKTION 2 — Liefergebiet & Gebühren
          ══════════════════════════════ */}
          <section className="mb-14">
            <h2 className="font-cinzel text-xl text-[#C4973A] tracking-widest uppercase mb-2">
              Liefergebiet &amp; Gebühren
            </h2>
            <div className="w-12 h-px bg-[#C4973A] mb-6 opacity-50" />
            <p className="text-gray-300 text-sm mb-6 flex items-center gap-2">
              <MapPin size={14} className="text-[#C4973A] shrink-0" />
              Wir liefern aktuell in folgendes Gebiet:
            </p>

            {activeZones.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-[rgba(196,151,58,0.15)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[rgba(196,151,58,0.08)] border-b border-[rgba(196,151,58,0.15)]">
                      <th className="text-left px-5 py-3 text-[#C4973A] font-cinzel text-xs tracking-wider font-semibold">PLZ</th>
                      <th className="text-left px-5 py-3 text-[#C4973A] font-cinzel text-xs tracking-wider font-semibold">Ort</th>
                      <th className="text-left px-5 py-3 text-[#C4973A] font-cinzel text-xs tracking-wider font-semibold">Liefergebühr</th>
                      {hasMinOrder && (
                        <th className="text-left px-5 py-3 text-[#C4973A] font-cinzel text-xs tracking-wider font-semibold">Mindestbestellwert</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeZones.map((zone, i) => (
                      <tr
                        key={zone.id}
                        className={i % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#161616]'}
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-white">{zone.zip}</td>
                        <td className="px-5 py-3.5 text-gray-200">{zone.city}</td>
                        <td className="px-5 py-3.5 text-gray-200">{deliveryFee.toFixed(2).replace('.', ',')} €</td>
                        {hasMinOrder && (
                          <td className="px-5 py-3.5 text-gray-200">{minOrderValue.toFixed(2).replace('.', ',')} €</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Keine Liefergebiete konfiguriert.</p>
            )}

            {/* Lieferzeiten */}
            {deliveryDays.length > 0 && (
              <div className="mt-8">
                <h3 className="font-cinzel text-sm text-[#C4973A] tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Clock size={14} />
                  Lieferzeiten
                </h3>
                <div className="space-y-1.5">
                  {deliveryDays.map(d => (
                    <div key={d.day} className="flex justify-between text-sm border-b border-[rgba(255,255,255,0.05)] pb-1.5">
                      <span className="text-gray-400 w-32">{d.label}</span>
                      {d.closed ? (
                        <span className="text-gray-600">Geschlossen</span>
                      ) : (
                        <span className="text-gray-200">{d.open} – {d.close} Uhr</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Außerhalb-Hinweis */}
            <div className="mt-8 flex items-start gap-3 bg-[#1a1a1a] border border-[rgba(196,151,58,0.12)] rounded-xl px-5 py-4 text-sm">
              <Mail size={16} className="text-[#C4973A] shrink-0 mt-0.5" />
              <p className="text-gray-400 leading-relaxed">
                Sie wohnen außerhalb?{' '}
                <a href={`mailto:${shopEmail}`} className="text-[#C4973A] hover:underline">
                  Schreiben Sie uns
                </a>{' '}
                — wir prüfen Erweiterungen gerne.
              </p>
            </div>
          </section>

          {/* ── Zurück-Link ── */}
          <div className="border-t border-[rgba(196,151,58,0.15)] pt-8">
            <Link href="/" className="text-sm text-gray-500 hover:text-[#C4973A] transition">
              ← Zurück zur Startseite
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await supabase
    .from('shop_settings')
    .select('delivery_fee, min_order_value, delivery_zones, opening_hours')
    .eq('id', 'main')
    .single()

  const zones: Zone[] = data?.delivery_zones ?? [{ id: '1', zip: '40764', city: 'Langenfeld', enabled: true }]
  const deliveryFee: number = data?.delivery_fee ?? 3.0
  const minOrderValue: number = data?.min_order_value ?? 15.0

  const deliveryDays: DeliveryDay[] = DAY_ORDER
    .map(day => {
      const h = getDeliveryHours(data?.opening_hours?.[day])
      return { day, label: DAY_LABELS[day], closed: h.closed, open: h.open, close: h.close }
    })
    .filter(d => {
      // Nur anzeigen wenn irgendein Tag konfiguriert ist
      return data?.opening_hours && Object.keys(data.opening_hours).length > 0
    })

  return {
    props: {
      deliveryFee,
      minOrderValue,
      zones,
      deliveryDays,
      shopEmail: 'bestellung@eiscafe-simonetti.de',
    },
    revalidate: 3600,
  }
}
