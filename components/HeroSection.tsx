import Link from 'next/link'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <>
      {/* Hero - Groß & Eindrucksvoll */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-gray-900">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-gelato.jpg"  // Professionelles Eis-Foto
            alt="Italienisches Gelato"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <h1 className="font-display text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            Italienisches Gelato
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 font-light">
            Handwerklich hergestellt nach traditioneller Rezeptur
          </p>
          <Link href="#speisekarte">
            <button className="px-10 py-4 bg-white text-black font-medium text-sm uppercase tracking-wider hover:bg-gray-100 transition">
              Jetzt bestellen
            </button>
          </Link>
          <p className="mt-4 text-sm text-gray-300">🕐 Lieferung in 30–45 Minuten · Mindestbestellwert 15 €</p>
        </div>
      </section>

      {/* Features - 3 Spalten */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            
            <div className="text-center">
              <div className="text-5xl mb-6">🇮🇹</div>
              <h3 className="font-display text-2xl font-bold mb-3">Traditionell</h3>
              <p className="text-gray-600 leading-relaxed">
                Nach original italienischer Rezeptur handwerklich gefertigt
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-6">🌿</div>
              <h3 className="font-display text-2xl font-bold mb-3">Natürlich</h3>
              <p className="text-gray-600 leading-relaxed">
                100% natürliche Zutaten, keine künstlichen Aromen
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-6">🏆</div>
              <h3 className="font-display text-2xl font-bold mb-3">Qualität</h3>
              <p className="text-gray-600 leading-relaxed">
                Täglich frisch zubereitet in unserer Manufaktur
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Über uns - Dunkler Bereich */}
      <section className="py-24 bg-[#1a1a1a] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Unsere Geschichte
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Authentisches Gelato nach italienischer Tradition. Unsere Familie führt die Kunst der Eisherstellung 
                mit Hingabe und Stolz fort – was als kleiner Familienbetrieb begann, ist heute eine feste Größe in Langenfeld.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Jede Sorte wird täglich frisch in unserer eigenen Manufaktur hergestellt – 
                mit Leidenschaft, Präzision und nur den besten Zutaten. Ehrliches Handwerk statt Abkürzungen.
              </p>
              <Link href="/ueber-uns">
                <button className="px-8 py-3 border-2 border-white text-white font-medium text-sm uppercase tracking-wider hover:bg-white hover:text-black transition">
                  Mehr erfahren
                </button>
              </Link>
            </div>

            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="/images/manufaktur.jpg"
                alt="Unsere Manufaktur"
                fill
                className="object-cover"
              />
            </div>

          </div>
        </div>
      </section>

      {/* CTA - Gold Akzent */}
      <section className="py-20 bg-[#c9a66b]">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-black mb-6">
            Bestellen Sie jetzt
          </h2>
          <p className="text-xl text-black/80 mb-8">
            Lieferung direkt zu Ihnen nach Hause in 30-45 Minuten
          </p>
          <Link href="#speisekarte">
            <button className="px-10 py-4 bg-black text-white font-medium text-sm uppercase tracking-wider hover:bg-gray-900 transition">
              Zur Speisekarte
            </button>
          </Link>
        </div>
      </section>
    </>
  )
}