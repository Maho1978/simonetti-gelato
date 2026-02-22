import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        {/* ── Basis Meta ── */}
        <meta charSet="UTF-8" />
        <meta name="description" content="Eiscafé Simonetti Langenfeld – Frisches Eis & Gelato jetzt bequem online bestellen mit Lieferservice. Lieferung in 40764 Langenfeld." />
        <meta name="keywords" content="Eiscafé Simonetti, Eis bestellen Langenfeld, Gelato Langenfeld, Eislieferung Langenfeld, Eisdiele Langenfeld, Eis online bestellen 40764" />
        <meta name="author" content="Eiscafé Simonetti" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.eiscafe-simonetti.de" />

        {/* ── Open Graph (Facebook, WhatsApp, etc.) ── */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta property="og:site_name" content="Eiscafé Simonetti" />
        <meta property="og:title" content="Eiscafé Simonetti Langenfeld – Eis & Gelato mit Lieferservice" />
        <meta property="og:description" content="Frisches Eis & Gelato jetzt bequem online bestellen. Lieferservice in Langenfeld (40764). Täglich frisch zubereitet!" />
        <meta property="og:url" content="https://www.eiscafe-simonetti.de" />
        <meta property="og:image" content="https://www.eiscafe-simonetti.de/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Eiscafé Simonetti Langenfeld" />

        {/* ── Twitter Card ── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Eiscafé Simonetti – Eis mit Lieferservice Langenfeld" />
        <meta name="twitter:description" content="Frisches Gelato online bestellen. Lieferservice in Langenfeld 40764." />
        <meta name="twitter:image" content="https://www.eiscafe-simonetti.de/og-image.jpg" />

        {/* ── Favicon ── */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#4a5d54" />

        {/* ── Schema.org – LocalBusiness + FoodEstablishment + Delivery ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["FoodEstablishment", "IceCreamShop"],
              "name": "Eiscafé Simonetti",
              "description": "Frisches Eis & Gelato mit Lieferservice in Langenfeld. Täglich frisch zubereitet – jetzt online bestellen!",
              "url": "https://www.eiscafe-simonetti.de",
              "telephone": "+492173162278",
              "email": "bestellung@eiscafe-simonetti.de",
              "image": "https://www.eiscafe-simonetti.de/og-image.jpg",
              "priceRange": "€",
              "servesCuisine": ["Gelato", "Eis", "Desserts"],
              "hasMenu": "https://www.eiscafe-simonetti.de",
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
                "latitude": 51.1089,
                "longitude": 6.9482
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
                      "description": "Frisches Eis & Gelato direkt zu Ihnen nach Hause geliefert"
                    }
                  }
                ]
              },
              "potentialAction": {
                "@type": "OrderAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.eiscafe-simonetti.de",
                  "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform"
                  ]
                },
                "deliveryMethod": ["http://purl.org/goodrelations/v1#DeliveryModeDirectDownload"],
                "result": {
                  "@type": "Order",
                  "orderStatus": "http://schema.org/OrderProcessing"
                }
              },
              "areaServed": {
                "@type": "PostalCodeRangeSpecification",
                "postalCodeBegin": "40764",
                "postalCodeEnd": "40764"
              },
              "sameAs": [
                "https://www.google.com/maps/place/Eiscaf%C3%A9+Simonetti"
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