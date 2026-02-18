-- ============================================================
-- SIMONETTI MIGRATION SCRIPT
-- Sicher: Löscht NICHTS, ergänzt nur neue Tabellen & Spalten!
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SCHRITT 1: Orders erweitern (alte Daten bleiben!)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 3.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- SCHRITT 2: Settings erweitern
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(10, 2) DEFAULT 15.00;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 3.00;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS allowed_zipcodes TEXT[] DEFAULT ARRAY['40764'];

UPDATE "Settings" SET 
  min_order_value = 15.00,
  delivery_fee = 3.00,
  "deliveryTime" = '30-45 Min.'
WHERE id = '1';

-- SCHRITT 3: Neue Tabelle - Produkte
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'Eis',
  icon TEXT NOT NULL DEFAULT '🍦',
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCHRITT 4: Neue Tabelle - Feature Toggles (PayPal-Steuerung!)
CREATE TABLE IF NOT EXISTS feature_toggles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCHRITT 5: Neue Tabelle - Gespeicherte Adressen
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Zuhause',
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  zip TEXT NOT NULL,
  city TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCHRITT 6: Neue Tabelle - Favoriten
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- SCHRITT 7: Feature-Toggles einfügen
INSERT INTO feature_toggles (id, name, description, enabled) VALUES
  ('paypal',              'PayPal',               'PayPal Zahlungen (Code ready, jetzt deaktiviert)', false),
  ('sepa',                'SEPA Lastschrift',      'SEPA Lastschrift über Stripe',                    true),
  ('giropay',             'giropay',               'giropay Direktüberweisung',                        true),
  ('sofort',              'Sofort/Klarna',          'Sofort-Überweisung via Stripe',                   true),
  ('apple_pay',           'Apple Pay',             'Automatisch auf iOS Safari',                       true),
  ('google_pay',          'Google Pay',            'Automatisch auf Android Chrome',                   true),
  ('tip_option',          'Trinkgeld',             'Trinkgeld-Option beim Checkout',                   true),
  ('guest_checkout',      'Gast-Checkout',         'Bestellen ohne Konto möglich',                     true),
  ('favorites',           'Favoriten',             'Lieblingsprodukte speichern',                      true),
  ('email_notifications', 'Email-Benachrichtigung','Automatische Bestellbestätigungen',               true)
ON CONFLICT (id) DO NOTHING;

-- SCHRITT 8: Eissorten einfügen
INSERT INTO products (name, description, price, category, icon, available, featured) VALUES
  ('Vanille Klassik',  'Cremiges Vanilleeis aus echter Bourbon-Vanille',       1.80, 'Eis',    '🍦', true, true),
  ('Schokolade',       'Intensives Schokoeis mit belgischer Schokolade',        1.80, 'Eis',    '🍫', true, true),
  ('Erdbeere',         'Fruchtiges Erdbeereis aus frischen Früchten',           1.80, 'Eis',    '🍓', true, true),
  ('Stracciatella',    'Vanilleeis mit feinen Schokoladensplittern',            1.80, 'Eis',    '🍦', true, false),
  ('Pistazie',         'Echtes italienisches Pistazieneis',                     2.20, 'Eis',    '🥜', true, true),
  ('Haselnuss',        'Cremiges Haselnusseis nach Nonna-Rezept',               1.80, 'Eis',    '🌰', true, false),
  ('Amarena',          'Vanilleeis mit sizilianischen Amarenakirschen',         2.20, 'Eis',    '🍒', true, false),
  ('Cookies & Cream',  'Vanilleeis mit knusprigen Keksstücken',                 2.20, 'Eis',    '🍪', true, false),
  ('Salted Caramel',   'Karamelleis mit einem Hauch Meersalz',                  2.20, 'Eis',    '🍮', true, false),
  ('Espresso',         'Intensives Kaffeeeis für Liebhaber',                    1.80, 'Eis',    '☕', true, false),
  ('Zitrone',          'Erfrischendes Zitronensorbet aus Sizilien',             1.80, 'Sorbet', '🍋', true, false),
  ('Mango',            'Exotisches Mangosorbet aus reifen Früchten',            1.80, 'Sorbet', '🥭', true, false)
ON CONFLICT DO NOTHING;

-- SCHRITT 9: Indizes
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
CREATE INDEX IF NOT EXISTS idx_products_featured  ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);

-- SCHRITT 10: RLS aktivieren
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites       ENABLE ROW LEVEL SECURITY;

-- Products: öffentlich lesbar
DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_auth_write" ON products;
CREATE POLICY "products_auth_write" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Feature Toggles: öffentlich lesbar
DROP POLICY IF EXISTS "features_public_read" ON feature_toggles;
CREATE POLICY "features_public_read" ON feature_toggles FOR SELECT USING (true);

DROP POLICY IF EXISTS "features_auth_write" ON feature_toggles;
CREATE POLICY "features_auth_write" ON feature_toggles FOR ALL USING (auth.role() = 'authenticated');

-- Saved Addresses: nur eigene
DROP POLICY IF EXISTS "addresses_own" ON saved_addresses;
CREATE POLICY "addresses_own" ON saved_addresses FOR ALL USING (auth.uid()::text = user_id::text);

-- Favorites: nur eigene
DROP POLICY IF EXISTS "favorites_own" ON favorites;
CREATE POLICY "favorites_own" ON favorites FOR ALL USING (auth.uid()::text = user_id::text);

-- FERTIG! ✅
