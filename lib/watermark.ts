import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
export type { WatermarkConfig } from './watermark-config'
export { DEFAULT_CONFIG } from './watermark-config'
import type { WatermarkConfig } from './watermark-config'
import { DEFAULT_CONFIG } from './watermark-config'

let _fontsRegistered = false

function ensureFonts() {
  if (_fontsRegistered) return
  const base = path.join(process.cwd(), 'public/fonts')
  GlobalFonts.registerFromPath(path.join(base, 'Inter-Bold.ttf'),    'InterBold')
  GlobalFonts.registerFromPath(path.join(base, 'Inter-Regular.ttf'), 'InterRegular')
  _fontsRegistered = true
}

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

function drawText(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  text: string,
  x: number,
  y: number,
  angleDeg: number,
  cfg: WatermarkConfig,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  if (cfg.shadow_enabled) {
    const shadowOpacity = Math.min(cfg.opacity + 0.3, 1)
    ctx.strokeStyle = hexToRgba(cfg.shadow_color, shadowOpacity)
    ctx.lineWidth   = 3
    ctx.lineJoin    = 'round'
    ctx.strokeText(text, 0, 0)
  }

  ctx.fillStyle = hexToRgba(cfg.color, cfg.opacity)
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

function renderWatermark(width: number, height: number, fontSize: number, cfg: WatermarkConfig): Buffer {
  ensureFonts()

  const canvas = createCanvas(width, height)
  const ctx    = canvas.getContext('2d')

  const family = cfg.font_weight === 'bold' ? 'InterBold' : 'InterRegular'
  ctx.font = `${fontSize}px '${family}'`

  const edgePad = Math.round(Math.min(width, height) * 0.02)

  if (cfg.position === 'center') {
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    drawText(ctx, cfg.text, width / 2, height / 2, cfg.rotation, cfg)

  } else if (cfg.position === 'bottom-right') {
    ctx.textAlign    = 'right'
    ctx.textBaseline = 'alphabetic'
    drawText(ctx, cfg.text, width - edgePad, height - edgePad, cfg.rotation, cfg)

  } else if (cfg.position === 'top-left') {
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'top'
    drawText(ctx, cfg.text, edgePad, edgePad, cfg.rotation, cfg)

  } else {
    // tile
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    const metrics = ctx.measureText(cfg.text)
    const textW   = metrics.width
    const tileW   = textW * 2.2
    const tileH   = fontSize * 4
    const cols    = Math.ceil(width  / tileW) + 2
    const rows    = Math.ceil(height / tileH) + 2

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - 0.5) * tileW + (r % 2 === 1 ? tileW / 2 : 0)
        const y = (r - 0.5) * tileH + tileH / 2
        drawText(ctx, cfg.text, x, y, cfg.rotation, cfg)
      }
    }
  }

  return canvas.toBuffer('image/png')
}

export async function applyWatermark(
  inputBuffer: Buffer,
  config: WatermarkConfig = DEFAULT_CONFIG,
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' | 'image/png' }> {
  const image = sharp(inputBuffer)
  const { width = 800, height = 800, format, channels } = await image.metadata()

  const isTransparentPng = format === 'png' && channels === 4
  const fontSize          = Math.max(12, Math.round(width * (config.font_size_percent / 100)))
  const wmPng             = renderWatermark(width, height, fontSize, config)

  const result = image
    .withMetadata({
      exif: { IFD0: { Copyright: 'Copyright Eiscafé Simonetti, Langenfeld' } },
    })
    .composite([{ input: wmPng, top: 0, left: 0 }])

  if (isTransparentPng) {
    return { buffer: await result.png().toBuffer(), contentType: 'image/png' }
  }
  return { buffer: await result.jpeg({ quality: 85 }).toBuffer(), contentType: 'image/jpeg' }
}
