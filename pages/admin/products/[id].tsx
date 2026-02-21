import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

interface Product {
  id: string; name: string; description: string; price: number; icon: string
  category_id: string; available: boolean; scoop_count: number
  allergens: string[]; ingredients: string
  is_vegan: boolean; is_vegetarian: boolean; is_glutenfree: boolean; is_lactosefree: boolean
}
interface Category { id: string; name: string }
interface Variant { id: string; name: string; price: number; available: boolean; sort_order: number }
interface Extra { id: string; name: string; price: number; available: boolean; sort_order: number }

const ALLERGEN_LIST = [
  { key: 'gluten', label: '🌾 Gluten' },
  { key: 'milch', label: '🥛 Milch / Laktose' },
  { key: 'eier', label: '🥚 Eier' },
  { key: 'nüsse', label: '🥜 Nüsse' },
  { key: 'erdnüsse', label: '🥜 Erdnüsse' },
  { key: 'soja', label: '🫘 Soja' },
  { key: 'sesam', label: '🌿 Sesam' },
  { key: 'fisch', label: '🐟 Fisch' },
  { key: 'sellerie', label: '🥬 Sellerie' },
  { key: 'senf', label: '🌭 Senf' },
  { key: 'sulfite', label: '🍷 Sulfite' },
]

export default function ProductDetail({ session }: { session: Session | null }) {
  const router = useRouter()
  const { id } = router.query

  const [categories, setCategories] = useState<Category[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Edit form
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editIcon, setEditIcon] = useState('🍦')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editAvailable, setEditAvailable] = useState(true)
  const [editScoopCount, setEditScoopCount] = useState(0)
  const [editIngredients, setEditIngredients] = useState('')
  const [editAllergens, setEditAllergens] = useState<string[]>([])
  const [editIsVegan, setEditIsVegan] = useState(false)
  const [editIsVegetarian, setEditIsVegetarian] = useState(true)
  const [editIsGlutenfree, setEditIsGlutenfree] = useState(false)
  const [editIsLactosefree, setEditIsLactosefree] = useState(false)

  // Variant Form
  const [variantName, setVariantName] = useState('')
  const [variantPrice, setVariantPrice] = useState('')

  // Extra Form
  const [extraName, setExtraName] = useState('')
  const [extraPrice, setExtraPrice] = useState('')

  useEffect(() => {
    if (!id) return
    if (id === 'new') { router.replace('/admin/products/new'); return }
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: cats } = await supabase.from('categories').select('*').order('name')
    setCategories(cats || [])

    const { data: prod, error } = await supabase.from('products').select('*').eq('id', id).single()
    if (error || !prod) { showMessage('❌ Produkt nicht gefunden'); setLoading(false); return }

    setEditName(prod.name || '')
    setEditDescription(prod.description || '')
    setEditPrice(prod.price?.toString() || '')
    setEditIcon(prod.icon || '🍦')
    setEditCategoryId(prod.category_id || '')
    setEditAvailable(prod.available ?? true)
    setEditScoopCount(prod.scoop_count || 0)
    setEditIngredients(prod.ingredients || '')
    setEditAllergens(prod.allergens || [])
    setEditIsVegan(prod.is_vegan || false)
    setEditIsVegetarian(prod.is_vegetarian ?? true)
    setEditIsGlutenfree(prod.is_glutenfree || false)
    setEditIsLactosefree(prod.is_lactosefree || false)

    const { data: vars } = await supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order')
    setVariants(vars || [])

    const { data: exs } = await supabase.from('product_extras').select('*').eq('product_id', id).order('sort_order')
    setExtras(exs || [])

    setLoading(false)
  }

  const toggleAllergen = (key: string) => {
    setEditAllergens(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    )
  }

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('products').update({
      name: editName,
      description: editDescription,
      price: parseFloat(editPrice.replace(',', '.')),
      icon: editIcon,
      category_id: editCategoryId || null,
      available: editAvailable,
      scoop_count: editScoopCount,
      ingredients: editIngredients,
      allergens: editAllergens,
      is_vegan: editIsVegan,
      is_vegetarian: editIsVegetarian,
      is_glutenfree: editIsGlutenfree,
      is_lactosefree: editIsLactosefree,
    }).eq('id', id)

    if (error) { showMessage('❌ Fehler: ' + error.message); return }
    showMessage('✅ Produkt gespeichert!')
  }

  const addVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('product_variants').insert({
      product_id: id, name: variantName,
      price: parseFloat(variantPrice.replace(',', '.')),
      sort_order: variants.length, available: true
    }).select().single()
    if (error) { showMessage('❌ Fehler: ' + error.message); return }
    if (data) { setVariants([...variants, data]); setVariantName(''); setVariantPrice(''); showMessage('✅ Variante hinzugefügt!') }
  }

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Variante löschen?')) return
    const { error } = await supabase.from('product_variants').delete().eq('id', variantId)
    if (error) { showMessage('❌ Fehler beim Löschen'); return }
    setVariants(variants.filter(v => v.id !== variantId))
    showMessage('✅ Variante gelöscht!')
  }

  const addExtra = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('product_extras').insert({
      product_id: id, name: extraName,
      price: parseFloat(extraPrice.replace(',', '.')),
      sort_order: extras.length, available: true
    }).select().single()
    if (error) { showMessage('❌ Fehler: ' + error.message); return }
    if (data) { setExtras([...extras, data]); setExtraName(''); setExtraPrice(''); showMessage('✅ Extra hinzugefügt!') }
  }

  const deleteExtra = async (extraId: string) => {
    if (!confirm('Extra löschen?')) return
    const { error } = await supabase.from('product_extras').delete().eq('id', extraId)
    if (error) { showMessage('❌ Fehler beim Löschen'); return }
    setExtras(extras.filter(e => e.id !== extraId))
    showMessage('✅ Extra gelöscht!')
  }

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-6xl animate-pulse">🍦</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} /> Zurück
        </button>

        <h1 className="text-4xl font-bold italic mb-8" style={{ color: '#4a5d54' }}>
          {editIcon} Produkt bearbeiten
        </h1>

        {message && (
          <div className="mb-6 p-4 rounded-xl text-center font-bold"
            style={{ backgroundColor: message.includes('✅') ? '#e8f8f0' : '#fde8e8', color: message.includes('✅') ? '#27ae60' : '#e74c3c' }}>
            {message}
          </div>
        )}

        {/* BASIS INFO */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Basis-Informationen</h2>
          <form onSubmit={saveProduct} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Name *</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-green-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Icon / Emoji</label>
                <input type="text" value={editIcon} onChange={e => setEditIcon(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-green-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Preis (€) *</label>
                <input type="text" value={editPrice} onChange={e => setEditPrice(e.target.value)} required
                  placeholder="z.B. 3,50"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-green-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Kategorie</label>
                <select value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-green-400 outline-none">
                  <option value="">-- Keine Kategorie --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Beschreibung</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-green-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Anzahl Kugeln (0 = kein Eis)</label>
                <input type="number" min="0" max="10" value={editScoopCount} onChange={e => setEditScoopCount(parseInt(e.target.value))}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-green-400 outline-none" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="available" checked={editAvailable} onChange={e => setEditAvailable(e.target.checked)} className="w-5 h-5" />
                <label htmlFor="available" className="font-semibold text-gray-700">Produkt aktiv / sichtbar</label>
              </div>
            </div>

            {/* ZUTATEN */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Zutaten</label>
              <textarea value={editIngredients} onChange={e => setEditIngredients(e.target.value)} rows={2}
                placeholder="z.B. Milch, Sahne, Zucker, Vanille..."
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-green-400 outline-none" />
            </div>

            {/* ALLERGENE */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Allergene</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ALLERGEN_LIST.map(a => (
                  <label key={a.key} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border-2 transition-all ${editAllergens.includes(a.key) ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={editAllergens.includes(a.key)} onChange={() => toggleAllergen(a.key)} className="w-4 h-4" />
                    <span className="text-sm">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* DIÄT-LABELS */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Diät-Labels</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { state: editIsVegan, setter: setEditIsVegan, label: '🌱 Vegan' },
                  { state: editIsVegetarian, setter: setEditIsVegetarian, label: '🥗 Vegetarisch' },
                  { state: editIsGlutenfree, setter: setEditIsGlutenfree, label: '🌾 Glutenfrei' },
                  { state: editIsLactosefree, setter: setEditIsLactosefree, label: '🥛 Laktosefrei' },
                ].map(item => (
                  <label key={item.label} className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer border-2 transition-all ${item.state ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={item.state} onChange={e => item.setter(e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: '#4a5d54' }}>
              <Save size={18} /> Änderungen speichern
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* VARIANTEN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Varianten</h2>
            <p className="text-sm text-gray-500 mb-4">z.B. "2 Kugeln", "3 Kugeln"</p>
            <form onSubmit={addVariant} className="space-y-3 mb-6">
              <input type="text" value={variantName} onChange={e => setVariantName(e.target.value)}
                placeholder="Name (z.B. 2 Kugeln)" required className="w-full p-3 rounded-xl border-2 border-gray-200" />
              <input type="text" value={variantPrice} onChange={e => setVariantPrice(e.target.value)}
                placeholder="Preis (€) z.B. 3,50" required className="w-full p-3 rounded-xl border-2 border-gray-200" />
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white hover:opacity-90"
                style={{ backgroundColor: '#4a5d54' }}>
                <Plus size={16} className="inline mr-1" /> Variante hinzufügen
              </button>
            </form>
            <div className="space-y-2">
              {variants.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#f9f8f4' }}>
                  <div>
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-sm text-gray-500">{v.price.toFixed(2)} €</div>
                  </div>
                  <button onClick={() => deleteVariant(v.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {variants.length === 0 && <div className="text-center py-8 text-gray-400">Keine Varianten</div>}
            </div>
          </div>

          {/* EXTRAS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Extras</h2>
            <p className="text-sm text-gray-500 mb-4">z.B. "Sahne +1,50€"</p>
            <form onSubmit={addExtra} className="space-y-3 mb-6">
              <input type="text" value={extraName} onChange={e => setExtraName(e.target.value)}
                placeholder="Name (z.B. Sahne)" required className="w-full p-3 rounded-xl border-2 border-gray-200" />
              <input type="text" value={extraPrice} onChange={e => setExtraPrice(e.target.value)}
                placeholder="Aufpreis (€) z.B. 1,50" required className="w-full p-3 rounded-xl border-2 border-gray-200" />
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white hover:opacity-90"
                style={{ backgroundColor: '#4a5d54' }}>
                <Plus size={16} className="inline mr-1" /> Extra hinzufügen
              </button>
            </form>
            <div className="space-y-2">
              {extras.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#f9f8f4' }}>
                  <div>
                    <div className="font-semibold">{e.name}</div>
                    <div className="text-sm text-gray-500">+{e.price.toFixed(2)} €</div>
                  </div>
                  <button onClick={() => deleteExtra(e.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {extras.length === 0 && <div className="text-center py-8 text-gray-400">Keine Extras</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}