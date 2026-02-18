-- Simonetti Hybrid - Supabase Database Schema
-- KOMPLETT mit Feature-Toggles für PayPal & mehr

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 3.00,
  tip DECIMAL(10, 2) DEFAULT 0,
  delivery_address JSONB NOT NULL,
  delivery_time TEXT,
  notes TEXT,
  payment_method TEXT NOT NULL,
  payment_intent_id TEXT,
  paypal_order_id TEXT,
  status TEXT DEFAULT 'OFFEN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Feature Toggles Table (NEU!)
CREATE TABLE IF NOT EXISTS feature_toggles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  config JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Shop Settings Table (erweitert)
CREATE TABLE IF NOT EXISTS shop_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  shop_name TEXT DEFAULT 'Simonetti Gelateria',
  delivery_time TEXT DEFAULT '30-45 Min.',
  min_order_value DECIMAL(10, 2) DEFAULT 15.00,
  delivery_fee DECIMAL(10, 2) DEFAULT 3.00,
  is_open BOOLEAN DEFAULT true,
  opening_hours JSONB,
  delivery_radius INTEGER DEFAULT 5,
  allowed_zipcodes TEXT[] DEFAULT ARRAY['40764'],
  contact_email TEXT,
  contact_phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Saved Addresses Table
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  zip TEXT NOT NULL,
  city TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Insert default shop settings
INSERT INTO shop_settings (id, shop_name, delivery_time, min_order_value, delivery_fee, is_open, allowed_zipcodes)
VALUES ('main', 'Simonetti Gelateria', '30-45 Min.', 15.00, 3.00, true, ARRAY['40764'])
ON CONFLICT (id) DO NOTHING;

-- Insert default feature toggles
INSERT INTO feature_toggles (id, name, description, enabled, config) VALUES
  ('paypal', 'PayPal Zahlungen', 'PayPal als Zahlungsmethode aktivieren', false, '{"client_id": "", "mode": "sandbox"}'),
  ('sepa', 'SEPA Lastschrift', 'SEPA Lastschrift über Stripe', true, '{}'),
  ('giropay', 'giropay', 'giropay Zahlungen', true, '{}'),
  ('sofort', 'Sofort/Klarna', 'Sofort-Überweisung', true, '{}'),
  ('apple_pay', 'Apple Pay', 'Apple Pay aktivieren', true, '{}'),
  ('google_pay', 'Google Pay', 'Google Pay aktivieren', true, '{}'),
  ('favorites', 'Favoriten', 'Kunden können Favoriten speichern', true, '{}'),
  ('guest_checkout', 'Gast-Checkout', 'Bestellung ohne Konto', true, '{}'),
  ('tip_option', 'Trinkgeld', 'Trinkgeld-Option beim Checkout', true, '{}'),
  ('email_notifications', 'Email-Benachrichtigungen', 'Automatische Bestellbestätigungen', true, '{"provider": "resend"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample Simonetti ice cream products
INSERT INTO products (name, description, price, category, icon, available, featured) VALUES
  ('Vanille Klassik', 'Cremiges Vanilleeis aus echter Bourbon-Vanille', 1.80, 'Eis', '🍦', true, true),
  ('Schokolade', 'Intensives Schokoladeneis mit belgischer Schokolade', 1.80, 'Eis', '🍫', true, true),
  ('Erdbeere', 'Fruchtiges Erdbeereis aus frischen Früchten', 1.80, 'Eis', '🍓', true, true),
  ('Stracciatella', 'Vanilleeis mit feinen Schokoladensplittern', 1.80, 'Eis', '🍦', true, false),
  ('Pistazie', 'Italienisches Pistazieneis', 2.20, 'Eis', '🥜', true, true),
  ('Haselnuss', 'Cremiges Haselnusseis', 1.80, 'Eis', '🌰', true, false),
  ('Zitrone', 'Erfrischendes Zitronensorbet', 1.80, 'Sorbet', '🍋', true, false),
  ('Mango', 'Exotisches Mangosorbet', 1.80, 'Sorbet', '🥭', true, false),
  ('Amarena', 'Vanilleeis mit Amarenakirschen', 2.20, 'Eis', '🍒', true, false),
  ('Cookies & Cream', 'Vanilleeis mit Keksstücken', 2.20, 'Eis', '🍪', true, false),
  ('Salted Caramel', 'Karamelleis mit Meersalz', 2.20, 'Eis', '🍮', true, false),
  ('Espresso', 'Intensives Kaffeeeis', 1.80, 'Eis', '☕', true, false)
ON CONFLICT DO NOTHING;

-- RLS Policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (available = true OR auth.jwt() ->> 'email' = 'admin@simonetti.de');

CREATE POLICY "Products are insertable by admins only"
  ON products FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@simonetti.de');

CREATE POLICY "Products are updatable by admins only"
  ON products FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@simonetti.de');

CREATE POLICY "Products are deletable by admins only"
  ON products FOR DELETE
  USING (auth.jwt() ->> 'email' = 'admin@simonetti.de');

-- RLS Policies for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'email' = 'admin@simonetti.de'
  );

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@simonetti.de');

-- RLS Policies for feature toggles
ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view feature toggles"
  ON feature_toggles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage feature toggles"
  ON feature_toggles FOR ALL
  USING (auth.jwt() ->> 'email' = 'admin@simonetti.de');

-- RLS Policies for shop settings
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view shop settings"
  ON shop_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update shop settings"
  ON shop_settings FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@simonetti.de');

-- RLS Policies for saved addresses
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses"
  ON saved_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON saved_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON saved_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON saved_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_feature_toggles_updated_at
  BEFORE UPDATE ON feature_toggles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE saved_addresses 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_default_address
  BEFORE INSERT OR UPDATE ON saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Format: SIM-YYYYMMDD-XXXX
  SELECT COUNT(*) + 1 INTO counter
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_number := 'SIM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();
