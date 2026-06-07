import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { applyWatermark, DEFAULT_CONFIG } from '@/lib/watermark'
import type { WatermarkConfig } from '@/lib/watermark'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const isAdmin =
    user.email === process.env.ADMIN_EMAIL ||
    user.user_metadata?.role === 'admin'
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const { base64, mimeType, fileName } = req.body as {
    base64: string
    mimeType: string
    fileName: string
  }

  if (!base64 || !mimeType || !fileName) {
    return res.status(400).json({ error: 'Missing fields: base64, mimeType, fileName' })
  }

  try {
    const inputBuffer = Buffer.from(base64, 'base64')

    const { data: configData } = await supabaseAdmin
      .from('watermark_config').select('*').eq('id', 1).single()
    const wmConfig: WatermarkConfig = (configData as WatermarkConfig) ?? DEFAULT_CONFIG

    const { buffer, contentType } = await applyWatermark(inputBuffer, wmConfig)

    const ext      = contentType === 'image/png' ? 'png' : 'jpg'
    const filePath = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, buffer, { contentType, cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return res.status(200).json({ url: urlData.publicUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload fehlgeschlagen'
    console.error('[upload-product-image]', err)
    return res.status(500).json({ error: msg })
  }
}
