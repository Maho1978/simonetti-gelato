import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

export default function ConstructionPage() {
  return (
    <>
      <Head>
        <title>Eiscafe Simonetti - Bald verfügbar</title>
        <meta name="description" content="Eiscafe Simonetti - Italienisches Gelato in Langenfeld. Bald können Sie online bestellen!" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#4a5d54] to-[#2d3a33] flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute w-[500px] h-[500px] bg-white/10 rounded-full -top-64 -left-64 animate-float"></div>
        <div className="absolute w-[400px] h-[400px] bg-white/5 rounded-full -bottom-48 -right-48 animate-float-reverse"></div>

        <div className="relative z-10 text-center max-w-2xl w-full">
          <div className="bg-white rounded-3xl p-12 md:p-16 shadow-2xl">
            
            {/* Logo */}
            <div className="w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden shadow-xl">
              <Image 
                src="/images/simonetti-logo.jpg" 
                alt="Eiscafe Simonetti Logo" 
                width={128} 
                height={128}
                className="object-cover"
              />
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-display font-bold italic mb-3 text-gray-900">
              EISCAFE SIMONETTI
            </h1>
            <p className="text-gray-600 italic text-lg mb-8">Gelateria</p>

            <div className="w-20 h-1 bg-[#4a5d54] mx-auto mb-8"></div>

            {/* Message */}
            <p className="text-xl text-gray-700 mb-4 leading-relaxed">
              Wir bereiten gerade etwas Besonderes für Sie vor! 🎉
            </p>
            <p className="text-lg text-gray-600 mb-10">
              <strong>Bald können Sie unsere italienischen Eisspezialitäten auch online bestellen.</strong>
            </p>

            {/* Icons */}
            <div className="flex justify-center gap-8 md:gap-12 mb-10 flex-wrap">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#4a5d54] to-[#2d3a33] rounded-full flex items-center justify-center text-4xl mb-3 mx-auto animate-pulse">
                  🍦
                </div>
                <p className="text-sm font-semibold text-gray-700">Handgemacht</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#4a5d54] to-[#2d3a33] rounded-full flex items-center justify-center text-4xl mb-3 mx-auto animate-pulse" style={{ animationDelay: '0.2s' }}>
                  🇮🇹
                </div>
                <p className="text-sm font-semibold text-gray-700">Original</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#4a5d54] to-[#2d3a33] rounded-full flex items-center justify-center text-4xl mb-3 mx-auto animate-pulse" style={{ animationDelay: '0.4s' }}>
                  🚚
                </div>
                <p className="text-sm font-semibold text-gray-700">Lieferung</p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-3">
              <div className="flex items-center justify-center gap-3 text-gray-700">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>Konrad-Adenauer-Platz 2, 40764 Langenfeld</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-700">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>02173 1622780</span>
              </div>
            </div>

            {/* Admin Link */}
            <Link 
              href="/admin"
              className="inline-block px-8 py-3 bg-[#4a5d54] text-white rounded-lg font-semibold hover:bg-[#3a4d44] transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              🔐 Admin Login
            </Link>

            {/* Footer */}
            <p className="text-sm text-gray-500 mt-8">
              © 2026 Eiscafe Simonetti · Italienisches Eis seit Generationen
            </p>

          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(50px) translateX(30px); }
          }
          
          .animate-float {
            animation: float 20s infinite ease-in-out;
          }
          
          .animate-float-reverse {
            animation: float 15s infinite ease-in-out reverse;
          }
        `}</style>
      </div>
    </>
  )
}