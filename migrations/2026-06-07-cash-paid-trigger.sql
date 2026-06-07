-- Migration: Cash-Payment-Status-Trigger
-- Datum: 2026-06-07
-- Manuell im Supabase SQL Editor ausführen.
-- Zweck: Setzt payment_status='paid' automatisch wenn eine Cash-Order auf
--        status='GELIEFERT' gesetzt wird (verhindert manuelle DB-Updates).

-- Funktion
CREATE OR REPLACE FUNCTION set_cash_paid_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'GELIEFERT'
     AND OLD.status IS DISTINCT FROM 'GELIEFERT'
     AND NEW.payment_method = 'cash'
     AND NEW.payment_status != 'paid' THEN
    NEW.payment_status := 'paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (idempotent)
DROP TRIGGER IF EXISTS trg_set_cash_paid_on_delivery ON orders;
CREATE TRIGGER trg_set_cash_paid_on_delivery
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_cash_paid_on_delivery();

-- GRANTs
GRANT EXECUTE ON FUNCTION set_cash_paid_on_delivery() TO anon;
GRANT EXECUTE ON FUNCTION set_cash_paid_on_delivery() TO authenticated;
GRANT EXECUTE ON FUNCTION set_cash_paid_on_delivery() TO service_role;
