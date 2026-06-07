import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

interface Product {
  id: string
  name: string
  image_url: string | null
}

const PAGE_SIZE = 20

export default function WatermarkPreviewPage() {
  const [products, setProducts]     = useState<Product[]>([])
  const [token, setToken]           = useState<string | null>(null)
  const [configCb, setConfigCb]     = useState<string>('')   // cache-buster from config.updated_at
  const [page, setPage]             = useState(0)
  const [loading, setLoading]       = useState(true)
  const [total, setTotal]           = useState(0)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setToken(session.access_token)

      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .not('image_url', 'is', null)

      setTotal(count ?? 0)

      // Cache-buster: use config updated_at so browser reloads when settings change
      const cfgRes = await fetch('/api/admin/watermark-config')
      if (cfgRes.ok) {
        const cfg = await cfgRes.json()
        setConfigCb(cfg.updated_at ?? '')
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!token) return
    loadPage(page)
  }, [page, token])

  async function loadPage(p: number) {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, image_url')
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('name')
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)

    setProducts((data ?? []) as Product[])
    setLoading(false)
  }

  function previewUrl(imageUrl: string) {
    const cb = configCb ? `&cb=${encodeURIComponent(configCb)}` : ''
    return `/api/admin/watermark-preview?imageUrl=${encodeURIComponent(imageUrl)}&token=${token}${cb}`
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Wasserzeichen-Vorschau</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prüfe wie das Wasserzeichen auf deinen Produktbildern aussieht — bevor das Batch-Script die Originale überschreibt.
          </p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ Die rechte Seite zeigt eine Live-Vorschau — es wird <strong>nichts gespeichert</strong>.
            Erst nach <code className="bg-amber-100 px-1 rounded">npx tsx scripts/watermark-existing.ts</code> werden die Originale überschrieben.
          </div>
        </div>

        {/* Pagination oben */}
        {total > PAGE_SIZE && (
          <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <div>Lade Produkte...</div>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <ImageOff size={48} className="mx-auto mb-2 opacity-40" />
              <div>Keine Produkte mit Bild gefunden</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {products.map(product => (
              <ProductRow
                key={product.id}
                product={product}
                previewUrl={previewUrl(product.image_url!)}
              />
            ))}
          </div>
        )}

        {/* Pagination unten */}
        {total > PAGE_SIZE && (
          <div className="mt-6">
            <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function ProductRow({ product, previewUrl }: { product: Product; previewUrl: string }) {
  const [origError, setOrigError]    = useState(false)
  const [previewError, setPreviewError] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Produktname */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
        <span className="font-semibold text-gray-700 text-sm">{product.name}</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Links: Original */}
        <div className="p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            Original
          </div>
          <div className="relative aspect-square w-full max-w-xs mx-auto bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
            {origError ? (
              <NoImage />
            ) : (
              <img
                src={product.image_url!}
                alt={`${product.name} – Original`}
                className="w-full h-full object-cover"
                onError={() => setOrigError(true)}
                loading="lazy"
              />
            )}
          </div>
        </div>

        {/* Rechts: Mit Wasserzeichen */}
        <div className="p-4">
          <div className="text-xs font-bold text-[#4a5d54] uppercase tracking-wide mb-2">
            Mit Wasserzeichen
          </div>
          <div className="relative aspect-square w-full max-w-xs mx-auto bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
            {previewError ? (
              <NoImage label="Vorschau fehlgeschlagen" />
            ) : (
              <img
                src={previewUrl}
                alt={`${product.name} – Wasserzeichen`}
                className="w-full h-full object-cover"
                onError={() => setPreviewError(true)}
                loading="lazy"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NoImage({ label = 'Kein Bild' }: { label?: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
      <ImageOff size={32} />
      <span className="text-xs">{label}</span>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number
  totalPages: number
  total: number
  onPage: (p: number) => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm text-gray-500">
        Seite {page + 1} von {totalPages} ({total} Produkte mit Bild)
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Zurück
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Weiter
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
