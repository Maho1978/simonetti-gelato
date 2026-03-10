import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function AboutPage() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold italic mb-4" style={{ color: '#4a5d54' }}>
            Über uns
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tradition, Qualität und Leidenschaft für italienisches Gelato seit Generationen
          </p>
        </div>

        {/* Story */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>
              Unsere Geschichte: Wahre Leidenschaft für Gelato & Caffè
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Es gibt Momente, die man nicht erklären muss, sobald man sie genießt. Ein echtes italienisches Gelato und ein perfekt zubereiteter Espresso gehören dazu. Im Eiscafe Simonetti ist dieses Lebensgefühl unser täglicher Antrieb.
              </p>
              <h3 className="text-xl font-bold mt-6 mb-3" style={{ color: '#4a5d54' }}>
                Ehrliches Handwerk statt Abkürzungen
              </h3>
              <p>
                In unserer eigenen Manufaktur in Langenfeld fertigen wir unser Eis jeden Tag frisch an. Wir glauben an das traditionelle Handwerk und verzichten auf unnötige Zusätze. Für uns zählt nur der pure Geschmack. Jede Sorte wird mit Ruhe und Präzision gerührt, bis sie genau die Cremigkeit erreicht, die unsere Kunden so lieben.
              </p>
              <h3 className="text-xl font-bold mt-6 mb-3" style={{ color: '#4a5d54' }}>
                Qualität, die man fühlen kann
              </h3>
              <p>
                Was in unsere Eismaschine kommt, entscheiden wir mit größter Sorgfalt. Wir setzen auf natürliche Zutaten und hochwertige Rohstoffe, die wir mit Bedacht auswählen. Das Ergebnis ist ein ehrliches Produkt, bei dem man die Qualität in jedem einzelnen Löffel spüren kann.
              </p>
              <h3 className="text-xl font-bold mt-6 mb-3" style={{ color: '#4a5d54' }}>
                Die italienische Kaffeekultur
              </h3>
              <p>
                Neben unserem Eis schlägt unser Herz für den Kaffee. Bei uns erwartet Sie keine industrielle Massenware, sondern richtig guter, italienischer Kaffee. Mit handwerklicher Präzision zubereitet, ist jede Tasse ein kurzes Stück Urlaub – intensiv, aromatisch und authentisch.
              </p>
              <h3 className="text-xl font-bold mt-6 mb-3" style={{ color: '#4a5d54' }}>
                Ein Treffpunkt für Genießer
              </h3>
              <p>
                Das Simonetti ist mehr als nur ein Eiscafé. Es ist ein Ort der Begegnung im Herzen von Langenfeld. Wir laden Sie ein, die Hektik des Alltags für einen Moment zu vergessen. Und wer dieses Gefühl lieber zu Hause genießen möchte: Unser Lieferservice bringt unser handgemachtes Gelato nun direkt zu Ihnen an die Haustür.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>
              Unsere Philosophie
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🍦</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Handgemacht</h3>
                  <p className="text-gray-700">
                    Jede Sorte wird täglich frisch in unserer eigenen Eismanufaktur hergestellt.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-4xl">🌱</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Beste Zutaten</h3>
                  <p className="text-gray-700">
                    Wir verwenden nur hochwertige, ausgewählte Zutaten – viele davon direkt aus Italien.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-4xl">❤️</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Mit Liebe gemacht</h3>
                  <p className="text-gray-700">
                    Tradition und Leidenschaft prägen jede einzelne Sorte – das schmeckt man!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kontakt */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <h2 className="text-3xl font-display font-bold italic mb-8 text-center" style={{ color: '#4a5d54' }}>
            Besuchen Sie uns
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-[#4a5d54] mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-1">Adresse</h3>
                  <p className="text-gray-700">
                    Konrad-Adenauer-Platz 2<br />
                    40764 Langenfeld
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="text-[#4a5d54] mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-1">Telefon</h3>
                  <a href="tel:021731622780" className="text-[#4a5d54] hover:underline">
                    02173 1622780
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="text-[#4a5d54] mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-1">E-Mail</h3>
                  <a href="mailto:info@eiscafe-simonetti.de" className="text-[#4a5d54] hover:underline">
                    info@eiscafe-simonetti.de
                  </a>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-4 mb-6">
                <Clock className="text-[#4a5d54] mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-3">Öffnungszeiten</h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>Montag - Samstag:</span>
                      <span className="font-semibold">09:00 - 19:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sonntag - Feiertage</span>
                      <span className="font-semibold">13:00 - 19:00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Maps */}
              <div className="rounded-xl overflow-hidden" style={{ height: '220px' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2504.7945246600675!2d6.949083976946619!3d51.11225113949294!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bf2d30273bfa4f%3A0x21b61a6be3eb26e0!2sEiscafe%20Simonetti!5e0!3m2!1sde!2sde!4v1771752134071!5m2!1sde!2sde"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Eiscafé Simonetti"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>
            Bereit für eine Bestellung?
          </h2>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-4 bg-[#4a5d54] text-white font-bold text-lg rounded-full hover:opacity-90 transition"
          >
            Zur Speisekarte →
          </button>
        </div>

      </div>

      <Footer />
    </div>
  )
}