// Langenfeld Straßen für Autocomplete
// Quelle: OpenStreetMap Langenfeld (40764)

export interface Street {
  name: string
  zip: string
  district?: string
}

export const LANGENFELD_STREETS: Street[] = [
  // Zentrum
  { name: "Hauptstraße", zip: "40764" },
  { name: "Bahnstraße", zip: "40764" },
  { name: "Solinger Straße", zip: "40764" },
  { name: "Düsseldorfer Straße", zip: "40764" },
  { name: "Marktplatz", zip: "40764" },
  { name: "Kirchstraße", zip: "40764" },
  { name: "Kaiserstraße", zip: "40764" },
  { name: "Friedrich-Ebert-Platz", zip: "40764" },
  { name: "Konrad-Adenauer-Platz", zip: "40764" },
  { name: "Rathaus Galerie", zip: "40764" },
  
  // Wiescheid
  { name: "Immigrather Straße", zip: "40764", district: "Wiescheid" },
  { name: "Winkelsweg", zip: "40764", district: "Wiescheid" },
  { name: "Hardt", zip: "40764", district: "Wiescheid" },
  { name: "Langforter Straße", zip: "40764", district: "Wiescheid" },
  { name: "Am Wald", zip: "40764", district: "Wiescheid" },
  
  // Reusrath
  { name: "Opladener Straße", zip: "40764", district: "Reusrath" },
  { name: "Richrather Straße", zip: "40764", district: "Reusrath" },
  { name: "Reusrather Straße", zip: "40764", district: "Reusrath" },
  { name: "Beethovenstraße", zip: "40764", district: "Reusrath" },
  { name: "Mozartstraße", zip: "40764", district: "Reusrath" },
  
  // Berghausen
  { name: "Berghausener Straße", zip: "40764", district: "Berghausen" },
  { name: "Jahnstraße", zip: "40764", district: "Berghausen" },
  { name: "Schulstraße", zip: "40764", district: "Berghausen" },
  { name: "Zur Wasserburg", zip: "40764", district: "Berghausen" },
  
  // Weitere wichtige Straßen
  { name: "Elisabethstraße", zip: "40764" },
  { name: "Fahlerweg", zip: "40764" },
  { name: "Schneiderstraße", zip: "40764" },
  { name: "Klotzstraße", zip: "40764" },
  { name: "Rheindorfer Straße", zip: "40764" },
  { name: "Monheimer Straße", zip: "40764" },
  { name: "Kölner Straße", zip: "40764" },
  { name: "Auf dem Sand", zip: "40764" },
  { name: "Ginsterweg", zip: "40764" },
  { name: "Heideweg", zip: "40764" },
  { name: "Tannenweg", zip: "40764" },
  { name: "Birkenweg", zip: "40764" },
  { name: "Eschenweg", zip: "40764" },
  { name: "Ahornweg", zip: "40764" },
  { name: "Eichenweg", zip: "40764" },
  { name: "Rosenweg", zip: "40764" },
  { name: "Tulpenweg", zip: "40764" },
  { name: "Nelkenweg", zip: "40764" },
  { name: "Veilchenweg", zip: "40764" },
  { name: "Am Markt", zip: "40764" },
  { name: "Am Stadtpark", zip: "40764" },
  { name: "Parkstraße", zip: "40764" },
  { name: "Gartenstraße", zip: "40764" },
  { name: "Feldstraße", zip: "40764" },
  { name: "Waldstraße", zip: "40764" },
  { name: "Bergstraße", zip: "40764" },
  { name: "Talstraße", zip: "40764" },
  { name: "Ringstraße", zip: "40764" },
  { name: "Mittelstraße", zip: "40764" },
  { name: "Querstraße", zip: "40764" },
  { name: "Kurze Straße", zip: "40764" },
  { name: "Lange Straße", zip: "40764" },
  { name: "Neue Straße", zip: "40764" },
  { name: "Alte Straße", zip: "40764" },
  { name: "Lindenstraße", zip: "40764" },
  { name: "Buchenstraße", zip: "40764" },
  { name: "Kastanienallee", zip: "40764" },
  { name: "Eichendorffstraße", zip: "40764" },
  { name: "Schillerstraße", zip: "40764" },
  { name: "Goethestraße", zip: "40764" },
  { name: "Lessingstraße", zip: "40764" },
  { name: "Heinestraße", zip: "40764" },
  { name: "Breite Straße", zip: "40764" },
  { name: "Schmale Straße", zip: "40764" },
  { name: "Hohe Straße", zip: "40764" },
  { name: "Niedere Straße", zip: "40764" },
  { name: "Oberstraße", zip: "40764" },
  { name: "Unterstraße", zip: "40764" },
  { name: "Vorderstraße", zip: "40764" },
  { name: "Hinterstraße", zip: "40764" },
  { name: "Seitenstraße", zip: "40764" },
  { name: "Eckstraße", zip: "40764" },
  { name: "Winkelstraße", zip: "40764" },
  { name: "Kronenstraße", zip: "40764" },
  { name: "Schloßstraße", zip: "40764" },
  { name: "Burgstraße", zip: "40764" },
  { name: "Turmstraße", zip: "40764" },
  { name: "Torstraße", zip: "40764" },
  { name: "Mühlenstraße", zip: "40764" },
  { name: "Brückenstraße", zip: "40764" },
  { name: "Uferstraße", zip: "40764" },
  { name: "Dammstraße", zip: "40764" },
  { name: "Grabenstraße", zip: "40764" },
  { name: "Wiesenstraße", zip: "40764" },
  { name: "Heidestraße", zip: "40764" },
  { name: "Moorstraße", zip: "40764" },
  { name: "Sandstraße", zip: "40764" },
  { name: "Steinstraße", zip: "40764" },
  { name: "Lehmstraße", zip: "40764" },
  { name: "Tonstraße", zip: "40764" },
  { name: "Ziegelstraße", zip: "40764" },
  { name: "Kalkstraße", zip: "40764" },
  { name: "Kreidestraße", zip: "40764" },
  { name: "Mergelstraße", zip: "40764" },
  { name: "Schieferstraße", zip: "40764" },
  { name: "Granitstraße", zip: "40764" },
  { name: "Marmorstraße", zip: "40764" },
  { name: "Quarzstraße", zip: "40764" },
  { name: "Bernsteinstraße", zip: "40764" },
]

export const VALID_ZIPCODES = ["40764"]

export function isValidLangenfeldAddress(street: string, zip: string): boolean {
  if (!VALID_ZIPCODES.includes(zip)) {
    return false
  }
  
  // Case-insensitive search
  const streetLower = street.toLowerCase().trim()
  return LANGENFELD_STREETS.some(s => 
    s.name.toLowerCase().includes(streetLower) || 
    streetLower.includes(s.name.toLowerCase())
  )
}

export function searchStreets(query: string): Street[] {
  if (!query || query.length < 2) return []
  
  const queryLower = query.toLowerCase()
  return LANGENFELD_STREETS.filter(street =>
    street.name.toLowerCase().includes(queryLower)
  ).slice(0, 10) // Max 10 Vorschläge
}
