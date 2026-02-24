import type { NextApiRequest, NextApiResponse } from 'next'

async function sendBrevoEmail(to: string, subject: string, html: string): Promise<any> {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY || '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Eiscafe Simonetti', email: 'mahmutduran@hotmail.de' },
      to: [{ email: to }],
      replyTo: { email: 'mahmutduran@hotmail.de' },
      subject,
      htmlContent: html,
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(JSON.stringify(data))
  return data
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { type, order, recipientEmail } = req.body
  if (!type || !order) return res.status(400).json({ error: 'Missing type or order' })
  if (!recipientEmail) return res.status(400).json({ error: 'No recipient email' })
  try {
    const orderNr = order.order_number || (order.id || '').slice(-6).toUpperCase()
    const subject = `Bestellung #${orderNr} - Eiscafe Simonetti`
    const html = `<h1>Bestellung #${orderNr}</h1><p>Typ: ${type}</p><p>Kunde: ${order.customer_name || 'Gast'}</p><p>Gesamt: ${(order.total || 0).toFixed(2)} EUR</p>`
    const result = await sendBrevoEmail(recipientEmail, subject, html)
    return res.status(200).json({ success: true, id: result?.messageId })
  } catch (err: any) {
    console.error('Brevo error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
