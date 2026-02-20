import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function AGB() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={null} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-display font-bold italic mb-8" style={{ color: '#4a5d54' }}>
          Allgemeine Geschäftsbedingungen
        </h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>1. Geltungsbereich</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen über den Online-Shop 
              von Eiscafe Simonetti, Langenfeld. Mit der Bestellung erkennen Sie diese Bedingungen an.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>2. Vertragspartner</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Der Vertrag kommt zustande mit:<br />
              <strong>Eiscafe Simonetti</strong><br />
              Konrad-Adenauer-Platz 2<br />
              40764 Langenfeld<br />
              Deutschland
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>3. Vertragsschluss</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Der Vertrag kommt durch Ihre Bestellung und unsere Annahme zustande. Sie erhalten eine 
              Bestellbestätigung per E-Mail. Mit Versand der Ware wird der Vertrag verbindlich.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>4. Preise und Zahlungsbedingungen</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Alle Preise verstehen sich in Euro (€) inklusive der gesetzlichen Mehrwertsteuer. 
              Die Liefergebühr beträgt 3,00 € pro Bestellung. Der Mindestbestellwert liegt bei 15,00 €.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Zahlungsarten:</strong><br />
              - Kreditkarte (Visa, Mastercard)<br />
              - SEPA-Lastschrift<br />
              - giropay<br />
              - Sofort-Überweisung<br />
              - Apple Pay / Google Pay<br />
              - PayPal (falls aktiviert)
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>5. Lieferung</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die Lieferung erfolgt ausschließlich im Liefergebiet Langenfeld (PLZ 40764). 
              Die angegebene Lieferzeit ist eine Schätzung. Wir bemühen uns um pünktliche Zustellung.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>6. Widerrufsrecht</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Wichtiger Hinweis:</strong> Bei Lebensmitteln (verderbliche Waren) besteht nach 
              § 312g Abs. 2 Nr. 2 BGB kein Widerrufsrecht. Der Vertrag ist mit Lieferung erfüllt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>7. Gewährleistung</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sollten Sie mit der Qualität nicht zufrieden sein, kontaktieren Sie uns bitte umgehend. 
              Wir finden eine Lösung.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>8. Haftung</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wir haften nach den gesetzlichen Bestimmungen für Schäden aus der Verletzung des Lebens, 
              des Körpers oder der Gesundheit sowie bei Vorsatz und grober Fahrlässigkeit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>9. Streitbeilegung</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: 
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" className="text-blue-600 underline">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>10. Schlussbestimmungen</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Sollten einzelne Bestimmungen 
              dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t" style={{ borderColor: '#e5e7eb' }}>
          <p className="text-sm text-gray-500">Stand: Februar 2026</p>
          <div className="mt-4 flex gap-4">
            <Link href="/impressum" className="text-sm hover:underline" style={{ color: '#4a5d54' }}>
              Impressum
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