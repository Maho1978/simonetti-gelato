import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        {/* ── Basis Meta ── */}
        <meta charSet="UTF-8" />
        <meta name="description" content="Eiscafé Simonetti in Langenfeld – handgemachtes italienisches Gelato täglich frisch aus eigener Manufaktur. Eisbecher, Spaghetti Eis, Waffeln & Lieferservice in Langenfeld." />
        <meta name="keywords" content="Eisdiele Langenfeld, Eiscafé Langenfeld, Gelato Langenfeld, Eis bestellen Langenfeld, Eis Lieferservice Langenfeld, Spaghetti Eis, Italienisches Eis Langenfeld, Eiscafé Simonetti, handgemacht, 40764" />
        <meta name="author" content="Eiscafé Simonetti" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://www.eiscafe-simonetti.de" />
        <meta name="google-site-verification" content="bqsyTeKIMKQc23aJ7bTaW093sAdp1XjUSgZ_lcEtCeM" />
        <meta name="theme-color" content="#c8a96e" />
        <link rel="manifest" href="/manifest.json" />

        {/* ── Open Graph (WhatsApp, Facebook, LinkedIn) ── */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta property="og:site_name" content="Eiscafé Simonetti Langenfeld" />
        <meta property="og:title" content="Eiscafé Simonetti Langenfeld | Gelato & Eis Lieferservice" />
        <meta property="og:description" content="Handgemachtes Gelato aus eigener Manufaktur. Jetzt online bestellen & liefern lassen!" />
        <meta property="og:url" content="https://www.eiscafe-simonetti.de" />
        <meta property="og:image" content="https://www.eiscafe-simonetti.de/images/hero-gelato.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Frisches Gelato von Eiscafé Simonetti Langenfeld" />

        {/* ── Twitter/X Card ── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Eiscafé Simonetti Langenfeld | Gelato & Eis Lieferservice" />
        <meta name="twitter:description" content="Handgemachtes Gelato aus eigener Manufaktur. Jetzt online bestellen!" />
        <meta name="twitter:image" content="https://www.eiscafe-simonetti.de/images/hero-gelato.jpg" />

        {/* ── Favicon ── */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

        {/* ── Schema.org ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["FoodEstablishment", "IceCreamShop"],
              "name": "Eiscafé Simonetti",
              "alternateName": "Eiscafe Simonetti Langenfeld",
              "description": "Eiscafé Simonetti in Langenfeld – handgemachtes italienisches Gelato täglich frisch aus eigener Manufaktur. Eisbecher, Spaghetti Eis, Waffeln & Lieferservice.",
              "url": "https://www.eiscafe-simonetti.de",
              "logo": "https://www.eiscafe-simonetti.de/images/simonetti-logo.jpg",
              "image": "https://www.eiscafe-simonetti.de/images/hero-gelato.jpg",
              "telephone": "+4921731622780",
              "email": "bestellung@eiscafe-simonetti.de",
              "priceRange": "€€",
              "servesCuisine": ["Gelato", "Speiseeis", "Italienisch", "Desserts"],
              "hasMenu": "https://www.eiscafe-simonetti.de/#speisekarte",
              "acceptsReservations": false,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Konrad-Adenauer-Platz 2",
                "postalCode": "40764",
                "addressLocality": "Langenfeld",
                "addressRegion": "Nordrhein-Westfalen",
                "addressCountry": "DE"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 51.10693,
                "longitude": 6.94938
              },
              "hasMap": "https://maps.google.com/?cid=ChIJT_o7JzAtv0cR4Cbr42satiE",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "09:00",
                  "closes": "19:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": "Saturday",
                  "opens": "10:00",
                  "closes": "19:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": "Sunday",
                  "opens": "13:00",
                  "closes": "19:00"
                }
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.3",
                "bestRating": "5",
                "worstRating": "1",
                "ratingCount": "321"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Eiskarte",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "FoodService",
                      "name": "Eis & Gelato Lieferservice",
                      "description": "Frisches handgemachtes Gelato direkt zu Ihnen nach Hause geliefert"
                    }
                  }
                ]
              },
              "potentialAction": {
                "@type": "OrderAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.eiscafe-simonetti.de/#speisekarte",
                  "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform"
                  ]
                },
                "deliveryMethod": ["http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"],
                "areaServed": {
                  "@type": "PostalCodeRangeSpecification",
                  "postalCodeBegin": "40764",
                  "postalCodeEnd": "40764"
                }
              },
              "sameAs": [
                "https://www.instagram.com/eiscafesimonettilangenfeld/",
                "https://www.tiktok.com/@eiscafe_simonetti"
              ]
            })
          }}
        />

        {/* ── Google Fonts ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
