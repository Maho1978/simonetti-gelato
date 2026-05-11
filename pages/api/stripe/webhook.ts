import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Stripe braucht den RAW Body – kein JSON.parse!
export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Raw Body auslesen
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const rawBody = await getRawBody(req)
  const signature = req.headers['stripe-signature'] as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook Signatur ungültig:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {

      // ✅ App-Zahlung: Checkout Session abgeschlossen (expo-web-browser)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('✅ Checkout Session abgeschlossen:', session.id)

        const orderId = session.metadata?.order_id

        if (!orderId) {
          console.error('Keine order_id in Session Metadata')
          break
        }

        // Bestellung auf OFFEN + bezahlt setzen
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'OFFEN',
            payment_status: 'paid',
            payment_intent_id: session.payment_intent as string,
            stripe_session_id: session.id,
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Order update fehlgeschlagen:', updateError)
          break
        }

        console.log('✅ Bestellung aktiviert:', orderId)

        // Bestätigungs-Email an Kunden
        const customerEmail = session.customer_email
        if (customerEmail) {
          try {
            const { data: order } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .single()

            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/send-order-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'order_confirmed',
                order,
                recipientEmail: customerEmail,
              })
            })
          } catch (e) {
            console.error('Bestätigungs-Email fehlgeschlagen:', e)
          }
        }

        // Telegram Benachrichtigung
        try {
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single()

          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/telegram/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order })
          })
        } catch (e) {
          console.error('Telegram Benachrichtigung fehlgeschlagen:', e)
        }

        break
      }

      // ❌ Checkout Session abgebrochen/abgelaufen
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id

        if (orderId) {
          await supabase
            .from('orders')
            .update({ status: 'STORNIERT', payment_status: 'cancelled' })
            .eq('id', orderId)

          console.log('❌ Bestellung storniert (Session abgelaufen):', orderId)
        }
        break
      }

      // ✅ Website-Zahlung: PaymentIntent erfolgreich
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const meta = paymentIntent.metadata

        console.log('✅ Zahlung erfolgreich:', paymentIntent.id)

        // Prüfen ob Bestellung schon existiert (vom Checkout direkt gespeichert)
        const { data: existing } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_intent_id', paymentIntent.id)
          .single()

        if (existing) {
          console.log('Bestellung existiert bereits - sende Bestaetigungs-Email:', existing.id)
          // Bestätigungs-Email an Kunden senden
          if (existing.customer_email) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/send-order-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'order_confirmed',
                  order: existing,
                  recipientEmail: existing.customer_email,
                })
              })
              console.log('✅ Bestaetigungs-Email gesendet an:', existing.customer_email)
            } catch (e) {
              console.error('Bestaetigungs-Email fehlgeschlagen:', e)
            }
          }
          // Admin-Email
          const adminEmail = process.env.ADMIN_EMAIL || 'bestellung@eiscafe-simonetti.de'
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/send-order-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'new_order_admin',
                order: existing,
                recipientEmail: adminEmail,
              })
            })
          } catch (e) {
            console.error('Admin-Email fehlgeschlagen:', e)
          }
          break
        }

        // Bestellung existiert noch nicht (Fallback - sollte nicht vorkommen)
        let items = []
        try {
          items = JSON.parse(meta.items || '[]')
        } catch (e) {
          console.error('Items parsen fehlgeschlagen:', e)
        }

        const orderNumber = 'S' + Date.now().toString().slice(-6)

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number:      orderNumber,
            status:            'OFFEN',
            customer_name:     meta.customer_name  || '',
            customer_email:    meta.customer_email || '',
            customer_phone:    meta.customer_phone || '',
            delivery_address:  meta.delivery_address || '',
            items:             items,
            subtotal:          parseFloat(meta.subtotal  || '0'),
            delivery_fee:      parseFloat(meta.delivery_fee || '3'),
            tip:               parseFloat(meta.tip || '0'),
            total:             paymentIntent.amount / 100,
            payment_method:    'stripe',
            payment_intent_id: paymentIntent.id,
            payment_status:    'paid',
            notes:             meta.notes || '',
            created_at:        new Date().toISOString(),
          })
          .select()
          .single()

        if (orderError) {
          console.error('Bestellung speichern fehlgeschlagen:', orderError)
          break
        }

        console.log('✅ Bestellung erstellt:', order.order_number)

        if (meta.customer_email) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/send-order-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'order_confirmed',
                order,
                recipientEmail: meta.customer_email,
              })
            })
          } catch (e) {
            console.error('Bestätigungs-Email fehlgeschlagen:', e)
          }
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'bestellung@eiscafe-simonetti.de'
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/send-order-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'new_order_admin',
              order,
              recipientEmail: adminEmail,
            })
          })
        } catch (e) {
          console.error('Admin-Email fehlgeschlagen:', e)
        }

        break
      }

      // ❌ Zahlung fehlgeschlagen
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Zahlung fehlgeschlagen:', paymentIntent.id)

        await supabase.from('payment_logs').insert({
          payment_intent_id: paymentIntent.id,
          status:            'failed',
          error:             paymentIntent.last_payment_error?.message || 'Unbekannter Fehler',
          created_at:        new Date().toISOString(),
        }).select()

        break
      }

      // 🔄 Rückerstattung
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log('🔄 Rückerstattung:', charge.payment_intent)

        if (charge.payment_intent) {
          await supabase
            .from('orders')
            .update({ payment_status: 'refunded' })
            .eq('payment_intent_id', charge.payment_intent)
        }
        break
      }

      default:
        console.log('Unbekanntes Event:', event.type)
    }

    return res.status(200).json({ received: true })

  } catch (err: any) {
    console.error('Webhook Verarbeitung fehlgeschlagen:', err)
    return res.status(500).json({ error: 'Webhook Verarbeitung fehlgeschlagen' })
  }
}