import type { NextApiRequest, NextApiResponse } from 'next'
const SibApiV3Sdk = require('@brevo/node')

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY)

// ── Helpers ───────────────────────────────────────────────────
function formatAddress(addr: any): string {
  if (!addr) return '–'
  if (typeof addr === 'string') return addr
  return [addr.street, addr.zip && addr.city ? addr.zip + ' ' + addr.city : addr.city].filter(Boolean).join(', ')
}

function formatItems(items: any[]): string {
  if (!items?.length) return '<tr><td colspan="2" style="color:#888;font-size:13px;padding:8px 0;">Keine Artikel</td></tr>'
  return items.map(item => {
    const flavors  = (item.selectedFlavors || item.flavors || []).join(', ')
    const extras   = (item.selectedExtras  || item.extras  || []).map((e: any) => e.name || e).join(', ')
    const lineTotal = ((item.totalPrice || (item.price * item.quantity)) || 0).toFixed(2)
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ede8;vertical-align:top;">
          <strong style="color:#2d2d2d;">${item.quantity}x ${item.name}</strong>
          ${flavors ? `<br><span style="font-size:12px;color:#8da399;">🍦 ${flavors}</span>` : ''}
          ${extras  ? `<br><span style="font-size:12px;color:#8da399;">➕ ${extras}</span>`  : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ede8;text-align:right;white-space:nowrap;vertical-align:top;">
          <strong>${lineTotal} €</strong>
        </td>
      </tr>`
  }).join('')
}

function subtotal(items: any[]): number {
  return (items || []).reduce((s: number, i: any) => s + ((i.totalPrice || (i.price * i.quantity)) || 0), 0)
}

function baseLayout(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Eiscafé Simonetti</title>
</head>
<body style="margin:0;padding:0;background-color:#faf9f7;font-family:'Segoe UI',Arial,sans-serif;color:#2d2d2d;">
${previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf9f7;padding:30px 10px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
  <tr>
    <td style="background-color:#2d2d2d;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🍦</div>
      <div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Simonetti</div>
      <div style="color:#888888;font-size:11px;letter-spacing:5px;margin-top:4px;">E I S C A F É</div>
    </td>
  </tr>
  <tr>
    <td style="background-color:#ffffff;padding:40px;border-radius:0 0 16px 16px;">
      ${content}
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #f0ede8;text-align:center;">
        <p style="color:#aaaaaa;font-size:12px;line-height:2;margin:0;">
          Eiscafé Simonetti · Konrad-Adenauer-Platz 2 · 40764 Langenfeld<br/>
          📞 <a href="tel:+4921731622780" style="color:#8da399;text-decoration:none;">02173 / 16 22 780</a>
          &nbsp;·&nbsp;
          <a href="mailto:bestellung@eiscafe-simonetti.de" style="color:#8da399;text-decoration:none;">bestellung@eiscafe-simonetti.de</a><br/>
          <a href="https://www.eiscafe-simonetti.de" style="color:#8da399;text-decoration:none;">www.eiscafe-simonetti.de</a>
        </p>
        <p style="color:#cccccc;font-size:11px;margin-top:12px;margin-bottom:0;">
          © ${new Date().getFullYear()} Eiscafé Simonetti · Langenfeld
        </p>
      </div>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function emailOrderConfirmed(order: any): string {
  const fee   = order.delivery_fee ?? 3.00
  const tip   = order.tip ?? 0
  const total = order.total ?? 0
  const sub   = subtotal(order.items)

  return baseLayout(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:60px;margin-bottom:12px;">✅</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#2d2d2d;">Bestellung bestätigt!</h1>
      <p style="margin:0;color:#8da399;font-size:15px;">Danke, <strong>${order.customer_name || 'lieber Kunde'}</strong>! Wir haben deine Bestellung erhalten.</p>
    </div>
    <div style="background:#f0ede8;border-radius:12px;padding:14px 20px;text-align:center;margin-bottom:28px;">
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Bestellnummer</div>
      <div style="font-size:24px;font-weight:900;color:#2d2d2d;margin-top:4px;">#${order.order_number || (order.id || '').slice(-6).toUpperCase()}</div>
    </div>
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:10px;">Deine Bestellung</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      ${formatItems(order.items || [])}
      <tr><td colspan="2" style="padding:6px 0;"></td></tr>
      <tr><td style="padding:4px 0;color:#888;font-size:13px;">Zwischensumme</td><td style="padding:4px 0;text-align:right;font-size:13px;">${sub.toFixed(2)} €</td></tr>
      <tr><td style="padding:4px 0;color:#888;font-size:13px;">Liefergebühr</td><td style="padding:4px 0;text-align:right;font-size:13px;">${fee.toFixed(2)} €</td></tr>
      ${tip > 0 ? `<tr><td style="padding:4px 0;color:#888;font-size:13px;">Trinkgeld</td><td style="padding:4px 0;text-align:right;font-size:13px;">${tip.toFixed(2)} €</td></tr>` : ''}
      <tr><td style="padding:14px 0 4px;border-top:2px solid #2d2d2d;font-size:16px;font-weight:900;">Gesamt</td><td style="padding:14px 0 4px;border-top:2px solid #2d2d2d;text-align:right;font-size:18px;font-weight:900;">${total.toFixed(2)} €</td></tr>
    </table>
    <div style="background:#f8f7f5;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">📍 Lieferadresse</div>
      <div style="font-weight:700;">${order.customer_name || ''}</div>
      ${order.customer_phone ? `<div style="color:#666;font-size:13px;margin-top:2px;">📞 ${order.customer_phone}</div>` : ''}
      <div style="color:#666;font-size:13px;margin-top:2px;">${formatAddress(order.delivery_address)}</div>
    </div>
    <div style="background:#e8f5ec;border-radius:12px;padding:18px 20px;text-align:center;margin-bottom:20px;">
      <div style="font-size:26px;margin-bottom:6px;">⏱️</div>
      <div style="font-weight:700;color:#2d6a4f;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Voraussichtliche Lieferzeit</div>
      <div style="font-size:26px;font-weight:900;color:#2d6a4f;margin-top:4px;">30 – 45 Minuten</div>
    </div>
    ${order.notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:20px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#92400e;margin-bottom:4px;">💬 Anmerkung</div><div style="color:#78350f;font-size:13px;">${order.notes}</div></div>` : ''}
    <p style="text-align:center;color:#aaa;font-size:13px;margin:0;line-height:1.8;">
      Wir bereiten dein Eis jetzt frisch für dich zu. 🍦<br/>
      Bei Fragen: <a href="tel:+4921731622780" style="color:#4a5d54;text-decoration:none;font-weight:700;">02173 / 16 22 780</a>
    </p>
  `, `Deine Bestellung #${order.order_number || ''} ist bei uns eingegangen!`)
}

function emailOutForDelivery(order: any): string {
  return baseLayout(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:64px;margin-bottom:12px;">🚗</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#2d2d2d;">Dein Eis ist unterwegs!</h1>
      <p style="margin:0;color:#8da399;font-size:15px;">Hey <strong>${order.customer_name || ''}</strong>! Unser Fahrer ist auf dem Weg zu dir.</p>
    </div>
    <div style="background:#fff7ed;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;margin-bottom:8px;">⏱️</div>
      <div style="font-size:12px;color:#9a6726;text-transform:uppercase;letter-spacing:1px;">Ankunft in ca.</div>
      <div style="font-size:32px;font-weight:900;color:#d97706;margin-top:4px;">15 – 20 Minuten</div>
    </div>
    <div style="background:#f8f7f5;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">📍 Lieferung an</div>
      <div style="font-weight:700;">${order.customer_name || ''}</div>
      <div style="color:#666;font-size:13px;margin-top:2px;">${formatAddress(order.delivery_address)}</div>
    </div>
    <p style="text-align:center;color:#aaa;font-size:13px;margin:0;line-height:1.8;">Guten Appetit! 🍦<br/>Dein Simonetti Team</p>
  `, `Dein Eis ist unterwegs – Ankunft in ca. 15-20 Minuten!`)
}

function emailDelivered(order: any): string {
  return baseLayout(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:64px;margin-bottom:12px;">🎉</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#2d2d2d;">Guten Appetit!</h1>
      <p style="margin:0;color:#8da399;font-size:15px;">Deine Bestellung wurde erfolgreich zugestellt.</p>
    </div>
    <div style="background:#e8f5ec;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;margin-bottom:8px;">🍦</div>
      <div style="font-weight:900;color:#2d6a4f;font-size:18px;">Vielen Dank für deine Bestellung!</div>
      <div style="color:#888;font-size:13px;margin-top:6px;">Bestellung #${order.order_number || (order.id || '').slice(-6).toUpperCase()}</div>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://www.google.com/maps/place/Eiscafe+Simonetti+Langenfeld"
        style="display:inline-block;background:#4a5d54;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;">
        ⭐ Bei Google bewerten
      </a>
    </div>
    <div style="background:#f8f7f5;border-radius:12px;padding:18px 20px;text-align:center;">
      <div style="font-size:13px;color:#888;margin-bottom:10px;">Wieder Lust auf Eis?</div>
      <a href="https://www.eiscafe-simonetti.de"
        style="display:inline-block;background:#2d2d2d;color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
        🍦 Erneut bestellen
      </a>
    </div>
  `, `Deine Bestellung wurde zugestellt – Guten Appetit! 🍦`)
}

function emailOrderRejected(order: any): string {
  return baseLayout(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:56px;margin-bottom:12px;">😔</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#2d2d2d;">Bestellung leider nicht möglich</h1>
      <p style="margin:0;color:#888;font-size:15px;">Hallo <strong>${order.customer_name || ''}</strong>! Wir müssen deine Bestellung leider ablehnen.</p>
    </div>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:18px 20px;margin-bottom:28px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#991b1b;margin-bottom:6px;">Bestellung #${order.order_number || (order.id || '').slice(-6).toUpperCase()}</div>
      ${order.reject_reason ? `<div style="color:#7f1d1d;font-weight:600;font-size:14px;">Grund: ${order.reject_reason}</div>` : ''}
    </div>
    <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <div style="font-size:20px;margin-bottom:6px;">✅</div>
      <div style="font-weight:700;color:#166534;font-size:14px;">Du wurdest nicht belastet</div>
      <div style="color:#4b7a5e;font-size:13px;margin-top:4px;">Eine eventuelle Zahlung wird automatisch zurückgebucht.</div>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://www.eiscafe-simonetti.de"
        style="display:inline-block;background:#4a5d54;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
        🍦 Erneut versuchen
      </a>
    </div>
  `, `Deine Bestellung konnte leider nicht bearbeitet werden.`)
}

function emailNewOrderAdmin(order: any): string {
  const fee   = order.delivery_fee ?? 3.00
  const tip   = order.tip ?? 0
  const total = order.total ?? 0
  const sub   = subtotal(order.items)

  return baseLayout(`
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
      <div style="font-size:20px;font-weight:900;color:#92400e;">🔔 NEUE BESTELLUNG!</div>
      <div style="color:#92400e;font-size:13px;margin-top:4px;">#${order.order_number || (order.id || '').slice(-6).toUpperCase()} · ${new Date(order.created_at || Date.now()).toLocaleString('de-DE')}</div>
    </div>
    <div style="background:#f8f7f5;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">Kunde</div>
      <div style="font-weight:700;font-size:16px;">${order.customer_name || '–'}</div>
      ${order.customer_phone ? `<div style="color:#555;margin-top:4px;font-size:13px;">📞 <a href="tel:${order.customer_phone}" style="color:#4a5d54;text-decoration:none;">${order.customer_phone}</a></div>` : ''}
      <div style="color:#555;margin-top:4px;font-size:13px;">📍 ${formatAddress(order.delivery_address)}</div>
      ${order.customer_email ? `<div style="color:#555;margin-top:4px;font-size:13px;">✉️ ${order.customer_email}</div>` : ''}
    </div>
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:10px;">Bestellte Artikel</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      ${formatItems(order.items || [])}
      <tr><td colspan="2" style="padding:6px 0;"></td></tr>
      <tr><td style="padding:4px 0;color:#888;font-size:13px;">Zwischensumme</td><td style="padding:4px 0;text-align:right;font-size:13px;">${sub.toFixed(2)} €</td></tr>
      <tr><td style="padding:4px 0;color:#888;font-size:13px;">Liefergebühr</td><td style="padding:4px 0;text-align:right;font-size:13px;">${fee.toFixed(2)} €</td></tr>
      ${tip > 0 ? `<tr><td style="padding:4px 0;color:#888;font-size:13px;">Trinkgeld</td><td style="padding:4px 0;text-align:right;font-size:13px;">${tip.toFixed(2)} €</td></tr>` : ''}
      <tr><td style="padding:14px 0 4px;border-top:2px solid #2d2d2d;font-size:16px;font-weight:900;">Gesamt</td><td style="padding:14px 0 4px;border-top:2px solid #2d2d2d;text-align:right;font-size:20px;font-weight:900;">${total.toFixed(2)} €</td></tr>
    </table>
    ${order.notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:20px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#92400e;margin-bottom:4px;">💬 Anmerkung</div><div style="color:#78350f;font-size:13px;">${order.notes}</div></div>` : ''}
    <div style="text-align:center;margin-top:24px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eiscafe-simonetti.de'}/admin/kanban"
        style="display:inline-block;background:#2d2d2d;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
        🗂️ Jetzt im Kanban bearbeiten →
      </a>
    </div>
  `, `Neue Bestellung #${order.order_number || ''} – ${total.toFixed(2)} € von ${order.customer_name || 'Gast'}`)
}

// ── API Handler ───────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, order, recipientEmail } = req.body
  if (!type || !order) return res.status(400).json({ error: 'Missing type or order' })
  if (!recipientEmail) return res.status(400).json({ error: 'No recipient email' })

  try {
    // Email-Settings laden
    let emailSettings: any = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await sb.from('shop_settings').select('email_notifications').eq('id', 'main').single()
      emailSettings = data?.email_notifications
    } catch (_) {}

    // Deaktiviert check
    if (emailSettings && type !== 'order_confirmed') {
      const cfg = emailSettings[type]
      if (cfg && cfg.enabled === false) {
        return res.status(200).json({ success: true, skipped: true, reason: 'disabled' })
      }
    }

    const orderNr = order.order_number || (order.id || '').slice(-6).toUpperCase()

    const getSubject = (fallback: string) => {
      const tmpl = emailSettings?.[type]?.subject
      if (!tmpl) return fallback
      return tmpl
        .replace('#{orderNumber}', orderNr)
        .replace('#{customerName}', order.customer_name || '')
        .replace('#{total}', (order.total || 0).toFixed(2))
    }

    let subject = ''
    let html    = ''

    switch (type) {
      case 'order_confirmed':
        subject = getSubject(`✅ Bestellung #${orderNr} bestätigt – Eiscafé Simonetti`)
        html    = emailOrderConfirmed(order)
        break
      case 'order_out_for_delivery':
        subject = getSubject(`🚗 Dein Eis ist unterwegs! #${orderNr}`)
        html    = emailOutForDelivery(order)
        break
      case 'order_delivered':
        subject = getSubject(`🎉 Zugestellt! Guten Appetit! #${orderNr}`)
        html    = emailDelivered(order)
        break
      case 'order_rejected':
        subject = getSubject(`❌ Bestellung #${orderNr} konnte leider nicht bearbeitet werden`)
        html    = emailOrderRejected(order)
        break
      case 'new_order_admin':
        subject = getSubject(`🔔 Neue Bestellung #${orderNr} – ${(order.total || 0).toFixed(2)} €`)
        html    = emailNewOrderAdmin(order)
        break
      default:
        return res.status(400).json({ error: `Unknown email type: ${type}` })
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    sendSmtpEmail.subject = subject
    sendSmtpEmail.htmlContent = html
    sendSmtpEmail.sender = { name: 'Eiscafé Simonetti', email: 'bestellung@eiscafe-simonetti.de' }
    sendSmtpEmail.to = [{ email: recipientEmail }]
    sendSmtpEmail.replyTo = { email: 'bestellung@eiscafe-simonetti.de' }

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    return res.status(200).json({ success: true, id: data?.body?.messageId })

  } catch (err: any) {
    console.error('Brevo email error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}