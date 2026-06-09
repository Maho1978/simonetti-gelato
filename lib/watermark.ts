import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import * as opentype from 'opentype.js'
export type { WatermarkConfig } from './watermark-config'
export { DEFAULT_CONFIG } from './watermark-config'
import type { WatermarkConfig } from './watermark-config'
import { DEFAULT_CONFIG } from './watermark-config'

// ── Invisible watermark settings ──────────────────────────────
const STEGO_SIG      = 'SIMONETTI-EISCAFE'
const STEGO_SPREAD   = 64
const STEGO_STRENGTH = 6

// ── Font loading (WOFF via opentype.js — no fontconfig needed) ─

let _boldFont:    opentype.Font | null = null
let _regularFont: opentype.Font | null = null

function getFont(weight: 'bold' | 'normal'): opentype.Font {
  const fontDir = path.join(process.cwd(), 'public', 'fonts')
  if (weight === 'bold') {
    if (!_boldFont) {
      const buf = fs.readFileSync(path.join(fontDir, 'Inter-Bold.woff'))
      _boldFont = opentype.parse(buf.buffer as ArrayBuffer)
    }
    return _boldFont
  }
  if (!_regularFont) {
    const buf = fs.readFileSync(path.join(fontDir, 'Inter-Regular.woff'))
    _regularFont = opentype.parse(buf.buffer as ArrayBuffer)
  }
  return _regularFont
}

// ── SVG path rendering ────────────────────────────────────────

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function textToPath(text: string, fontSize: number, font: opentype.Font): { d: string; width: number } {
  let x = 0
  const parts: string[] = []
  for (const ch of text) {
    const g = font.charToGlyph(ch)
    if (g.index > 0) {
      const p = g.getPath(x, 0, fontSize)
      const pd = p.toPathData(2)
      if (pd) parts.push(pd)
    }
    x += (g.advanceWidth ?? 0) * fontSize / font.unitsPerEm
  }
  return { d: parts.join(' '), width: x }
}

function pathEl(
  text: string, cx: number, cy: number,
  fontSize: number, font: opentype.Font,
  cfg: WatermarkConfig,
  anchor: 'center' | 'start' | 'end' = 'center',
  baseline: 'middle' | 'top' | 'bottom' = 'middle',
): string {
  const { d, width } = textToPath(text, fontSize, font)
  if (!d) return ''

  const asc = font.ascender  * fontSize / font.unitsPerEm
  const dsc = Math.abs(font.descender) * fontSize / font.unitsPerEm

  // Horizontal offset
  const xOff = anchor === 'center' ? -width / 2
    : anchor === 'end'             ? -width
    : 0

  // Vertical offset (paths are drawn with baseline at y=0)
  const yOff = baseline === 'middle' ? (asc - dsc) / 2
    : baseline === 'top'             ? asc
    : 0

  const shadowOpacity = Math.min(cfg.opacity + 0.3, 1)
  const shadow = cfg.shadow_enabled
    ? `<path d="${d}" transform="translate(${xOff},${-yOff})"
         fill="${escapeXml(cfg.shadow_color)}" fill-opacity="${shadowOpacity}"
         stroke="${escapeXml(cfg.shadow_color)}" stroke-width="3" stroke-linejoin="round"
         paint-order="stroke fill"/>`
    : ''

  return `<g transform="translate(${cx},${cy}) rotate(${cfg.rotation})">
  ${shadow}
  <path d="${d}" transform="translate(${xOff},${-yOff})"
    fill="${escapeXml(cfg.color)}" fill-opacity="${cfg.opacity}"/>
</g>`
}

function buildSvg(width: number, height: number, fontSize: number, cfg: WatermarkConfig): string {
  const font    = getFont(cfg.font_weight)
  const edgePad = Math.round(Math.min(width, height) * 0.02)
  let body = ''

  if (cfg.position === 'center') {
    body = pathEl(cfg.text, width / 2, height / 2, fontSize, font, cfg, 'center', 'middle')

  } else if (cfg.position === 'bottom-right') {
    body = pathEl(cfg.text, width - edgePad, height - edgePad, fontSize, font, cfg, 'end', 'bottom')

  } else if (cfg.position === 'top-left') {
    body = pathEl(cfg.text, edgePad, edgePad, fontSize, font, cfg, 'start', 'top')

  } else {
    // tile
    const { width: tw } = textToPath(cfg.text, fontSize, font)
    const tileW = tw * 2.2
    const tileH = fontSize * 4
    const cols  = Math.ceil(width  / tileW) + 2
    const rows  = Math.ceil(height / tileH) + 2
    const parts: string[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - 0.5) * tileW + (r % 2 === 1 ? tileW / 2 : 0)
        const y = (r - 0.5) * tileH + tileH / 2
        parts.push(pathEl(cfg.text, x, y, fontSize, font, cfg, 'center', 'middle'))
      }
    }
    body = parts.join('\n')
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
}

// ── Steganographic invisible watermark ───────────────────────

function lcg(seed: string): () => number {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (Math.imul(s, 31) + seed.charCodeAt(i)) | 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) / 0x100000000 }
}

function sigToBits(sig: string): number[] {
  const bits: number[] = []
  for (const ch of sig) {
    const code = ch.charCodeAt(0)
    for (let b = 7; b >= 0; b--) bits.push((code >> b) & 1)
  }
  return bits
}

function bitsToSig(bits: number[]): string {
  let out = ''
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let code = 0
    for (let b = 0; b < 8; b++) code = (code << 1) | bits[i + b]
    if (code > 0) out += String.fromCharCode(code)
  }
  return out
}

function embedStegoMark(data: Buffer, width: number, height: number, channels: number): void {
  const bits  = sigToBits(STEGO_SIG)
  const rng   = lcg(STEGO_SIG)
  const total = width * height
  for (let i = 0; i < bits.length; i++) {
    for (let j = 0; j < STEGO_SPREAD; j++) {
      const pixIdx  = Math.floor(rng() * total)
      const ch      = Math.floor(rng() * 3)
      const byteIdx = pixIdx * channels + ch
      if (byteIdx >= data.length) continue
      const val = data[byteIdx]
      if (val < 32 || val > 223) continue
      data[byteIdx] = bits[i] === 1
        ? Math.min(val + STEGO_STRENGTH, 223)
        : Math.max(val - STEGO_STRENGTH, 32)
    }
  }
}

export async function detectStegoMark(imageBuffer: Buffer): Promise<{ signature: string; confidence: number }> {
  const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true })
  const bits     = sigToBits(STEGO_SIG)
  const rng      = lcg(STEGO_SIG)
  const total    = info.width * info.height
  const channels = info.channels
  const w        = info.width
  const h        = info.height
  const extracted: number[] = []
  for (let i = 0; i < bits.length; i++) {
    let score = 0
    for (let j = 0; j < STEGO_SPREAD; j++) {
      const pixIdx  = Math.floor(rng() * total)
      const ch      = Math.floor(rng() * 3)
      const byteIdx = pixIdx * channels + ch
      if (byteIdx >= data.length) continue
      const val = data[byteIdx]
      if (val < 32 || val > 223) continue
      const row = Math.floor(pixIdx / w), col = pixIdx % w
      let nSum = 0, nCount = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = row + dr, nc = col + dc
          if (nr < 0 || nr >= h || nc < 0 || nc >= w) continue
          const nIdx = (nr * w + nc) * channels + ch
          if (nIdx < data.length) { nSum += data[nIdx]; nCount++ }
        }
      }
      if (nCount === 0) continue
      score += val > (nSum / nCount) ? 1 : -1
    }
    extracted.push(score > 0 ? 1 : 0)
  }
  const recovered  = bitsToSig(extracted)
  const origBits   = sigToBits(STEGO_SIG)
  const confidence = extracted.filter((b, i) => b === origBits[i]).length / origBits.length
  return { signature: recovered, confidence }
}

// ── Main export ───────────────────────────────────────────────

export async function applyWatermark(
  inputBuffer: Buffer,
  config: WatermarkConfig = DEFAULT_CONFIG,
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' | 'image/png' }> {
  const meta     = await sharp(inputBuffer).metadata()
  const width    = meta.width    ?? 800
  const height   = meta.height   ?? 800
  const channels = meta.channels ?? 3
  const isTransparentPng = meta.format === 'png' && channels === 4

  const fontSize = Math.max(12, Math.round(width * (config.font_size_percent / 100)))
  const svg      = buildSvg(width, height, fontSize, config)

  const { data: rawPixels, info } = await sharp(inputBuffer)
    .withMetadata({ exif: { IFD0: { Copyright: 'Copyright Eiscafé Simonetti, Langenfeld' } } })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .raw()
    .toBuffer({ resolveWithObject: true })

  embedStegoMark(rawPixels, info.width, info.height, info.channels)

  const result = sharp(rawPixels, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })

  if (isTransparentPng) {
    return { buffer: await result.png().toBuffer(), contentType: 'image/png' }
  }
  return { buffer: await result.jpeg({ quality: 85 }).toBuffer(), contentType: 'image/jpeg' }
}
