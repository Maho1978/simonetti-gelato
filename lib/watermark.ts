import sharp from 'sharp'

export async function applyWatermark(
  inputBuffer: Buffer
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' | 'image/png' }> {
  const image = sharp(inputBuffer)
  const { width = 800, height = 800, format, channels } = await image.metadata()

  const isTransparentPng = format === 'png' && channels === 4

  const fontSize = Math.max(14, Math.min(48, Math.round(height * 0.03)))
  const edgePad  = Math.round(Math.min(width, height) * 0.02)
  const strokeW  = Math.max(2, Math.round(fontSize / 7))

  const text = 'eiscafe-simonetti.de'
  const svgW = Math.round(text.length * fontSize * 0.62)
  const svgH = Math.round(fontSize * 1.5)

  const svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
    <text
      x="0" y="${fontSize}"
      font-family="DejaVu Sans, Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="bold"
      fill="rgba(255,255,255,0.7)"
      stroke="rgba(0,0,0,0.7)"
      stroke-width="${strokeW}"
      stroke-linejoin="round"
      paint-order="stroke fill"
    >${text}</text>
  </svg>`

  const compositeTop  = Math.max(0, height - svgH - edgePad)
  const compositeLeft = Math.max(0, width  - svgW - edgePad)

  const result = image
    .withMetadata({
      exif: {
        IFD0: { Copyright: 'Copyright Eiscafé Simonetti, Langenfeld' },
      },
    })
    .composite([{
      input: Buffer.from(svg),
      top:   compositeTop,
      left:  compositeLeft,
    }])

  if (isTransparentPng) {
    return { buffer: await result.png().toBuffer(), contentType: 'image/png' }
  }

  return { buffer: await result.jpeg({ quality: 85 }).toBuffer(), contentType: 'image/jpeg' }
}
