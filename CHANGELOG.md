# Changelog — Eiscafé Simonetti Webshop

## 2026-06-07 — Deploy 2: Lazy PaymentIntent

**Commits:** `c9c6fcf` (merge `f909265`)  
**Branch:** `deploy-2-lazy-pi` → `main`  
**Status:** Live verifiziert (Production + Webhook Round-Trip)

### Problem
583 „incomplete" PaymentIntents pro Monat in Stripe, weil der PI bei jedem
Seitenaufruf und bei jeder Warenkorb-/Voucher-/Tip-Änderung neu erstellt wurde.
Der Webhook konnte die zugehörige Bestellung nicht finden, weil `order_id`
nie in den PI-Metadaten stand (Race Condition: Bestellung existiert beim
PI-Erstellen noch nicht).

### Änderungen

#### `pages/checkout.tsx`
- `createPaymentIntent()` und alle 6 Aufrufstellen entfernt (page load,
  orderType-Wechsel, updateCart, handleVoucherApply, handleTipChange, loyalty)
- `clientSecret`-State entfernt
- `amountCents`-Wert ergänzt (`Math.round(grandTotal * 100)`)
- `<Elements>` auf `mode: 'payment'` umgestellt — kein `clientSecret` beim
  Mount nötig, PaymentElement sofort sichtbar (kein Spinner mehr)
- `StripeForm.handleSubmit` neu: Reihenfolge ist jetzt atomar:
  1. Bestellung `AUSSTEHEND` anlegen → `order_id` bekannt
  2. PI mit `order_id` in Metadata erstellen → `clientSecret` bekannt
  3. `stripe.confirmPayment({ elements, clientSecret })` aufrufen
  4. Bei Fehler: Bestellung auf `STORNIERT` setzen
- `amountCents`-Prop für `elements.update()` bei Betragsänderungen

#### `pages/api/stripe/payment-intent-metadata.ts` — gelöscht
Obsoleter Post-hoc-Patch-Endpunkt, der `order_id` nachträglich in den PI
schreiben sollte. War fehleranfällig und nicht atomar.

### Ergebnis
- 0 PI-Erstellungen bei page load (vorher: 1 pro Seitenaufruf + jede Änderung)
- `order_id` ist ab PI-Erstellung in Metadata → Webhook findet Bestellung immer
- `payment_status` wird korrekt auf `paid` gesetzt sobald Zahlung bestätigt

---

## 2026-06-07 — Hotfix: payment_status in Orders-API-Route

**Commit:** `0156791`  
**Status:** Live

### Problem
Deploy 1 reparierte `saveOrder()` in `checkout.tsx`, aber die API-Route
`pages/api/orders/index.ts` hat `payment_status` nie aus dem Request-Body
gelesen und nicht an Supabase weitergegeben — DB-Default `'pending'` griff
immer. Entdeckt bei Prüfung der heutigen PayPal-Bestellungen:
2 Bestellungen (40,70 € + 29,40 €) standen trotz erfolgter Zahlung auf `pending`.
Beide Captures via PayPal Live-API als `COMPLETED` verifiziert.

### Änderungen

#### `pages/api/orders/index.ts`
- `payment_status` in Destructuring ergänzt
- `payment_status: payment_status || 'pending'` im Supabase-Insert ergänzt

#### Daten-Korrektur
2 betroffene PayPal-Bestellungen vom 2026-06-07 manuell auf `payment_status='paid'`
gesetzt (`cf8de6db` 40,70 €, `b96c6887` 29,40 €).

---

## 2026-06-07 — Deploy 1: payment_status-Logik + Cash-Trigger

**Commits:** `41d1031`, `824825e`, `b1785a8`  
**Branch:** `deploy-1-payment-status` → `main`  
**Status:** Live, manuell verifiziert (Trigger in Supabase bestätigt)

### Problem
Alle 446 Bestellungen in der DB hatten `payment_status = 'pending'`, egal ob
tatsächlich bezahlt oder nicht. `saveOrder()` setzte das Feld nie.
37 abgeschlossene Cash- und PayPal-Bestellungen (1.115,00 €) standen fälschlich
auf `pending`.

### Änderungen

#### `pages/checkout.tsx` — `saveOrder()`
```ts
payment_status: method === 'stripe' ? 'pending'
               : method === 'paypal' ? 'paid'
               : 'pending'
```
PayPal-Bestellungen werden sofort als `paid` gespeichert (Capture passiert vor
`saveOrder()`). Cash bleibt `pending` bis Lieferung.

#### `migrations/2026-06-07-cash-paid-trigger.sql` — neu (manuell in Supabase deployed)
DB-Trigger `trg_set_cash_paid_on_delivery`: setzt `payment_status = 'paid'`
automatisch wenn eine Cash-Bestellung auf Status `GELIEFERT` gesetzt wird.

#### Daten-Korrektur
37 historische Bestellungen (Cash + PayPal, tatsächlich bezahlt) auf
`payment_status = 'paid'` gesetzt. Backup unter
`/home/mahmut/backups/orders_pre_fix_20260607_0917.sql`.

### Rollback
`/home/mahmut/backups/rollback_deploy_1.sh` (3 Schritte: git revert, SQL UPDATE, Trigger DROP)
