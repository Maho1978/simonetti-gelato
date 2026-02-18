import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Datenschutz() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={null} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-display font-bold italic mb-8" style={{ color: '#4a5d54' }}>
          Datenschutzerklärung
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>1. Datenschutz auf einen Blick</h2>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#4a5d54' }}>Allgemeine Hinweise</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
              Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
              denen Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>2. Datenerfassung auf dieser Website</h2>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#4a5d54' }}>Wer ist verantwortlich?</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
              können Sie dem Impressum dieser Website entnehmen.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: '#4a5d54' }}>Wie erfassen wir Ihre Daten?</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z.B. bei einer Bestellung). 
              Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere 
              IT-Systeme erfasst (z.B. technische Daten wie Browser, Betriebssystem).
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: '#4a5d54' }}>Wofür nutzen wir Ihre Daten?</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die Daten werden erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten und 
              zur Abwicklung Ihrer Bestellungen.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: '#4a5d54' }}>Welche Rechte haben Sie?</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
              gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung 
              oder Löschung dieser Daten zu verlangen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>3. Hosting</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
            </p>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#4a5d54' }}>Vercel</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Anbieter: Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
              Website: <a href="https://vercel.com" target="_blank" className="text-blue-600 hover:underline">vercel.com</a>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Details entnehmen Sie der Datenschutzerklärung von Vercel: 
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" className="text-blue-600 hover:underline ml-1">
                https://vercel.com/legal/privacy-policy
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>4. Zahlungsdienstleister</h2>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#4a5d54' }}>Stripe</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wir nutzen Stripe als Zahlungsdienstleister für Kreditkartenzahlungen, SEPA, giropay und weitere 
              Zahlungsmethoden.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Anbieter: Stripe Inc., 510 Townsend Street, San Francisco, CA 94103, USA<br />
              Datenschutzerklärung: 
              <a href="https://stripe.com/de/privacy" target="_blank" className="text-blue-600 hover:underline ml-1">
                https://stripe.com/de/privacy
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>5. Datenerfassung bei Bestellung</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bei einer Bestellung erfassen wir folgende Daten:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Name und Lieferadresse</li>
              <li>E-Mail-Adresse</li>
              <li>Bestellte Produkte und Menge</li>
              <li>Zahlungsinformationen (werden direkt an Stripe übermittelt)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>6. Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Unsere Website verwendet Cookies. Das sind kleine Textdateien, die Ihr Webbrowser auf Ihrem Endgerät 
              speichert. Cookies helfen uns dabei, unser Angebot nutzerfreundlicher zu machen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wir verwenden nur technisch notwendige Cookies für:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Warenkorb-Speicherung</li>
              <li>Login-Status (wenn Sie ein Konto haben)</li>
              <li>Sitzungsverwaltung</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und 
              Cookies nur im Einzelfall erlauben.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>7. Ihre Rechte</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sie haben folgende Rechte:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Auskunftsrecht:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
              <li><strong>Berichtigungsrecht:</strong> Fehlerhafte Daten können Sie korrigieren lassen</li>
              <li><strong>Löschungsrecht:</strong> Sie können die Löschung Ihrer Daten verlangen</li>
              <li><strong>Einschränkung der Verarbeitung:</strong> Sie können die Verarbeitung einschränken lassen</li>
              <li><strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung widersprechen</li>
              <li><strong>Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem gängigen Format erhalten</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter: info@eiscafe-simonetti.de
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>8. Kontakt</h2>
            <p className="text-gray-700 leading-relaxed">
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br />
              E-Mail: info@eiscafe-simonetti.de<br />
              Telefon: +49 (0) 2173 1622780
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t" style={{ borderColor: '#e5e7eb' }}>
          <p className="text-sm text-gray-500 mb-4">Stand: Februar 2026</p>
          <div className="flex gap-4">
            <Link href="/agb" className="text-sm hover:underline" style={{ color: '#4a5d54' }}>
              AGB
            </Link>
            <Link href="/impressum" className="text-sm hover:underline" style={{ color: '#4a5d54' }}>
              Impressum
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