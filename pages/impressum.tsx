import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Impressum() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={null} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-display font-bold italic mb-8" style={{ color: '#4a5d54' }}>
          Impressum
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Angaben gemäß § 5 TMG</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Eiscafe Simonetti</strong><br />
              Inhaber: Mahmut Duran<br />
              Konrad-Adenauer-Platz 2<br />
              40764 Langenfeld<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Kontakt</h2>
            <p className="text-gray-700 leading-relaxed">
              Telefon: +49 (0) 2173 1622780<br />
              E-Mail: info@eiscafe-simonetti.de<br />
              Website: www.eiscafe-simonetti.de
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Umsatzsteuer-ID</h2>
            <p className="text-gray-700 leading-relaxed">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
              DE268821089 <em className="text-sm text-gray-500"></em>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Verantwortlich für den Inhalt</h2>
            <p className="text-gray-700 leading-relaxed">
              Nach § 55 Abs. 2 RStV:<br />
              Mahmut Duran<br />
              Konrad-Adenauer-Platz 2<br />
              40764 Langenfeld
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>EU-Streitschlichtung</h2>
            <p className="text-gray-700 leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" 
                className="text-blue-600 hover:underline">
                https://ec.europa.eu/consumers/odr
              </a><br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Haftung für Inhalte</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach 
              den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter 
              jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen 
              oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen 
              Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt 
              der Kenntnis einer konkreten Rechtsverletzung möglich.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Haftung für Links</h2>
            <p className="text-gray-700 leading-relaxed">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss 
              haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte 
              der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Urheberrecht</h2>
            <p className="text-gray-700 leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem 
              deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung 
              außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen 
              Autors bzw. Erstellers.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex gap-4">
            <Link href="/agb" className="text-sm hover:underline" style={{ color: '#4a5d54' }}>
              AGB
            </Link>
            <Link href="/datenschutz" className="text-sm hover:underline" style={{ color: '#4a5d54' }}>
              Datenschutz
            </Link>
            <Link href="/" className="text-sm hover:underline" style={{ color: '#4a5d54' }}>
              Zurück zum Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}