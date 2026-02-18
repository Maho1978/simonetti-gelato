# 🍕 FoodExpress - Premium Restaurant-Bestellplattform

**Production-Ready E-Commerce System** für Restaurants mit voller Zahlungsintegration, Liefergebiet-Validierung und Kundenbindung!

---

## 🌟 NEUE FEATURES (Erweiterte Version)

### 💳 **Alle Zahlungsmethoden**
- ✅ **Kreditkarten** (Visa, Mastercard, Amex) via Stripe
- ✅ **SEPA Lastschrift** (günstigste Option!)
- ✅ **Sofort/Klarna** (sehr beliebt in DE)
- ✅ **giropay** (Direkt-Überweisung)
- ✅ **Apple Pay** (automatisch auf iOS)
- ✅ **Google Pay** (automatisch auf Android)
- 🔄 **PayPal** (Vorbereitet - aktivierbar)

### 📍 **Liefergebiet Langenfeld (40764)**
- ✅ Automatische **PLZ-Validierung**
- ✅ **Straßen-Autocomplete** mit ~100 Langenfeld-Straßen
- ✅ Fehlermeldung wenn außerhalb des Liefergebiets
- ✅ Einfach erweiterbar auf andere Gebiete

### 💰 **Optimierte Bestellabwicklung**
- ✅ **Mindestbestellwert: 15,00 €** (konfigurierbar)
- ✅ **Liefergebühr: 3,00 €** (konfigurierbar)
- ✅ **Trinkgeld-Optionen:** 0%, 5%, 10%, 15% oder eigener Betrag
- ✅ **Lieferzeit-Auswahl:** ASAP oder Wunschzeit
- ✅ **Anmerkungen** (z.B. "Klingel defekt")

### 👤 **Kundenbindung & Komfort**
- ✅ **"Erneut bestellen"** Button (1-Klick Wiederholen)
- ✅ **Gespeicherte Adressen** (Zuhause, Arbeit, etc.)
- ✅ **Favoriten-System** (coming soon)
- ✅ **Bestellhistorie** mit allen Details
- ✅ **Gast-Checkout** weiterhin möglich

### 🔐 **Sicherheit & Performance**
- ✅ Row Level Security (RLS)
- ✅ Server-side Validierung
- ✅ HTTPS über Vercel
- ✅ PCI-DSS compliant (Stripe)

---

## 📊 Gebühren-Übersicht

Bei **25€ Bestellwert** zahlst du:

| Zahlungsmethode | Gebühr | Du bekommst |
|-----------------|--------|-------------|
| **SEPA** | 0,50€ | 24,50€ ⭐ |
| **Kreditkarte** | 0,61€ | 24,39€ |
| **Sofort/Klarna** | 0,60€ | 24,40€ |
| **giropay** | 0,60€ | 24,40€ |
| **Apple/Google Pay** | 0,60€ | 24,40€ |

💡 **Tipp:** SEPA ist am günstigsten für Stammkunden!

---

## 🚀 Quick Start (30 Min)

### 1. Supabase Setup (7 Min)

```bash
# 1. Erstelle Supabase-Projekt auf supabase.com
# 2. SQL Editor öffnen
# 3. Führe beide SQL-Dateien aus:

# Erst die Basis:
supabase-schema.sql

# Dann die Erweiterungen:
supabase-schema-extended.sql

# 4. Hole deine Keys aus Settings > API
```

### 2. Stripe Setup (5 Min)

```bash
# 1. Gehe zu stripe.com/dashboard
# 2. Test Mode aktivieren
# 3. Gehe zu Settings > Payment methods
# 4. Aktiviere:
   ✅ Cards
   ✅ SEPA Direct Debit
   ✅ giropay  
   ✅ Sofort
   
# 5. Developers > API keys holen
```

### 3. Lokale Installation (5 Min)

```bash
cd foodexpress-platform
npm install
cp .env.example .env.local

# Trage deine Keys ein in .env.local
```

### 4. Starten (1 Min)

```bash
npm run dev
# Öffne http://localhost:3000
```

### 5. Admin-Account (2 Min)

```bash
# 1. Gehe zu /auth/register
# 2. Registriere mit deiner ADMIN_EMAIL aus .env.local
# 3. Du bist jetzt Admin!
```

### 6. Vercel Deploy (10 Min)

```bash
npm install -g vercel
vercel login
vercel

# Füge Environment Variables in Vercel Dashboard hinzu
# Fertig! 🎉
```

---

## 📁 Neue Dateien & Strukturen

```
foodexpress-platform/
├── lib/
│   ├── langenfeld-streets.ts    ← Straßen-Datenbank
│   └── ...
├── pages/
│   ├── checkout.tsx             ← NEUE erweiterte Version
│   ├── account.tsx              ← Mit "Erneut bestellen"
│   └── api/
│       ├── favorites.ts         ← Favoriten API
│       ├── addresses.ts         ← Gespeicherte Adressen
│       └── stripe/
│           └── create-payment-intent.ts  ← Mehrere Methoden
├── components/
│   └── Cart.tsx                 ← Trinkgeld & Mindestbestellwert
├── supabase-schema.sql          ← Basis-Schema
└── supabase-schema-extended.sql ← Neue Tabellen
```

---

## 🎯 Verwendung

### Kunde:
1. Produkte durchsuchen
2. In Warenkorb (Mindestbestellwert beachten)
3. Trinkgeld wählen (optional)
4. Lieferadresse eingeben (nur Langenfeld!)
5. Lieferzeit wählen
6. Zahlungsmethode wählen
7. Bezahlen → Fertig!

### Admin:
1. Login mit Admin-Email
2. Produkte verwalten
3. Bestellungen einsehen
4. Status aktualisieren

---

## ⚙️ Konfiguration

### Mindestbestellwert ändern

In `components/Cart.tsx` und `pages/checkout.tsx`:
```typescript
const MINIMUM_ORDER = 15.00  // ← Hier ändern
```

### Liefergebühr ändern

```typescript
const DELIVERY_FEE = 3.00  // ← Hier ändern
```

### Liefergebiet erweitern

In `lib/langenfeld-streets.ts`:
```typescript
export const VALID_ZIPCODES = ["40764", "40721", ...]  // Weitere PLZ
export const LANGENFELD_STREETS: Street[] = [
  // Weitere Straßen hinzufügen
]
```

### Weitere Zahlungsmethoden aktivieren

Stripe Dashboard → Settings → Payment methods → Aktiviere:
- ✅ iDEAL (Niederlande)
- ✅ Bancontact (Belgien)
- ✅ EPS (Österreich)
- etc.

Code passt sich automatisch an!

---

## 💳 PayPal Integration (Optional)

PayPal ist **vorbereitet** aber noch nicht vollständig integriert.

### Um PayPal zu aktivieren:

1. **PayPal Business Account** erstellen
2. Developer Dashboard → Apps → App erstellen
3. **Client ID** kopieren
4. In `.env.local` eintragen:
```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=deine-client-id
```

5. PayPal SDK ist bereits installiert!
6. Code in `checkout.tsx` ist vorbereitet

**Hinweis:** PayPal-Gebühren sind höher (2,49% + 0,35€)

---

## 📊 Datenbank-Schema

### Neue Tabellen:

**saved_addresses**
```sql
- id (UUID)
- user_id (FK)
- label (Text: "Zuhause", "Arbeit")
- name, street, zip, city
- is_default (Boolean)
```

**favorites**
```sql
- id (UUID)
- user_id (FK)
- product_id (FK)
```

**orders** (erweitert)
```sql
+ tip (Decimal)
+ delivery_time (Text)
+ notes (Text)
```

---

## 🧪 Testen

### Stripe Test-Karten:

**Erfolg:**
- Karte: `4242 4242 4242 4242`
- Datum: Beliebig (Zukunft)
- CVV: Beliebig

**SEPA:**
- IBAN: `DE89370400440532013000`

**giropay:**
- Nutze Test-Modus in Stripe

**Fehlschlag:**
- Karte: `4000 0000 0000 0002`

Mehr: https://stripe.com/docs/testing

---

## 🚨 Wichtige Hinweise

### Langenfeld-Straßen aktualisieren

Die Liste in `lib/langenfeld-streets.ts` enthält ~100 Hauptstraßen.

**Für vollständige Liste:**
1. Gehe zu OpenStreetMap
2. Exportiere Langenfeld-Straßen
3. Oder nutze Google Places API (kostenpflichtig aber genauer)

### Google Places API (Optional)

Für **perfekte** Adress-Validierung:

```bash
# 1. Google Cloud Console
# 2. Places API aktivieren
# 3. API Key erstellen
# 4. In Code einbauen (siehe Kommentare in checkout.tsx)
```

**Kosten:** ~0,017€ pro Autocomplete (sehr günstig!)

---

## 📈 Nächste Schritte

### Nach dem Launch:

**Phase 1: Live-Modus**
- Stripe Live-Keys aktivieren
- PayPal Live-Keys (falls gewünscht)
- Domain auf HTTPS prüfen

**Phase 2: Marketing**
- Google My Business
- Social Media Integration
- Email-Marketing (Newsletter)

**Phase 3: Erweiterte Features**
- SMS-Benachrichtigungen
- Echtzeit-Tracking
- Rabatt-Codes
- Treueprogramm
- Push-Benachrichtigungen

**Phase 4: Analytics**
- Google Analytics
- Conversion-Tracking
- A/B Testing
- Heatmaps

---

## 🎁 Bonus-Features (bereits drin!)

✅ **Responsive Design** - Perfekt auf Handy, Tablet, Desktop
✅ **Dark Mode** Compatible  
✅ **Accessibility** - Screen Reader friendly
✅ **SEO-Optimiert** - Next.js SSR
✅ **Fast Loading** - Optimized Images & Code
✅ **Error Handling** - Benutzerfreundliche Fehler
✅ **Loading States** - Keine leeren Screens
✅ **Animations** - Smooth & Professional

---

## 💡 Pro-Tipps

### Performance:
```bash
# Build optimization
npm run build
npm run start

# Lighthouse Score anstreben: 90+
```

### Sicherheit:
- Niemals API-Keys committen
- Regelmäßig Dependencies updaten
- HTTPS erzwingen
- CORS richtig konfigurieren

### Conversion-Optimierung:
- Mindestbestellwert niedrig halten (15€ ist gut)
- Liefergebühr transparent zeigen
- Trinkgeld als Option, nicht Pflicht
- Gast-Checkout immer anbieten
- Mobile First!

---

## 🆘 Troubleshooting

### "PLZ wird nicht akzeptiert"
→ Prüfe `VALID_ZIPCODES` in `langenfeld-streets.ts`

### "Straße nicht gefunden"
→ Füge Straße in `LANGENFELD_STREETS` Array hinzu

### "Payment failed"
→ Prüfe Stripe Test-Mode
→ Verwende Test-Karten
→ Check Stripe Dashboard Logs

### "Mindestbestellwert-Fehler"
→ Prüfe `MINIMUM_ORDER` Konstante
→ Clear LocalStorage & neu laden

---

## 📞 Support & Dokumentation

- **Stripe Docs:** https://stripe.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs

---

## 🎉 Fertig!

Du hast jetzt eine **komplette Restaurant-Bestellplattform** mit:

✅ Allen wichtigen Zahlungsmethoden
✅ Intelligenter Liefergebiet-Validierung
✅ Trinkgeld & Mindestbestellwert
✅ Kundenbindungs-Features
✅ Production-Ready Code
✅ Skalierbare Architektur

**Geschätzte Zeit bis Live:** 30-45 Minuten!

---

## 📝 Changelog

**v2.0 - Erweiterte Version**
- ✅ Mehrere Zahlungsmethoden (SEPA, giropay, Sofort)
- ✅ Langenfeld Liefergebiet-Validierung
- ✅ Straßen-Autocomplete
- ✅ Trinkgeld-System
- ✅ Lieferzeit-Auswahl
- ✅ "Erneut bestellen" Funktion
- ✅ Gespeicherte Adressen
- ✅ Mindestbestellwert 15€
- ✅ Liefergebühr 3€
- ✅ PayPal vorbereitet

**v1.0 - Basis-Version**
- ✅ Grundlegende Shop-Funktionen
- ✅ Stripe Kreditkarten-Zahlung
- ✅ Admin-Panel
- ✅ User Accounts

---

**Made with ❤️ for FoodExpress Langenfeld**

Viel Erfolg mit deinem Restaurant! 🚀🍕
