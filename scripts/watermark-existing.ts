import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { applyWatermark } from '../lib/watermark'

const BUCKET = 'product-images'
const FOLDER = 'products'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function listAllFiles(admin: any) {
  const files: Array<{ name: string; metadata: Record<string, string> }> = []
  const pageSize = 100
  let offset = 0

  while (true) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list(FOLDER, { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } })

    if (error) throw new Error(`Listing fehlgeschlagen: ${error.message}`)
    if (!data || data.length === 0) break

    for (const f of data) {
      if (/\.(jpe?g|png|webp)$/i.test(f.name)) {
        files.push({ name: f.name, metadata: (f.metadata as Record<string, string>) ?? {} })
      }
    }

    if (data.length < pageSize) break
    offset += pageSize
  }

  return files
}

async function main() {
  const argv   = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const limIdx = argv.indexOf('--limit')
  const limit  = limIdx >= 0 ? parseInt(argv[limIdx + 1], 10) : Infinity

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !svcKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt (.env.local)')
    process.exit(1)
  }

  const admin = createClient(url, svcKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('📋 Lade Bildliste aus Bucket "product-images"...')
  const allFiles = await listAllFiles(admin)
  const toProcess = Number.isFinite(limit) ? allFiles.slice(0, limit) : allFiles

  console.log(`📦 ${allFiles.length} Bild(er) gefunden, ${toProcess.length} werden verarbeitet`)

  if (dryRun) {
    console.log('🧪 DRY-RUN – es wird nichts geschrieben\n')
  } else {
    console.log()
    console.log('⚠️  BACKUP-HINWEIS: Erstelle vorher ein Backup des Supabase-Buckets!')
    console.log('   Empfehlung: zuerst --dry-run ausführen, dann --limit 3 zum Testen.')
    console.log()
  }

  const errors: string[] = []

  for (let i = 0; i < toProcess.length; i++) {
    const file     = toProcess[i]
    const filePath = `${FOLDER}/${file.name}`
    const label    = `[${i + 1}/${toProcess.length}] ${file.name}`

    try {
      const { data: blob, error: dlErr } = await admin.storage.from(BUCKET).download(filePath)
      if (dlErr || !blob) throw dlErr ?? new Error('Download lieferte kein Blob')

      const inputBuffer = Buffer.from(await blob.arrayBuffer())

      if (dryRun) {
        console.log(`${label} ✓ (dry-run, übersprungen)`)
        continue
      }

      // Content-Type aus Storage-Metadata übernehmen (Schritt 4 laut Spec)
      const originalContentType = file.metadata?.mimetype ?? 'image/jpeg'

      const { buffer: watermarked, contentType } = await applyWatermark(inputBuffer)

      // Beim Hochladen den tatsächlichen Output-Typ verwenden;
      // falls Original transparent-PNG war, bleibt es PNG – sonst JPEG
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(filePath, watermarked, {
          contentType,
          cacheControl: '3600',
          upsert: true,
        })

      if (upErr) throw upErr

      console.log(`${label} ✓  (${originalContentType} → ${contentType})`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`${label} ✗  ${msg}`)
      errors.push(`${label} – ${msg}`)
    }
  }

  console.log('\n──────────────────────────────────────')
  if (errors.length === 0) {
    console.log(dryRun
      ? `✅ Dry-run abgeschlossen. ${toProcess.length} Bilder würden verarbeitet.`
      : `✅ Fertig. ${toProcess.length} Bilder mit Wasserzeichen versehen.`)
  } else {
    console.log(`⚠️  ${toProcess.length - errors.length} OK, ${errors.length} Fehler:`)
    errors.forEach(e => console.log(`   • ${e}`))
  }
}

main().catch(err => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
