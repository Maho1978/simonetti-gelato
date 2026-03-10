// ============================================================
// SIMONETTI BACKEND - pages/api/driver/notify.js
// Push Notification an Fahrer senden wenn Bestellung zugewiesen
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { push_token, order_number, customer_name, address } = req.body

  if (!push_token) {
    return res.status(400).json({ error: 'push_token erforderlich' })
  }

  // Über Expo Push Service senden (kostenlos, kein eigener Server nötig)
  const message = {
    to: push_token,
    sound: 'default',
    title: '🛵 Neue Lieferung!',
    body: `#${order_number} · ${customer_name}`,
    data: { order_number },
    priority: 'high',
    channelId: 'default',
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()

    if (result.data?.status === 'error') {
      console.error('Push error:', result.data.message)
      return res.status(500).json({ error: result.data.message })
    }

    return res.status(200).json({ success: true, result })
  } catch (error) {
    console.error('Push send failed:', error)
    return res.status(500).json({ error: error.message })
  }
}