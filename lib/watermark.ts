import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
export type { WatermarkConfig } from './watermark-config'
export { DEFAULT_CONFIG } from './watermark-config'
import type { WatermarkConfig } from './watermark-config'
import { DEFAULT_CONFIG } from './watermark-config'

// Cached at module level — readFileSync runs once per Lambda cold-start
let _boldB64: string | null = null
let _regularB64: string | null = null

function getFontB64(weight: 'bold' | 'normal'): string {
  if (weight === 'bold') {
    if (!_boldB64) {
      _boldB64 = fs
        .readFileSync(path.join(process.cwd(), 'public/fonts/Inter-Bold.ttf'))
        .toString('base64')
    }
    return _boldB64
  }
  if (!_regularB64) {
    _regularB64 = fs
      .readFileSync(path.join(process.cwd(), 'public/fonts/Inter-Regular.ttf'))
      .toString('base64')
  }
  return _regularB64
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function textEl(
  x: number, y: number,
  anchor: string, baseline: string,
  fontSize: number,
  cfg: WatermarkConfig,
  rx: number, ry: number,
): string {
  const strokeStyle = cfg.shadow_enabled
    ? `style="paint-order: stroke fill; stroke: ${escapeXml(cfg.shadow_color)}; stroke-width: 2px; stroke-opacity: ${cfg.opacity};"`
    : ''
  return `<text
    x="${x}" y="${y}"
    text-anchor="${anchor}"
    dominant-baseline="${baseline}"
    font-family="WatermarkFont"
    font-size="${fontSize}"
    font-weight="${cfg.font_weight}"
    fill="${escapeXml(cfg.color)}"
    fill-opacity="${cfg.opacity}"
    transform="rotate(${cfg.rotation} ${rx} ${ry})"
    ${strokeStyle}
  >${escapeXml(cfg.text)}</text>`
}

function buildSvg(width: number, height: number, fontSize: number, cfg: WatermarkConfig): string {
  const fontB64  = getFontB64(cfg.font_weight)
  const edgePad  = Math.round(Math.min(width, height) * 0.02)

  const defs = `<defs><style>@font-face {
    font-family: 'WatermarkFont';
    src: url(data:font/ttf;base64,${fontB64}) format('truetype');
    font-weight: ${cfg.font_weight};
  }</style></defs>`

  let body: string

  if (cfg.position === 'center') {
    const cx = width / 2, cy = height / 2
    body = textEl(cx, cy, 'middle', 'middle', fontSize, cfg, cx, cy)

  } else if (cfg.position === 'bottom-right') {
    const ax = width - edgePad, ay = height - edgePad
    body = textEl(ax, ay, 'end', 'text-after-edge', fontSize, cfg, ax, ay)

  } else if (cfg.position === 'top-left') {
    const ax = edgePad, ay = edgePad + fontSize
    body = textEl(ax, ay, 'start', 'auto', fontSize, cfg, ax, ay)

  } else {
    // tile: repeat across whole image
    const estW  = Math.round(cfg.text.length * fontSize * 0.6)
    const tileW = estW * 2
    const tileH = fontSize * 4
    const cols  = Math.ceil(width  / tileW) + 2
    const rows  = Math.ceil(height / tileH) + 2
    const els: string[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - 0.5) * tileW + (r % 2 === 1 ? tileW / 2 : 0)
        const y = (r - 0.5) * tileH + tileH / 2
        els.push(textEl(x, y, 'middle', 'middle', fontSize, cfg, x, y))
      }
    }
    body = els.join('\n')
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`
}

export async function applyWatermark(
  inputBuffer: Buffer,
  config: WatermarkConfig = DEFAULT_CONFIG,
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' | 'image/png' }> {
  const image = sharp(inputBuffer)
  const { width = 800, height = 800, format, channels } = await image.metadata()

  const isTransparentPng = format === 'png' && channels === 4
  const fontSize = Math.max(10, Math.round(width * (config.font_size_percent / 100)))
  const svg      = buildSvg(width, height, fontSize, config)

  const result = image
    .withMetadata({
      exif: { IFD0: { Copyright: 'Copyright Eiscafé Simonetti, Langenfeld' } },
    })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])

  if (isTransparentPng) {
    return { buffer: await result.png().toBuffer(), contentType: 'image/png' }
  }
  return { buffer: await result.jpeg({ quality: 85 }).toBuffer(), contentType: 'image/jpeg' }
}
