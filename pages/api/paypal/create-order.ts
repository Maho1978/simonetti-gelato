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
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { amount, orderData } = req.body;

    // Bestellung in Supabase anlegen
    const orderNumber = `SIM-${Date.now().toString().slice(-6)}`;
    const { data: order, error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      user_id: orderData.user_id || null,
      guest_email: orderData.guest_email || null,
      customer_name: orderData.customer_name || '',
      customer_email: orderData.guest_email || '',
      customer_phone: orderData.guest_phone || '',
      items: orderData.items,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.delivery_fee,
      tip: orderData.tip || 0,
      total: orderData.total,
      delivery_address: orderData.delivery_address,
      notes: orderData.notes || '',
      payment_method: 'paypal',
      payment_status: 'pending',
      status: 'OFFEN',
    }).select().single();

    if (error) throw new Error(error.message);

    // PayPal Order erstellen
    const token = await getPayPalToken();
    if (!token) throw new Error('PayPal Token nicht verfügbar');
    const paypalRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: order.id,
          amount: { currency_code: 'EUR', value: parseFloat(amount).toFixed(2) },
          description: `Eiscafé Simonetti - Bestellung ${orderNumber}`,
        }],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paypal/capture?orderId=${order.id}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cancelled=true`,
          brand_name: 'Eiscafé Simonetti',
          locale: 'de-DE',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    const paypalData = await paypalRes.json();
    const approveUrl = paypalData.links?.find((l: any) => l.rel === 'approve')?.href;
    if (!approveUrl) throw new Error('PayPal Approval URL nicht gefunden');

    return res.json({ url: approveUrl, orderId: order.id });
  } catch (err: any) {
    console.error('PayPal create-order error:', err);
    return res.status(500).json({ error: err.message });
  }
}
