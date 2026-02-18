-- Supabase Database Schema Setup
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Orders Table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  delivery_address JSONB NOT NULL,
  payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_available ON products(available);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Insert sample products
INSERT INTO products (name, description, price, category, icon) VALUES
  ('Margherita Pizza', 'Klassisch mit Tomaten und Mozzarella', 8.99, 'Pizza', '🍕'),
  ('Pepperoni Pizza', 'Mit pikanter Salami', 10.99, 'Pizza', '🍕'),
  ('Hawaii Pizza', 'Mit Schinken und Ananas', 9.99, 'Pizza', '🍕'),
  ('Cheeseburger', 'Saftiges Rindfleisch mit Cheddar', 9.99, 'Burger', '🍔'),
  ('Bacon Burger', 'Mit knusprigem Bacon', 11.99, 'Burger', '🍔'),
  ('Veggie Burger', 'Vegetarisch mit Gemüse-Patty', 10.99, 'Burger', '🍔'),
  ('Spaghetti Carbonara', 'Cremig mit Speck und Ei', 12.99, 'Pasta', '🍝'),
  ('Penne Arrabiata', 'Scharf mit Knoblauch', 10.99, 'Pasta', '🍝'),
  ('Lasagne', 'Hausgemacht mit Bolognese', 13.99, 'Pasta', '🍝'),
  ('California Roll', '8 Stück mit Surimi', 7.99, 'Sushi', '🍣'),
  ('Salmon Nigiri', '6 Stück mit frischem Lachs', 9.99, 'Sushi', '🍣'),
  ('Caesar Salad', 'Mit Hähnchen und Parmesan', 8.99, 'Salat', '🥗'),
  ('Greek Salad', 'Mit Feta und Oliven', 7.99, 'Salat', '🥗'),
  ('Tiramisu', 'Italienischer Klassiker', 5.99, 'Dessert', '🍰'),
  ('Chocolate Cake', 'Saftiger Schokoladenkuchen', 6.99, 'Dessert', '🍰'),
  ('Cola', '0.33l', 2.99, 'Getränke', '🥤'),
  ('Wasser', '0.5l', 1.99, 'Getränke', '🥤');

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies for products (public read, admin write)
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Products are insertable by admins only"
  ON products FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@foodexpress.com');

CREATE POLICY "Products are updatable by admins only"
  ON products FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@foodexpress.com');

CREATE POLICY "Products are deletable by admins only"
  ON products FOR DELETE
  USING (auth.jwt() ->> 'email' = 'admin@foodexpress.com');

-- Policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'email' = 'admin@foodexpress.com'
  );

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@foodexpress.com');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
