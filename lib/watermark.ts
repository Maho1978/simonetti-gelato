import sharp from 'sharp'

export async function applyWatermark(
  inputBuffer: Buffer
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' | 'image/png' }> {
  const image = sharp(inputBuffer)
  const { width = 800, height = 800, format, channels } = await image.metadata()

  const isTransparentPng = format === 'png' && channels === 4

  const fontSize = Math.round(width * 0.07)
  const cx = width  / 2
  const cy = height / 2

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text
      x="${cx}" y="${cy}"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="DejaVu Sans, Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="bold"
      fill="#FFFFFF"
      stroke="#000000"
      stroke-width="2"
      paint-order="stroke fill"
      opacity="0.3"
      transform="rotate(-30, ${cx}, ${cy})"
    >Eiscaf&#233; Simonetti</text>
  </svg>`

  const compositeTop  = 0
  const compositeLeft = 0

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
