import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { applyWatermark } from '@/lib/watermark'

// Only allow image URLs from our own Supabase instance to prevent SSRF
const ALLOWED_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  // Auth: token query param (required for <img src> usage)
  const token = (req.query.token as string) ?? req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const isAdmin =
    user.email === process.env.ADMIN_EMAIL ||
    user.user_metadata?.role === 'admin'
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const imageUrl = req.query.imageUrl as string
  if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl' })

  // SSRF guard: only allow our Supabase storage URLs
  if (!imageUrl.startsWith(ALLOWED_HOST)) {
    return res.status(400).json({ error: 'imageUrl must be from Supabase storage' })
  }

  try {
    const upstream = await fetch(imageUrl)
    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream fetch failed: ${upstream.status}` })
    }

    const inputBuffer = Buffer.from(await upstream.arrayBuffer())
    const { buffer, contentType } = await applyWatermark(inputBuffer)

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    res.setHeader('Content-Length', buffer.length)
    res.status(200).end(buffer)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Preview fehlgeschlagen'
    console.error('[watermark-preview]', err)
    res.status(500).json({ error: msg })
  }
}
