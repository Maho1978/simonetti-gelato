import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { ArrowLeft, Plus, Trash2, Save, Upload, X, Loader } from 'lucide-react'

interface Category { id: string; name: string; icon: string; visible: boolean }
interface Variant   { id: string; name: string; price: number; sort_order: number }
interface Extra     { id: string; name: string; price: number; sort_order: number }

const ALLERGEN_LIST = [
  { key: 'gluten',   label: '🌾 Gluten'         },
  { key: 'milch',    label: '🥛 Milch / Laktose' },
  { key: 'eier',     label: '🥚 Eier'            },
  { key: 'nüsse',    label: '🥜 Nüsse'           },
  { key: 'erdnüsse', label: '🥜 Erdnüsse'        },
  { key: 'soja',     label: '🫘 Soja'            },
  { key: 'sesam',    label: '🌿 Sesam'           },
  { key: 'fisch',    label: '🐟 Fisch'           },
  { key: 'sellerie', label: '🥬 Sellerie'        },
  { key: 'senf',     label: '🌭 Senf'            },
  { key: 'sulfite',  label: '🍷 Sulfite'         },
]

export default function ProductDetail() {
  const router  = useRouter()
  const { id }  = router.query
  const isNew   = id === 'new'
  const fileRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [variants, setVariants]     = useState<Variant[]>([])
  const [extras, setExtras]         = useState<Extra[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [toast, setToast]           = useState('')

  // ── Formfelder ─────────────────────────────────────────────
  const [name, setName]                   = useState('')
  const [description, setDescription]     = useState('')
  const [price, setPrice]                 = useState('')
  const [icon, setIcon]                   = useState('🍦')
  const [category, setCategory]           = useState('')
  const [active, setActive]               = useState(true)
  const [featured, setFeatured]           = useState(false)
  const [scoopCount, setScoopCount]       = useState(0)
  const [ingredients, setIngredients]     = useState('')
  const [allergens, setAllergens]         = useState<string[]>([])
  const [isVegan, setIsVegan]             = useState(false)
  const [isVegetarian, setIsVegetarian]   = useState(true)
  const [isGlutenfree, setIsGlutenfree]   = useState(false)
  const [isLactosefree, setIsLactosefree] = useState(false)
  const [imageUrl, setImageUrl]           = useState('')

  // Varianten/Extras Formulare
  const [variantName, setVariantName]   = useState('')
  const [variantPrice, setVariantPrice] = useState('')
  const [extraName, setExtraName]       = useState('')
  const [extraPrice, setExtraPrice]     = useState('')

  useEffect(() => {
    if (!id) return
    loadCategories()
    if (!isNew) loadProduct()
    else setLoading(false)
  }, [id])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
  }

  const loadProduct = async () => {
    const { data: prod, error } = await supabase
      .from('products').select('*').eq('id', id).single()
    if (error || !prod) { showToast('❌ Produkt nicht gefunden'); setLoading(false); return }

    setName(prod.name || '')
    setDescription(prod.description || '')
    setPrice(prod.price?.toString() || '')
    setIcon(prod.icon || '🍦')
    setCategory(prod.category || '')
    setActive(prod.active ?? true)
    setFeatured(prod.featured || false)
    setScoopCount(prod.scoop_count || 0)
    setIngredients(prod.ingredients || '')
    setAllergens(prod.allergens || [])
    setIsVegan(prod.is_vegan || false)
    setIsVegetarian(prod.is_vegetarian ?? true)
    setIsGlutenfree(prod.is_glutenfree || false)
    setIsLactosefree(prod.is_lactosefree || false)
    setImageUrl(prod.image_url || '')

    const [varsRes, exsRes] = await Promise.all([
      supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
      supabase.from('product_extras').select('*').eq('product_id', id).order('sort_order'),
    ])
    setVariants(varsRes.data || [])
    setExtras(exsRes.data || [])
    setLoading(false)
  }

  // ── Bild hochladen ─────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('❌ Nur Bilder erlaubt (JPG, PNG, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ Bild zu groß! Maximal 5 MB')
      return
    }

    setUploading(true)
    const ext      = file.name.split('.').pop()
    const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      showToast('❌ Upload fehlgeschlagen: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    setImageUrl(urlData.publicUrl)
    setUploading(false)
    showToast('✅ Bild hochgeladen!')
  }

  const handleRemoveImage = async () => {
    if (!imageUrl) return
    // Pfad aus URL extrahieren und löschen
    try {
      const parts   = imageUrl.split('/product-images/')
      const filePath = parts[1]
      if (filePath) {
        await supabase.storage.from('product-images').remove([filePath])
      }
    } catch (_) {}
    setImageUrl('')
    showToast('🗑️ Bild entfernt')
  }

  // ── Produkt speichern ──────────────────────────────────────
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name, description,
      price:          parseFloat(price.replace(',', '.')),
      icon, category, active, featured,
      scoop_count:    scoopCount,
      ingredients,    allergens,
      is_vegan:       isVegan,
      is_vegetarian:  isVegetarian,
      is_glutenfree:  isGlutenfree,
      is_lactosefree: isLactosefree,
      image_url:      imageUrl,
    }

    if (isNew) {
      const { error } = await supabase.from('products').insert(payload)
      if (error) { showToast('❌ ' + error.message); setSaving(false); return }
      showToast('✅ Produkt erstellt!')
      setTimeout(() => router.push('/admin/products'), 1000)
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      if (error) { showToast('❌ ' + error.message); setSaving(false); return }
      showToast('✅ Gespeichert!')
    }
    setSaving(false)
  }

  const toggleAllergen = (key: string) =>
    setAllergens(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key])

  // ── Varianten ──────────────────────────────────────────────
  const addVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('product_variants').insert({
      product_id: id, name: variantName,
      price: parseFloat(variantPrice.replace(',', '.')),
      sort_order: variants.length, available: true
    }).select().single()
    if (error) { showToast('❌ ' + error.message); return }
    if (data) { setVariants([...variants, data]); setVariantName(''); setVariantPrice(''); showToast('✅ Variante hinzugefügt!') }
  }

  const deleteVariant = async (vid: string) => {
    if (!confirm('Variante löschen?')) return
    await supabase.from('product_variants').delete().eq('id', vid)
    setVariants(variants.filter(v => v.id !== vid))
    showToast('✅ Variante gelöscht!')
  }

  // ── Extras ─────────────────────────────────────────────────
  const addExtra = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('product_extras').insert({
      product_id: id, name: extraName,
      price: parseFloat(extraPrice.replace(',', '.')),
      sort_order: extras.length, available: true
    }).select().single()
    if (error) { showToast('❌ ' + error.message); return }
    if (data) { setExtras([...extras, data]); setExtraName(''); setExtraPrice(''); showToast('✅ Extra hinzugefügt!') }
  }

  const deleteExtra = async (eid: string) => {
    if (!confirm('Extra löschen?')) return
    await supabase.from('product_extras').delete().eq('id', eid)
    setExtras(extras.filter(e => e.id !== eid))
    showToast('✅ Extra gelöscht!')
  }

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-5xl animate-pulse">🍦</div>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl font-semibold text-sm">
          {toast}
        </div>
      )}

      <div className="p-6 max-w-3xl">

        {/* Header */}
        <button onClick={() => router.push('/admin/products')}
          className="flex items-center gap-2 mb-6 text-gray-400 hover:text-gray-900 transition text-sm font-semibold">
          <ArrowLeft size={18} /> Zurück zur Liste
        </button>

        <h1 className="text-2xl font-bold mb-6">
          {icon} {isNew ? 'Neues Produkt' : name}
        </h1>

        {/* ── BASIS-INFO FORM ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Basis-Informationen</h2>
          <form onSubmit={saveProduct} className="space-y-5">

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Icon / Emoji</label>
                <input type="text" value={icon} onChange={e => setIcon(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Preis (€) *</label>
                <input type="text" value={price} onChange={e => setPrice(e.target.value)} required
                  placeholder="z.B. 3,50"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Kategorie</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white">
                  <option value="">-- Keine Kategorie --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.icon} {c.name}{!c.visible ? ' (nicht sichtbar)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Beschreibung</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Anzahl Kugeln (0 = kein Eis)</label>
                <input type="number" min="0" max="10" value={scoopCount}
                  onChange={e => setScoopCount(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-5 h-5 rounded" />
                  <span className="font-semibold text-gray-700">Produkt aktiv / sichtbar</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="w-5 h-5 rounded" />
                  <span className="font-semibold text-gray-700">⭐ Empfohlen / Featured</span>
                </label>
              </div>
            </div>

            {/* ── BILD UPLOAD ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Produktbild
              </label>

              {imageUrl ? (
                /* Bild vorhanden → Vorschau + Buttons */
                <div className="flex items-start gap-4">
                  <img src={imageUrl} alt="Produktbild"
                    className="h-36 w-36 rounded-xl object-cover border-2 border-gray-200 flex-shrink-0" />
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-400">Bild hochgeladen ✅</p>
                    <button type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:border-black transition">
                      <Upload size={15} /> Ersetzen
                    </button>
                    <button type="button" onClick={handleRemoveImage}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition">
                      <X size={15} /> Entfernen
                    </button>
                  </div>
                </div>
              ) : (
                /* Kein Bild → Upload-Bereich */
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-black hover:bg-gray-50 transition group">
                  {uploading ? (
                    <>
                      <Loader size={28} className="text-gray-400 animate-spin mb-2" />
                      <span className="text-sm text-gray-400">Wird hochgeladen...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-gray-300 group-hover:text-gray-600 mb-2 transition" />
                      <span className="text-sm font-semibold text-gray-400 group-hover:text-gray-700 transition">
                        Bild auswählen oder hierher ziehen
                      </span>
                      <span className="text-xs text-gray-300 mt-1">JPG, PNG, WebP · max. 5 MB</span>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}

              {/* Versteckter Input für "Ersetzen"-Button */}
              {imageUrl && (
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              )}
            </div>

            {/* ── ZUTATEN ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Zutaten</label>
              <textarea value={ingredients} onChange={e => setIngredients(e.target.value)} rows={2}
                placeholder="z.B. Milch, Sahne, Zucker, Vanille..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none" />
            </div>

            {/* ── ALLERGENE ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Allergene</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ALLERGEN_LIST.map(a => (
                  <label key={a.key}
                    className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer border-2 transition ${allergens.includes(a.key) ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={allergens.includes(a.key)}
                      onChange={() => toggleAllergen(a.key)} className="w-4 h-4" />
                    <span className="text-sm">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── DIÄT-LABELS ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Diät-Labels</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { state: isVegan,       setter: setIsVegan,       label: '🌱 Vegan'       },
                  { state: isVegetarian,  setter: setIsVegetarian,  label: '🥗 Vegetarisch' },
                  { state: isGlutenfree,  setter: setIsGlutenfree,  label: '🌾 Glutenfrei'  },
                  { state: isLactosefree, setter: setIsLactosefree, label: '🥛 Laktosefrei' },
                ].map(item => (
                  <label key={item.label}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer border-2 transition ${item.state ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={item.state}
                      onChange={e => item.setter(e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving || uploading}
              className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition disabled:opacity-50">
              <Save size={18} />
              {saving ? 'Speichert...' : isNew ? 'Produkt erstellen' : 'Änderungen speichern'}
            </button>
          </form>
        </div>

        {/* ── VARIANTEN & EXTRAS (nur bei bestehenden Produkten) ── */}
        {!isNew && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* Varianten */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-lg mb-1">Varianten</h2>
              <p className="text-xs text-gray-400 mb-4">z.B. „2 Kugeln", „3 Kugeln"</p>
              <form onSubmit={addVariant} className="space-y-2 mb-4">
                <input type="text" value={variantName} onChange={e => setVariantName(e.target.value)}
                  placeholder="Name (z.B. 2 Kugeln)" required
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none" />
                <input type="text" value={variantPrice} onChange={e => setVariantPrice(e.target.value)}
                  placeholder="Preis z.B. 3,50" required
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none" />
                <button type="submit"
                  className="w-full py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition">
                  <Plus size={14} className="inline mr-1" /> Hinzufügen
                </button>
              </form>
              <div className="space-y-2">
                {variants.length === 0 && (
                  <div className="text-center py-6 text-gray-300 text-sm">Keine Varianten</div>
                )}
                {variants.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-sm">{v.name}</div>
                      <div className="text-xs text-gray-400">{v.price.toFixed(2)} €</div>
                    </div>
                    <button onClick={() => deleteVariant(v.id)}
                      className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-lg mb-1">Extras</h2>
              <p className="text-xs text-gray-400 mb-4">z.B. „Sahne +1,50€"</p>
              <form onSubmit={addExtra} className="space-y-2 mb-4">
                <input type="text" value={extraName} onChange={e => setExtraName(e.target.value)}
                  placeholder="Name (z.B. Sahne)" required
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none" />
                <input type="text" value={extraPrice} onChange={e => setExtraPrice(e.target.value)}
                  placeholder="Aufpreis z.B. 1,50" required
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none" />
                <button type="submit"
                  className="w-full py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition">
                  <Plus size={14} className="inline mr-1" /> Hinzufügen
                </button>
              </form>
              <div className="space-y-2">
                {extras.length === 0 && (
                  <div className="text-center py-6 text-gray-300 text-sm">Keine Extras</div>
                )}
                {extras.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-sm">{e.name}</div>
                      <div className="text-xs text-gray-400">+{e.price.toFixed(2)} €</div>
                    </div>
                    <button onClick={() => deleteExtra(e.id)}
                      className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  )
}