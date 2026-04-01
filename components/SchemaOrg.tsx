// components/SchemaOrg.tsx
// Einbinden in app/layout.tsx oder app/page.tsx via <SchemaOrg />

export default function SchemaOrg() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "IceCreamShop",
    "name": "Eiscafé Simonetti",
    "alternateName": "Eiscafe Simonetti Langenfeld",
    "url": "https://www.eiscafe-simonetti.de",
    "logo": "https://www.eiscafe-simonetti.de/images/simonetti-logo.jpg",
    "image": "https://www.eiscafe-simonetti.de/images/hero-gelato.jpg",
    "description": "Eiscafé Simonetti in Langenfeld – handgemachtes italienisches Gelato täglich frisch aus eigener Manufaktur. Eisbecher, Spaghetti Eis, Waffeln & Lieferservice in Langenfeld und Umgebung.",
    "address": {
      "@type": "PostalAddress",
      // HINWEIS FÜR MARIO:
      // Offizielle Adresse für Google Business & Impressum:
      "streetAddress": "Konrad-Adenauer-Platz 2",
      // Navi-Adresse (Solinger Str. 54) kannst du als zweites
      // Schema-Objekt ergänzen oder als Hinweis auf der Website zeigen.
      "addressLocality": "Langenfeld",
      "addressRegion": "Nordrhein-Westfalen",
      "postalCode": "40764",
      "addressCountry": "DE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      // Koordinaten für Konrad-Adenauer-Platz 2, Langenfeld
      "latitude": 51.1087,
      "longitude": 6.9499
    },
    "telephone": "+492173-1622780",
    "email": "bestellung@eiscafe-simonetti.de",
    "priceRange": "€€",
    "servesCuisine": ["Italienisch", "Gelato", "Speiseeis"],
    "menu": "https://www.eiscafe-simonetti.de/#speisekarte",
    "hasMap": "https://maps.google.com/?cid=DEINE_GOOGLE_PLACE_ID", // ← Place ID: ChIJT_o7JzAtv0cR4Cbr42satiE
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
    "sameAs": [
      "https://www.instagram.com/eiscafesimonettilangenfeld/",
      "https://www.tiktok.com/@eiscafe_simonetti"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.3",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "321" // deine 321 Google Reviews
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
      "deliveryMethod": ["http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"]
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
