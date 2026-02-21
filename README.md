# Eiscafe Simonetti - Restaurant Online-Bestellplattform

Vollständige E-Commerce-Plattform für Restaurants wie Lieferando - bereit für Vercel, Supabase & Stripe!

## ✨ Features

### Kunden-Features
- 🛒 **Shopping Cart** mit Live-Updates
- 💳 **Stripe Integration** für sichere Zahlungen
- 👤 **Kunden-Accounts** + Gast-Checkout
- 📦 **Bestellhistorie** für registrierte Nutzer
- 📱 **Responsive Design** für alle Geräte
- ⚡ **Express-Lieferung** Tracking

### Admin-Features
- ➕ **Produktverwaltung** (Hinzufügen, Bearbeiten, Löschen)
- 📊 **Bestellübersicht** mit Status
- 🗂️ **Kategorieverwaltung** (Pizza, Burger, Pasta, etc.)
- 🔐 **Admin-Dashboard** mit Authentifizierung

### Technische Features
- 🗄️ **Supabase PostgreSQL** Datenbank
- 🔒 **Row Level Security** (RLS)
- 🚀 **Serverless API** mit Next.js
- 💰 **Stripe Payment Intents**
- 🎨 **Tailwind CSS** für Styling
- 📦 **TypeScript** für Type Safety

---

## 🚀 Setup-Anleitung (30 Min)

### 1️⃣ Supabase Setup (5 Min)

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Warte bis die Datenbank bereit ist
4. Gehe zu **SQL Editor**
5. Kopiere den Inhalt von `supabase-schema.sql`
6. Füge ihn ein und klicke "Run"
7. Hole deine API-Keys:
   - Gehe zu **Settings** → **API**
   - Kopiere `Project URL`
   - Kopiere `anon` public key
   - Kopiere `service_role` secret key

### 2️⃣ Stripe Setup (3 Min)

1. Gehe zu [stripe.com](https://stripe.com)
2. Erstelle ein Konto (oder logge dich ein)
3. Aktiviere **Test Mode** (Schalter oben rechts)
4. Gehe zu **Developers** → **API keys**
5. Kopiere:
   - `Publishable key` (pk_test_...)
   - `Secret key` (sk_test_...)

### 3️⃣ Lokale Installation (5 Min)

```bash
# 1. In Projektordner wechseln
cd foodexpress-platform

# 2. Dependencies installieren
npm install

# 3. .env Datei erstellen
cp .env.example .env.local

# 4. .env.local bearbeiten und Keys eintragen:
# - Supabase Keys
# - Stripe Keys
# - Admin Email (z.B. admin@foodexpress.com)
```

**Deine `.env.local` sollte so aussehen:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

ADMIN_EMAIL=admin@foodexpress.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# 5. Development Server starten
npm run dev
```

Öffne: http://localhost:3000 🎉

### 4️⃣ Admin-Account erstellen (2 Min)

1. Gehe zu http://localhost:3000/auth/register
2. Registriere dich mit der Email die du in `.env.local` als `ADMIN_EMAIL` eingetragen hast
3. Du hast jetzt Admin-Rechte!
4. Klicke auf "Admin" in der Navigation

### 5️⃣ Vercel Deployment (10 Min)

```bash
# 1. Vercel CLI installieren (falls noch nicht vorhanden)
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel
```

**Bei der Vercel-Konfiguration:**
- Framework Preset: **Next.js**
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`

**Environment Variables hinzufügen:**

Gehe zu deinem Vercel Dashboard → Settings → Environment Variables

Füge alle Variablen aus `.env.local` hinzu!

### 6️⃣ Domain verbinden (5 Min)

**Option A: Vercel Domain**
- Vercel gibt dir automatisch eine Domain: `dein-projekt.vercel.app`

**Option B: Eigene Hetzner Domain**

1. Gehe zu Vercel Dashboard → Settings → Domains
2. Füge deine Domain hinzu (z.B. `meinrestaurant.de`)
3. Vercel zeigt dir DNS-Einstellungen
4. Gehe zu deinem Hetzner DNS-Panel
5. Füge die A-Records oder CNAME hinzu:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP - wird angezeigt)
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
6. Warte 5-30 Min für DNS-Propagierung

**WICHTIG:** Aktualisiere `NEXT_PUBLIC_APP_URL` in Vercel zu deiner echten Domain!

---

## 📁 Projektstruktur

```
foodexpress-platform/
├── pages/
│   ├── _app.tsx              # App Wrapper
│   ├── index.tsx             # Storefront (Hauptseite)
│   ├── admin.tsx             # Admin Dashboard
│   ├── checkout.tsx          # Checkout mit Stripe
│   ├── account.tsx           # Kunden-Account
│   ├── order-success.tsx     # Erfolgsseite
│   ├── auth/
│   │   ├── login.tsx         # Login
│   │   └── register.tsx      # Registrierung
│   └── api/
│       ├── products/         # Produkte API
│       ├── orders/           # Bestellungen API
│       ├── stripe/           # Stripe Payment API
│       └── admin/            # Admin API
├── components/
│   ├── Navbar.tsx            # Navigation
│   ├── Hero.tsx              # Hero Section
│   ├── ProductGrid.tsx       # Produkt-Raster
│   └── Cart.tsx              # Warenkorb
├── lib/
│   ├── supabase.ts           # Supabase Client
│   └── stripe.ts             # Stripe Client
├── styles/
│   └── globals.css           # Global Styles
├── supabase-schema.sql       # Datenbank Schema
├── .env.example              # Environment Template
└── package.json              # Dependencies
```

---

## 🎯 Verwendung

### Als Kunde:
1. Produkte durchsuchen
2. In den Warenkorb legen
3. Zur Kasse gehen
4. Als Gast oder mit Account bestellen
5. Mit Stripe bezahlen
6. Bestellbestätigung erhalten

### Als Admin:
1. Login mit Admin-Email
2. Klicke auf "Admin"
3. Produkte verwalten:
   - Neue Produkte hinzufügen
   - Bestehende bearbeiten
   - Produkte löschen
4. Bestellungen ansehen
5. Status aktualisieren

---

## 💡 Entwicklung

```bash
# Development Server
npm run dev

# Production Build
npm run build

# Production Server lokal testen
npm run start

# TypeScript Check
npm run lint
```

---

## 🔧 Anpassungen

### Liefergebühr ändern
`components/Cart.tsx` und `pages/checkout.tsx`:
```typescript
const DELIVERY_FEE = 2.99  // Hier ändern
```

### Neue Kategorie hinzufügen
1. In Admin-Panel: Neue Produkte mit neuer Kategorie erstellen
2. Optional: Icon in `pages/index.tsx` in `getCategoryIcon()` hinzufügen

### Farben anpassen
`tailwind.config.js`:
```javascript
colors: {
  primary: '#FF4C29',        // Hauptfarbe
  'primary-dark': '#E63E1E', // Dunklere Hauptfarbe
  secondary: '#FFB800',      // Akzentfarbe
  dark: '#1A1A1A',          // Dunkel
}
```

---

## 🔐 Sicherheit

- ✅ **Row Level Security** aktiviert
- ✅ **API-Key-Verschlüsselung**
- ✅ **Server-side Auth-Check**
- ✅ **HTTPS** über Vercel
- ✅ **Stripe PCI-Compliant**

### Admin-Zugriff absichern

Die Admin-Email wird in `.env` definiert. Nur User mit dieser Email haben Admin-Rechte.

Du kannst das erweitern in `lib/supabase.ts`:
```typescript
// Mehrere Admins:
const ADMIN_EMAILS = [
  'admin@foodexpress.com',
  'manager@foodexpress.com'
]
```

---

## 📊 Stripe Test-Karten

Im Test-Modus kannst du diese Karten verwenden:

- **Erfolgreiche Zahlung:**
  - Nummer: `4242 4242 4242 4242`
  - Datum: Beliebig in der Zukunft
  - CVV: Beliebig 3-stellig

- **Fehlgeschlagene Zahlung:**
  - Nummer: `4000 0000 0000 0002`

Mehr: https://stripe.com/docs/testing

---

## 🚨 Troubleshooting

### Problem: "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### Problem: Stripe Zahlung schlägt fehl
- Prüfe ob Test-Keys verwendet werden (pk_test, sk_test)
- Aktiviere "Test Mode" in Stripe Dashboard
- Verwende Test-Karten

### Problem: Admin-Panel nicht zugänglich
- Prüfe ob `ADMIN_EMAIL` in `.env.local` gesetzt ist
- Prüfe ob du mit dieser Email registriert bist
- Logout + Login erneut

### Problem: Build Fehler bei Vercel
- Stelle sicher alle Environment Variables sind gesetzt
- Prüfe TypeScript Errors: `npm run build` lokal
- Prüfe Node Version (sollte 18+ sein)

---

## 📝 Nächste Schritte

### Nach dem Launch:

1. **Stripe Live-Modus aktivieren:**
   - Hole Live-Keys von Stripe
   - Ersetze Test-Keys in Vercel Environment Variables
   - Verifiziere dein Business bei Stripe

2. **Email-Benachrichtigungen:**
   - Integriere Email-Service (z.B. SendGrid, Resend)
   - Sende Bestellbestätigungen
   - Benachrichtige Admins bei neuen Bestellungen

3. **Weitere Features:**
   - Echtzeit-Tracking der Lieferung
   - Push-Benachrichtigungen
   - Rabatt-Codes / Gutscheine
   - Favoriten / Wiederhol-Bestellungen
   - Bewertungssystem

4. **Performance-Optimierung:**
   - Bilder komprimieren
   - CDN für Assets nutzen
   - Caching implementieren

5. **Analytics:**
   - Google Analytics integrieren
   - Conversion-Tracking
   - A/B Testing

---

## 🆘 Support

Bei Fragen oder Problemen:

1. Prüfe die Console auf Fehler
2. Prüfe Supabase Logs (Dashboard → Logs)
3. Prüfe Vercel Logs (Dashboard → Deployments → Logs)
4. Prüfe Stripe Dashboard für Payment-Fehler

---

## 📄 Lizenz

Dieses Projekt wurde für dich erstellt und kann frei verwendet werden!

---

## 🎉 Viel Erfolg!

Deine Plattform ist jetzt bereit! Nach dem Setup kannst du:

✅ Sofort online gehen
✅ Produkte hinzufügen
✅ Bestellungen annehmen
✅ Geld verdienen

**Geschätzter Zeitaufwand:** 30-40 Minuten vom Code bis zum Live-Shop!
#   D e p l o y e d !  
 D e p l o y   n o w !  
 D e p l o y   n o w !  
 