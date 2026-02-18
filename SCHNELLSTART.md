# ⚡ SCHNELLSTART - In 30 Minuten Online!

## 🎯 Was du bekommst:

✅ **Alle Zahlungsmethoden:** Kreditkarte, SEPA, Sofort, giropay, Apple/Google Pay, (PayPal vorbereitet)
✅ **Liefergebiet Langenfeld:** Automatische Validierung & Straßen-Autocomplete
✅ **Mindestbestellwert:** 15€ (konfigurierbar)
✅ **Liefergebühr:** 3€ (konfigurierbar)
✅ **Trinkgeld:** 0%, 5%, 10%, 15% oder eigener Betrag
✅ **Lieferzeit-Auswahl:** ASAP oder Wunschzeit
✅ **Wiederholungsbestellungen:** "Erneut bestellen" Button
✅ **Kundenbindung:** Gespeicherte Adressen, Favoriten, Bestellhistorie

---

## 📋 CHECKLISTE

### ☐ **Schritt 1: Supabase (7 Min)**

1. Gehe zu https://supabase.com
2. Erstelle neues Projekt: "foodexpress"
3. Warte bis Datenbank bereit
4. SQL Editor öffnen
5. Kopiere `supabase-schema.sql` → Run
6. Kopiere `supabase-schema-extended.sql` → Run
7. Settings → API → Kopiere:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key

### ☐ **Schritt 2: Stripe (5 Min)**

1. Gehe zu https://stripe.com/dashboard
2. **Test Mode** aktivieren (Schalter oben rechts)
3. Settings → Payment methods → Aktiviere:
   - ✅ Cards
   - ✅ SEPA Direct Debit
   - ✅ giropay
   - ✅ Sofort
4. Developers → API keys → Kopiere:
   - `Publishable key` (pk_test_...)
   - `Secret key` (sk_test_...)

### ☐ **Schritt 3: Lokale Installation (5 Min)**

```bash
cd foodexpress-platform
npm install
cp .env.example .env.local
```

Bearbeite `.env.local`:
```env
# Supabase (aus Schritt 1)
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe (aus Schritt 2)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Admin
ADMIN_EMAIL=deine@email.de

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ☐ **Schritt 4: Starten (1 Min)**

```bash
npm run dev
```

Öffne: http://localhost:3000

### ☐ **Schritt 5: Admin-Account (2 Min)**

1. Gehe zu http://localhost:3000/auth/register
2. Registriere mit der Email aus `.env.local` (ADMIN_EMAIL)
3. Du bist jetzt Admin!
4. Klicke "Admin" → Füge erste Produkte hinzu

### ☐ **Schritt 6: Vercel Deploy (10 Min)**

```bash
npm install -g vercel
vercel login
vercel
```

**Bei Vercel-Fragen:**
- Framework: Next.js ✅
- Root Directory: ./ ✅
- Build Command: npm run build ✅

**Environment Variables in Vercel:**
Gehe zu Dashboard → Settings → Environment Variables
Füge ALLE Variablen aus `.env.local` hinzu!

### ☐ **Schritt 7: Domain (Optional, 5 Min)**

**Vercel Domain (automatisch):**
- Du bekommst: `dein-projekt.vercel.app`

**Eigene Hetzner Domain:**
1. Vercel Dashboard → Settings → Domains
2. Füge deine Domain hinzu: `meinrestaurant.de`
3. Kopiere DNS-Einstellungen
4. Hetzner DNS-Panel → Füge A-Record hinzu
5. Warte 5-30 Min

---

## ✅ FERTIG! Was jetzt?

### Testen:
1. Bestellung aufgeben (als Gast)
2. Verschiedene Zahlungsmethoden testen
3. Admin-Panel: Bestellungen ansehen
4. "Erneut bestellen" testen

### Stripe Test-Karten:
- **Erfolg:** `4242 4242 4242 4242`
- **SEPA:** `DE89370400440532013000`
- Datum: Beliebig (Zukunft)
- CVV: Beliebig

### Live-Modus aktivieren:
1. Stripe: Live-Keys holen
2. Vercel: Environment Variables aktualisieren
3. Fertig!

---

## 🎁 BONUS: Anpassungen

### Mindestbestellwert ändern:
`components/Cart.tsx` & `pages/checkout.tsx`:
```typescript
const MINIMUM_ORDER = 20.00  // Vorher: 15.00
```

### Liefergebühr ändern:
```typescript
const DELIVERY_FEE = 2.50  // Vorher: 3.00
```

### Neue Straße hinzufügen:
`lib/langenfeld-streets.ts`:
```typescript
{ name: "Neue Straße", zip: "40764" },
```

### Weitere PLZ erlauben:
```typescript
export const VALID_ZIPCODES = ["40764", "40721"]
```

---

## 🚨 Häufige Probleme

❌ **"Cannot find module"**
```bash
npm install
```

❌ **"Zahlung fehlgeschlagen"**
- Stripe Test-Mode aktiv?
- Test-Karten verwenden?
- Stripe Dashboard → Logs prüfen

❌ **"PLZ nicht erlaubt"**
- Ist 40764 eingegeben?
- `VALID_ZIPCODES` prüfen

❌ **"Admin-Panel nicht zugänglich"**
- Mit ADMIN_EMAIL registriert?
- Logout + Login erneut

---

## 📚 Mehr Details:

Lies `README-COMPLETE.md` für:
- Vollständige Feature-Liste
- PayPal Integration
- Performance-Tipps
- Erweiterte Konfiguration
- Troubleshooting

---

## 🎉 GLÜCKWUNSCH!

Du hast jetzt eine **komplett funktionsfähige Restaurant-Plattform**!

**Zeit investiert:** ~30-45 Min
**Was du hast:** Production-Ready E-Commerce System
**Nächster Schritt:** Erste Produkte hinzufügen & testen!

Viel Erfolg! 🚀🍕
