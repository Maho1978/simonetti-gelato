-- Migration: Order corrections + partial refunds
-- Datum: 2026-05-24
-- Manuell im Supabase SQL Editor ausführen.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS refund_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS correction_log JSONB;

COMMENT ON COLUMN orders.paypal_capture_id IS 'PayPal capture id (purchase_units[0].payments.captures[0].id) — gespeichert beim capture für spätere Refunds';
COMMENT ON COLUMN orders.refund_amount IS 'Bei Teil-/Vollerstattung: erstatteter Betrag in EUR';
COMMENT ON COLUMN orders.refund_date IS 'Zeitpunkt der Erstattung';
COMMENT ON COLUMN orders.correction_log IS 'Array von Korrektur-Events: [{date, removedItems[], oldTotal, newTotal, refundAmount, refundMethod}]';
