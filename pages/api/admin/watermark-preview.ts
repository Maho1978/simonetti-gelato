import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { applyWatermark, DEFAULT_CONFIG } from '@/lib/watermark'
import type { WatermarkConfig } from '@/lib/watermark'

const ALLOWED_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

// Parse inline config from ?wm_* query params (live-preview mode from settings page)
function parseInlineConfig(q: NextApiRequest['query']): WatermarkConfig | null {
  if (!q.wm_text) return null
  return {
    text:              String(q.wm_text),
    font_size_percent: parseFloat(String(q.wm_font_size_percent ?? DEFAULT_CONFIG.font_size_percent)),
    opacity:           parseFloat(String(q.wm_opacity           ?? DEFAULT_CONFIG.opacity)),
    position:          (q.wm_position as WatermarkConfig['position']) ?? DEFAULT_CONFIG.position,
    rotation:          parseInt(String(q.wm_rotation            ?? DEFAULT_CONFIG.rotation), 10),
    color:             String(q.wm_color                        ?? DEFAULT_CONFIG.color),
    shadow_enabled:    String(q.wm_shadow_enabled) !== 'false',
    shadow_color:      String(q.wm_shadow_color                 ?? DEFAULT_CONFIG.shadow_color),
    font_weight:       (q.wm_font_weight as WatermarkConfig['font_weight']) ?? DEFAULT_CONFIG.font_weight,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

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
  if (!imageUrl.startsWith(ALLOWED_HOST)) {
    return res.status(400).json({ error: 'imageUrl must be from Supabase storage' })
  }

  // Inline config (from settings live-preview) OR load from DB
  const inlineConfig = parseInlineConfig(req.query)
  const config: WatermarkConfig = inlineConfig ?? await (async () => {
    const { data } = await supabaseAdmin
      .from('watermark_config').select('*').eq('id', 1).single()
    return (data as WatermarkConfig) ?? DEFAULT_CONFIG
  })()

  try {
    const upstream = await fetch(imageUrl)
    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream fetch failed: ${upstream.status}` })
    }

    const inputBuffer = Buffer.from(await upstream.arrayBuffer())
    const { buffer, contentType } = await applyWatermark(inputBuffer, config)

    res.setHeader('Content-Type', contentType)
    // No caching for live-preview (inline params); cache DB-backed renders
    res.setHeader('Cache-Control', inlineConfig
      ? 'no-store'
      : 'public, max-age=3600, stale-while-revalidate=86400')
    res.setHeader('Content-Length', buffer.length)
    res.status(200).end(buffer)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Preview fehlgeschlagen'
    console.error('[watermark-preview]', err)
    res.status(500).json({ error: msg })
  }
}
