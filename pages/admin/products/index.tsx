import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/router'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: '🌾',
  milch: '🥛',
  eier: '🥚',
  nüsse: '🥜',
  erdnüsse: '🥜',
  soja: '🫘',
  sesam: '🌿',
  fisch: '🐟',
  sellerie: '🥬',
  senf: '🌭',
  sulfite: '🍷',
}

function ProductsContent() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
    if (data) setProducts(data)
    setLoading(false)
  }

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('name')
      .order('sort_order', { ascending: true })
    if (data) setCategories(data.map((c: any) => c.name))
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ active: !currentActive })
      .eq('id', id)
    if (!error) loadProducts()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Produkt "${name}" wirklich löschen?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) loadProducts()
  }

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p: any) => p.category === selectedCategory)

  return (
    <div className="p-8">
      <div className="max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold italic mb-2">Produkte</h1>
            <p className="text-gray-600">{products.length} Produkte gesamt</p>
          </div>
          <button
            onClick={() => router.push('/admin/products/new')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition font-bold flex items-center gap-2"
          >
            <Plus size={20} />
            Neues Produkt
          </button>
        </div>

        {/* Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition ${selectedCategory === 'all' ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:border-black'}`}
            >
              Alle ({products.length})
            </button>
            {categories.map((cat: string) => {
              const count = (products as any[]).filter(p => p.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg transition ${selectedCategory === cat ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:border-black'}`}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Produktliste */}
        {loading ? (
          <div className="text-center py-12">Lädt...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Keine Produkte in dieser Kategorie</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(filteredProducts as any[]).map((product) => (
              <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">

                {/* Bild */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      {product.icon || product.emoji || '🍦'}
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {!product.active && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded font-semibold">Inaktiv</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    <div className="text-xl font-bold">{product.price?.toFixed(2)} €</div>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  )}

                  {/* Diät-Labels */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.is_vegan && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">🌱 Vegan</span>
                    )}
                    {product.is_vegetarian && !product.is_vegan && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">🥗 Vegetarisch</span>
                    )}
                    {product.is_glutenfree && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">🌾 Glutenfrei</span>
                    )}
                    {product.is_lactosefree && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">🥛 Laktosefrei</span>
                    )}
                  </div>

                  {/* Allergene */}
                  {product.allergens && product.allergens.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Allergene:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.allergens.map((a: string) => (
                          <span key={a} className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-full"
                            title={a}>
                            {ALLERGEN_LABELS[a] || '⚠️'} {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/products/${product.id}`)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold flex items-center justify-center gap-1"
                    >
                      <Edit2 size={14} /> Bearbeiten
                    </button>
                    <button
                      onClick={() => toggleActive(product.id, product.active)}
                      className={`px-3 py-2 rounded transition ${product.active ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      title={product.active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {product.active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      title="Löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <AdminLayout>
      <ProductsContent />
    </AdminLayout>
  )
}