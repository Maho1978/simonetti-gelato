import Link from 'next/link'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          
          {/* Logo & Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image 
                src="/images/simonetti-logo.jpg" 
                alt="Simonetti Logo" 
                width={50} 
                height={50}
                className="rounded-full"
              />
              <div>
                <h3 className="font-display font-bold text-lg">EISCAFE SIMONETTI</h3>
                <p className="text-sm text-gray-400 italic">Gelateria</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Italienisches Eis seit Generationen. Handgemacht mit Liebe und besten Zutaten.
            </p>
          </div>

          {/* Kontakt */}
          <div>
            <h4 className="font-bold text-lg mb-4">Kontakt</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Konrad-Adenauer-Platz 2</p>
                  <p>40764 Langenfeld</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-gray-400 flex-shrink-0" />
                <a href="tel:021731622780" className="hover:text-white transition">
                  02173 1622780
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <a href="mailto:info@eiscafe-simonetti.de" className="hover:text-white transition">
                  info@eiscafe-simonetti.de
                </a>
              </div>
            </div>
          </div>

          {/* Öffnungszeiten */}
          <div>
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Clock size={20} />
              Öffnungszeiten
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Mo - Sa:</span>
                <span>09:00 - 19:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">So - Feiertage:</span>
                <span>13:00 - 19:00</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Mehr</h4>
            <div className="space-y-2 text-sm">
              <Link href="/ueber-uns" className="block hover:text-white transition">
                Über uns
              </Link>
              <Link href="/impressum" className="block hover:text-white transition">
                Impressum
              </Link>
              <Link href="/datenschutz" className="block hover:text-white transition">
                Datenschutz
              </Link>
              <Link href="/agb" className="block hover:text-white transition">
                AGB
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 Eiscafe Simonetti. Alle Rechte vorbehalten.</p>
          <p className="mt-2">Handgemachtes italienisches Gelato in Langenfeld</p>
        </div>
      </div>
    </footer>
  )
}