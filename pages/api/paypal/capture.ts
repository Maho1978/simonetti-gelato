import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalToken() {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token, orderId } = req.query;

  try {
    const accessToken = await getPayPalToken();
    if (!accessToken) throw new Error('PayPal Token nicht verfügbar');

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    });
    const captureData = await captureRes.json();

    if (captureData.status === 'COMPLETED') {
      // Sicherstellen dass der PayPal-Auftrag zu dieser DB-Bestellung gehört
      const capturedOrderId = captureData.purchase_units?.[0]?.custom_id;
      if (capturedOrderId && capturedOrderId !== orderId) {
        console.error(`PayPal capture mismatch: custom_id=${capturedOrderId}, query orderId=${orderId}`);
        return res.redirect(302, `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?error=payment_mismatch`);
      }

      const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'IN_BEARBEITUNG',
        paid_at: new Date().toISOString(),
        paypal_capture_id: captureId,
      }).eq('id', orderId as string);

      return res.redirect(302, `${process.env.NEXT_PUBLIC_SITE_URL}/bestellung/erfolg?id=${orderId}`);
    }

    return res.redirect(302, `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?error=payment_failed`);
  } catch (err: any) {
    console.error('PayPal capture error:', err);
    return res.redirect(302, `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?error=payment_error`);
  }
}
