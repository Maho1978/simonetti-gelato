import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/router'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, ChevronDown, ChevronUp } from 'lucide-react'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts]         = useState<any[]>([])
  const [categories, setCategories]     = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState<string | null>(null)
  const [toast, setToast]               = useState('')
  const [expandedId, setExpandedId]     = useState<string | null>(null)

  // Kategorie umbenennen State
  const [renamingId, setRenamingId]     = useState<string | null>(null)
  const [renameValue, setRenameValue]   = useState('')
  const [renameSaving, setRenameSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadAll = async () => {
    setLoading(true)
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*').order('category').order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    if (prodRes.data) setProducts(prodRes.data)
    if (catRes.data)  setCategories(catRes.data)
    setLoading(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    setSaving(id)
    const { error } = await supabase.from('products').update({ active: !current }).eq('id', id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !current } : p))
      showToast(!current ? '✅ Aktiviert' : '⏸️ Deaktiviert')
    }
    setSaving(null)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) { setProducts(prev => prev.filter(p => p.id !== id)); showToast('🗑️ Gelöscht') }
  }

  // ── Kategorie umbenennen + alle Produkte mitziehen ──────────
  const startRename = (cat: any) => {
    setRenamingId(cat.id)
    setRenameValue(cat.name)
  }

  const cancelRename = () => { setRenamingId(null); setRenameValue('') }

  const confirmRename = async (oldName: string) => {
    if (!renameValue.trim() || renameValue === oldName) { cancelRename(); return }
    setRenameSaving(true)

    // 1. Kategorie-Tabelle umbenennen
    const { error: catError } = await supabase
      .from('categories')
      .update({ name: renameValue.trim() })
      .eq('id', renamingId)

    if (catError) { showToast('❌ Fehler: ' + catError.message); setRenameSaving(false); return }

    // 2. ALLE Produkte dieser Kategorie mitziehen
    const { error: prodError } = await supabase
      .from('products')
      .update({ category: renameValue.trim() })
      .eq('category', oldName)

    if (prodError) { showToast('❌ Fehler beim Produkte-Update: ' + prodError.message); setRenameSaving(false); return }

    showToast(`✅ Kategorie umbenannt – alle Produkte aktualisiert`)
    setRenamingId(null)
    setRenameValue('')
    setRenameSaving(false)
    loadAll()
  }

  // ── Filter ────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchCat    = selectedCategory === 'all' || p.category === selectedCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Gruppiert nach Kategorie
  const grouped = filtered.reduce((acc: any, p) => {
    const cat = p.category || 'Ohne Kategorie'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const activeCount   = products.filter(p => p.active).length
  const inactiveCount = products.filter(p => !p.active).length

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl font-semibold text-sm">
          {toast}
        </div>
      )}

      <div className="p-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Produkte</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {products.length} gesamt · <span className="text-green-600">{activeCount} aktiv</span>
              {inactiveCount > 0 && <> · <span className="text-gray-400">{inactiveCount} inaktiv</span></>}
            </p>
          </div>
          <button onClick={() => router.push('/admin/products/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-bold text-sm">
            <Plus size={18} /> Neues Produkt
          </button>
        </div>

        {/* Suche + Filter */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Produkt suchen..."
              className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${selectedCategory === 'all' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}>
              Alle ({products.length})
            </button>
            {categories.map((cat: any) => {
              const count = products.filter(p => p.category === cat.name).length
              return (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${selectedCategory === cat.name ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}>
                  {cat.icon} {cat.name} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Kategorie umbenennen Hinweis */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 mb-5 flex items-center gap-2">
          💡 Kategorie umbenennen: Auf den Kategorienamen in der Liste klicken – alle Produkte werden automatisch mitgezogen.
        </div>

        {/* Produktliste */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-4xl animate-pulse">🍦</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <div>Keine Produkte gefunden</div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([catName, catProducts]: any) => {
              const catData = categories.find(c => c.name === catName)
              const isRenaming = renamingId === catData?.id

              return (
                <div key={catName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Kategorie-Header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{catData?.icon || '📦'}</span>
                      {isRenaming ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmRename(catName); if (e.key === 'Escape') cancelRename() }}
                            autoFocus
                            className="px-3 py-1 border-2 border-blue-400 rounded-lg text-sm font-semibold focus:outline-none w-48"
                          />
                          <button onClick={() => confirmRename(catName)} disabled={renameSaving}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
                            {renameSaving ? '...' : '✓ Speichern'}
                          </button>
                          <button onClick={cancelRename} className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-300">
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => catData && startRename(catData)}
                          className="font-bold text-gray-700 hover:text-blue-600 transition text-sm group flex items-center gap-1"
                          title="Klicken zum Umbenennen">
                          {catName}
                          {catData && <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition text-blue-400" />}
                        </button>
                      )}
                      <span className="text-xs text-gray-400 ml-1">{catProducts.length} Produkte</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {catProducts.filter((p: any) => p.active).length} aktiv
                    </span>
                  </div>

                  {/* Produkt-Zeilen */}
                  <div className="divide-y divide-gray-50">
                    {catProducts.map((product: any) => (
                      <div key={product.id}>
                        {/* Hauptzeile */}
                        <div className={`flex items-center gap-4 px-5 py-3 transition ${!product.active ? 'opacity-50' : 'hover:bg-gray-50'}`}>

                          {/* Toggle */}
                          <button
                            onClick={() => toggleActive(product.id, product.active)}
                            disabled={saving === product.id}
                            className="flex-shrink-0 transition-all hover:scale-110 disabled:opacity-50"
                            style={{ color: product.active ? '#22c55e' : '#d1d5db' }}>
                            {product.active ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                          </button>

                          {/* Emoji */}
                          <span className="text-2xl flex-shrink-0">{product.icon || product.emoji || '🍦'}</span>

                          {/* Name + Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${!product.active ? 'text-gray-400' : 'text-gray-900'}`}>
                                {product.name}
                              </span>
                              {product.is_vegan && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🌱</span>}
                              {product.is_vegetarian && !product.is_vegan && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🥗</span>}
                              {product.is_glutenfree && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">GF</span>}
                              {product.featured && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">⭐</span>}
                            </div>
                            {product.description && (
                              <div className="text-xs text-gray-400 truncate mt-0.5 max-w-xs">{product.description}</div>
                            )}
                          </div>

                          {/* Preis */}
                          <div className="font-bold text-gray-900 flex-shrink-0 text-sm">
                            {(product.price || 0).toFixed(2)} €
                          </div>

                          {/* Aktionen */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition"
                              title="Details">
                              {expandedId === product.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button onClick={() => router.push(`/admin/products/${product.id}`)}
                              className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition"
                              title="Bearbeiten">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(product.id, product.name)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition"
                              title="Löschen">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Ausgeklappte Details */}
                        {expandedId === product.id && (
                          <div className="px-5 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                              {product.image_url && (
                                <div className="col-span-2">
                                  <img src={product.image_url} alt={product.name}
                                    className="h-24 w-auto rounded-xl object-cover border border-gray-200" />
                                </div>
                              )}
                              {product.description && (
                                <div className="col-span-2">
                                  <span className="font-semibold text-gray-600">Beschreibung:</span> {product.description}
                                </div>
                              )}
                              {product.allergens?.length > 0 && (
                                <div className="col-span-2">
                                  <span className="font-semibold text-gray-600">Allergene:</span> {product.allergens.join(', ')}
                                </div>
                              )}
                              {product.scoop_count > 0 && (
                                <div><span className="font-semibold text-gray-600">Kugeln:</span> {product.scoop_count}</div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-600">Status:</span>{' '}
                                <span className={product.active ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                  {product.active ? 'Aktiv' : 'Inaktiv'}
                                </span>
                              </div>
                            </div>
                            <button onClick={() => router.push(`/admin/products/${product.id}`)}
                              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition">
                              <Edit2 size={13} /> Bearbeiten (inkl. Bild)
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </AdminLayout>
  )
}