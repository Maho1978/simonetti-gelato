import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EmailRequest {
  type: 'order_confirmed' | 'new_order_admin' | 'order_out_for_delivery' | 'order_delivered'
  order: any
  recipientEmail: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, order, recipientEmail }: EmailRequest = req.body

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email required' })
    }

    // Email-Einstellungen aus DB laden
    const { data: settings } = await supabaseAdmin
      .from('shop_settings')
      .select('email_notifications')
      .eq('id', 'main')
      .single()

    const emailSettings = settings?.email_notifications || {}
    const typeSettings = emailSettings[type] || {}

    // order_confirmed ist IMMER aktiv
    if (type !== 'order_confirmed' && typeSettings.enabled === false) {
      return res.status(200).json({ success: true, skipped: true, reason: 'Email type disabled' })
    }

    // Admin-Emails gehen an info@, Kunden-Emails an bestellung@
    const fromAddress = type === 'new_order_admin'
      ? 'Simonetti Admin <info@eiscafe-simonetti.de>'
      : 'Simonetti Gelateria <bestellung@eiscafe-simonetti.de>'

    let emailContent = getEmailContent(type, order, typeSettings)

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    if (error) {
      console.error('Resend error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.status(200).json({ success: true, messageId: data?.id })
  } catch (error: any) {
    console.error('Email error:', error)
    res.status(500).json({ error: error.message || 'Failed to send email' })
  }
}

function replaceVars(text: string, order: any) {
  const orderNumber = order.order_number || order.id?.slice(-6) || 'N/A'
  return text
    .replace(/#\{orderNumber\}/g, orderNumber)
    .replace(/#\{customerName\}/g, order.customer_name || '')
    .replace(/#\{total\}/g, order.total?.toFixed(2) + '€' || '')
}

function getEmailContent(type: string, order: any, typeSettings: any = {}) {
  const orderNumber = order.order_number || order.id?.slice(-6) || 'N/A'
  const items = order.items || []
  const total = order.total || 0
  const deliveryAddress = order.delivery_address || {}

  const defaultSubjects: any = {
    order_confirmed: `✅ Bestellung bestätigt #${orderNumber} - Simonetti Gelateria`,
    order_out_for_delivery: `🚗 Dein Eis ist unterwegs! #${orderNumber}`,
    order_delivered: `✅ Bestellung zugestellt #${orderNumber} - Guten Appetit!`,
    new_order_admin: `🔔 Neue Bestellung #${orderNumber} - Sofort bearbeiten!`,
  }

  const subject = typeSettings.subject
    ? replaceVars(typeSettings.subject, order)
    : defaultSubjects[type]

  const customText = typeSettings.custom_text
    ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:15px;border-radius:8px;margin:20px 0;">
        <p style="margin:0;">${replaceVars(typeSettings.custom_text, order)}</p>
       </div>`
    : ''

  switch (type) {
    case 'order_confirmed':
      return {
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4a5d54 0%, #8da399 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #fff; padding: 30px; border: 2px solid #f0ede8; border-radius: 0 0 12px 12px; }
    .order-items { background: #f9f8f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .total { font-size: 24px; font-weight: bold; color: #4a5d54; text-align: right; margin-top: 15px; }
    .status-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .footer { text-align: center; color: #8da399; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🍦 Simonetti Gelateria</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Ihre Bestellung wurde bestätigt!</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <span class="status-badge">✅ Bestätigt</span>
      </div>
      <h2 style="color: #4a5d54;">Bestellung #${orderNumber}</h2>
      <p>Vielen Dank für Ihre Bestellung! Wir bereiten Ihre Leckereien gerade zu.</p>
      ${customText}
      <div class="order-items">
        <h3 style="margin-top: 0; color: #4a5d54;">Ihre Bestellung:</h3>
        ${items.map((item: any) => `
          <div class="item">
            <span>${item.quantity}x ${item.name}${item.selectedFlavors?.length ? ' (' + item.selectedFlavors.join(', ') + ')' : ''}</span>
            <span style="font-weight: 600;">${(item.price * item.quantity).toFixed(2)} €</span>
          </div>
        `).join('')}
        <div class="total">${total.toFixed(2)} €</div>
      </div>
      ${typeof deliveryAddress === 'string' && deliveryAddress ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong style="color: #4a5d54;">📍 Lieferadresse:</strong><br>${deliveryAddress}
        </div>
      ` : deliveryAddress.street ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong style="color: #4a5d54;">📍 Lieferadresse:</strong><br>
          ${deliveryAddress.name}<br>
          ${deliveryAddress.street}<br>
          ${deliveryAddress.zip} ${deliveryAddress.city}
        </div>
      ` : ''}
      <p style="margin-top: 30px; color: #666;">
        <strong>Geschätzte Lieferzeit:</strong> 30-45 Minuten<br>
        Sie erhalten eine weitere Email sobald Ihre Bestellung unterwegs ist.
      </p>
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
        <strong>💡 Tipp:</strong> Halten Sie Ihr Handy bereit - unser Fahrer könnte Sie anrufen falls er die Adresse nicht findet.
      </div>
    </div>
    <div class="footer">
      <p>Simonetti Gelateria | Langenfeld<br>Bei Fragen: info@eiscafe-simonetti.de</p>
    </div>
  </div>
</body>
</html>`
      }

    case 'new_order_admin':
      return {
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; text-align: center; }
    .content { background: #fff; padding: 30px; border: 2px solid #f0ede8; border-radius: 12px; margin-top: 20px; }
    .order-items { background: #f9f8f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .total { font-size: 24px; font-weight: bold; color: #4a5d54; text-align: right; margin-top: 15px; }
    .btn { display: inline-block; background: #4a5d54; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert">
      <h1 style="margin: 0; color: #dc2626; font-size: 28px;">🔔 NEUE BESTELLUNG!</h1>
      <p style="margin: 10px 0 0; font-size: 18px; font-weight: 600;">Bestellung #${orderNumber}</p>
    </div>
    <div class="content">
      ${order.customer_name ? `
        <div style="background: #f9f8f4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #4a5d54;">Kunde:</strong><br>
          <span style="font-size: 16px; font-weight: 600;">${order.customer_name}</span><br>
          ${order.customer_phone ? `📞 ${order.customer_phone}<br>` : ''}
          📍 ${typeof deliveryAddress === 'string' ? deliveryAddress : deliveryAddress.street ? `${deliveryAddress.street}, ${deliveryAddress.zip} ${deliveryAddress.city}` : 'Abholung'}
        </div>` : ''}
      <div class="order-items">
        <h3 style="margin-top: 0; color: #4a5d54;">Bestellte Artikel:</h3>
        ${items.map((item: any) => `
          <div class="item">
            <span><strong>${item.quantity}x</strong> ${item.name}${item.selectedFlavors?.length ? ' (' + item.selectedFlavors.join(', ') + ')' : ''}</span>
            <span style="font-weight: 600;">${(item.price * item.quantity).toFixed(2)} €</span>
          </div>
        `).join('')}
        <div class="total">${total.toFixed(2)} €</div>
      </div>
      ${order.notes ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong>💬 Kundennotiz:</strong><br>${order.notes}
        </div>` : ''}
      <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <strong>💳 Zahlung:</strong> ${order.payment_method === 'stripe' ? 'Kreditkarte (bereits bezahlt)' : order.payment_method || 'N/A'}<br>
        <strong>⏰ Bestellzeit:</strong> ${new Date(order.created_at || Date.now()).toLocaleString('de-DE')}
      </div>
      <div style="text-align: center;">
        <a href="https://eiscafe-simonetti.de/admin/kanban" class="btn">🎯 Zum Kanban Board</a>
      </div>
    </div>
  </div>
</body>
</html>`
      }

    case 'order_out_for_delivery':
      return {
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #fff; padding: 30px; border: 2px solid #f0ede8; border-radius: 0 0 12px 12px; }
    .status-badge { display: inline-block; background: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .highlight { background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
    .footer { text-align: center; color: #8da399; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🚗 Unterwegs zu Ihnen!</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Ihr Eis ist gleich da!</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <span class="status-badge">🚗 An Fahrer übergeben</span>
      </div>
      <h2 style="color: #3b82f6;">Bestellung #${orderNumber}</h2>
      <div class="highlight">
        <p style="margin: 0; font-size: 18px; font-weight: 600;">
          ⏱️ Voraussichtliche Ankunft: <span style="color: #3b82f6;">5-15 Minuten</span>
        </p>
      </div>
      ${customText}
      <p>Ihr Fahrer ist bereits auf dem Weg zu Ihnen!</p>
      ${typeof deliveryAddress === 'string' && deliveryAddress ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong style="color: #3b82f6;">📍 Lieferadresse:</strong><br>${deliveryAddress}
        </div>
      ` : deliveryAddress.street ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong style="color: #3b82f6;">📍 Lieferadresse:</strong><br>
          ${deliveryAddress.name}<br>${deliveryAddress.street}<br>${deliveryAddress.zip} ${deliveryAddress.city}
        </div>
      ` : ''}
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
        <strong>💡 Hinweis:</strong> Unser Fahrer könnte Sie anrufen falls er Hilfe beim Finden der Adresse benötigt.
      </div>
      <p style="margin-top: 30px; text-align: center; color: #666;">
        Guten Appetit! 🍦<br><strong>Ihr Simonetti Team</strong>
      </p>
    </div>
    <div class="footer">
      <p>Simonetti Gelateria | Langenfeld<br>Bei Fragen: info@eiscafe-simonetti.de</p>
    </div>
  </div>
</body>
</html>`
      }

    case 'order_delivered':
      return {
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #fff; padding: 30px; border: 2px solid #f0ede8; border-radius: 0 0 12px 12px; }
    .status-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .footer { text-align: center; color: #8da399; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">✅ Zugestellt!</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Guten Appetit!</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <span class="status-badge">✅ Geliefert</span>
      </div>
      <h2 style="color: #10b981; text-align: center;">Bestellung #${orderNumber}</h2>
      <p style="text-align: center; font-size: 18px;">
        Ihre Bestellung wurde erfolgreich zugestellt!<br>
        Wir wünschen Ihnen einen guten Appetit! 🍦
      </p>
      ${customText}
      <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px;">
          <strong>❤️ Hat es geschmeckt?</strong><br>
          Wir würden uns über Ihr Feedback freuen!
        </p>
      </div>
      <p style="text-align: center; color: #666; margin-top: 30px;">
        Vielen Dank für Ihre Bestellung!<br>
        <strong>Bis zum nächsten Mal! 👋</strong>
      </p>
    </div>
    <div class="footer">
      <p>Simonetti Gelateria | Langenfeld<br>info@eiscafe-simonetti.de</p>
    </div>
  </div>
</body>
</html>`
      }

    default:
      return {
        subject: `Simonetti Gelateria - Bestellung #${orderNumber}`,
        html: `<p>Ihre Bestellung wurde aktualisiert.</p>`
      }
  }
}