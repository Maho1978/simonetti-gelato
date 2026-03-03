import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Edit2, Trash2, Save, X, Globe, Tag, Package } from 'lucide-react'

interface Extra {
  id: string
  name: string
  price: number
  category: string
  active: boolean
  scope: 'global' | 'category' | 'product'
  category_names: string[]
  product_ids: string[]
}

const SCOPE_OPTIONS = [
  { value: 'global',   label: 'Alle Produkte',        icon: Globe,   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-300'  },
  { value: 'category', label: 'Nur best. Kategorien', icon: Tag,     color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300' },
  { value: 'product',  label: 'Nur best. Produkte',   icon: Package, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-300'  },
]

function ExtrasContent() {
  const [extras,      setExtras]      = useState<Extra[]>([])
  const [categories,  setCategories]  = useState<string[]>([])
  const [products,    setProducts]    = useState<any[]>([])
  const [productCats, setProductCats] = useState<string[]>([])
  const [loading,     setLoading]     = useState(true)
  const [editingId,   setEditingId]   = useState<string | null>(null)

  const emptyForm = { name: '', price: 0, category: '', active: true, scope: 'global' as Extra['scope'], category_names: [] as string[], product_ids: [] as string[] }
  const [newExtra,  setNewExtra]  = useState({ ...emptyForm })
  const [editForm,  setEditForm]  = useState({ ...emptyForm })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [extrasRes, catsRes, prodsRes] = await Promise.all([
      supabase.from('extras').select('*').order('category').order('name'),
      supabase.from('categories').select('name').order('sort_order'),
      supabase.from('products').select('id, name, category').eq('active', true).order('category').order('name'),
    ])
    if (extrasRes.data) setExtras(extrasRes.data)
    if (catsRes.data)   setCategories(catsRes.data.map((c: any) => c.name))
    if (prodsRes.data) {
      setProducts(prodsRes.data)
      setProductCats([...new Set(prodsRes.data.map((p: any) => p.category).filter(Boolean))] as string[])
    }
    setLoading(false)
  }

  const validate = (form: typeof emptyForm) => {
    if (!form.name.trim()) { alert('Bitte Name eingeben!'); return false }
    if (form.scope === 'category' && form.category_names.length === 0) { alert('Bitte mindestens eine Kategorie wählen!'); return false }
    if (form.scope === 'product'  && form.product_ids.length === 0)    { alert('Bitte mindestens ein Produkt wählen!'); return false }
    return true
  }

  const buildPayload = (form: typeof emptyForm) => ({
    name:           form.name,
    price:          form.price,
    category:       form.category || '',
    active:         form.active,
    scope:          form.scope,
    category_names: form.scope === 'category' ? form.category_names : [],
    product_ids:    form.scope === 'product'  ? form.product_ids   : [],
  })

  const handleCreate = async () => {
    if (!validate(newExtra)) return
    const { error } = await supabase.from('extras').insert(buildPayload(newExtra))
    if (error) { alert('Fehler: ' + error.message); return }
    setNewExtra({ ...emptyForm })
    loadAll()
  }

  const handleEdit = (extra: Extra) => {
    setEditingId(extra.id)
    setEditForm({
      name: extra.name, price: extra.price, category: extra.category || '',
      active: extra.active, scope: extra.scope || 'global',
      category_names: extra.category_names || [], product_ids: extra.product_ids || [],
    })
  }

  const handleUpdate = async (id: string) => {
    if (!validate(editForm)) return
    const { error } = await supabase.from('extras').update(buildPayload(editForm)).eq('id', id)
    if (error) { alert('Fehler: ' + error.message); return }
    setEditingId(null)
    loadAll()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Extra "${name}" wirklich löschen?`)) return
    const { error } = await supabase.from('extras').delete().eq('id', id)
    if (error) alert('Fehler: ' + error.message)
    else loadAll()
  }

  const getScopeLabel = (extra: Extra) => {
    if (!extra.scope || extra.scope === 'global') return '🌐 Alle Produkte'
    if (extra.scope === 'category') return `📂 ${(extra.category_names || []).join(', ') || '–'}`
    const names = (extra.product_ids || []).map(id => products.find((p: any) => p.id === id)?.name).filter(Boolean)
    return `📦 ${names.join(', ') || '–'}`
  }

  const toggleCat = (form: any, setForm: any, cat: string) =>
    setForm({ ...form, category_names: form.category_names.includes(cat) ? form.category_names.filter((c: string) => c !== cat) : [...form.category_names, cat] })

  const toggleProd = (form: any, setForm: any, id: string) =>
    setForm({ ...form, product_ids: form.product_ids.includes(id) ? form.product_ids.filter((i: string) => i !== id) : [...form.product_ids, id] })

  const ScopeSelector = ({ form, setForm }: { form: any; setForm: any }) => (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-semibold text-gray-600">Sichtbar bei:</p>
      <div className="flex gap-2 flex-wrap">
        {SCOPE_OPTIONS.map(opt => {
          const Icon = opt.icon
          const active = form.scope === opt.value
          return (
            <button key={opt.value} type="button"
              onClick={() => setForm({ ...form, scope: opt.value })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-semibold transition ${active ? `${opt.border} ${opt.bg} ${opt.color}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
              <Icon size={14} />{opt.label}
            </button>
          )
        })}
      </div>

      {form.scope === 'category' && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Kategorien auswählen:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat} type="button" onClick={() => toggleCat(form, setForm, cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition ${form.category_names.includes(cat) ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                {cat}
              </button>
            ))}
          </div>
          {form.category_names.length === 0 && <p className="text-xs text-orange-500 mt-1">⚠️ Mindestens eine Kategorie wählen</p>}
        </div>
      )}

      {form.scope === 'product' && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Produkte auswählen:</p>
          <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-2 space-y-1">
            {productCats.map(cat => (
              <div key={cat}>
                <div className="text-xs font-bold text-gray-300 uppercase tracking-wide px-2 py-1">{cat}</div>
                {products.filter((p: any) => p.category === cat).map((prod: any) => (
                  <button key={prod.id} type="button" onClick={() => toggleProd(form, setForm, prod.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${form.product_ids.includes(prod.id) ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 text-xs ${form.product_ids.includes(prod.id) ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                      {form.product_ids.includes(prod.id) ? '✓' : ''}
                    </span>
                    {prod.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {form.product_ids.length === 0 && <p className="text-xs text-orange-500 mt-1">⚠️ Mindestens ein Produkt wählen</p>}
          {form.product_ids.length > 0 && <p className="text-xs text-green-600 mt-1">✓ {form.product_ids.length} Produkt{form.product_ids.length > 1 ? 'e' : ''} ausgewählt</p>}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-8">
      <div className="max-w-5xl">

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Extras</h1>
          <p className="text-gray-600">Toppings, Soßen und Zusätze – gezielt pro Produkt oder Kategorie steuerbar</p>
        </div>

        {/* Neues Extra */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20} /> Neues Extra</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <input type="text" placeholder="Name *" value={newExtra.name}
              onChange={e => setNewExtra({ ...newExtra, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="number" step="0.01" placeholder="Preis (0 = kostenlos)" value={newExtra.price || ''}
              onChange={e => setNewExtra({ ...newExtra, price: parseFloat(e.target.value.replace(',', '.')) || 0 })}
              className="px-4 py-2 border border-gray-300 rounded-lg" />
            <select value={newExtra.category} onChange={e => setNewExtra({ ...newExtra, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Gruppe (optional)</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <input type="checkbox" checked={newExtra.active}
                onChange={e => setNewExtra({ ...newExtra, active: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Aktiv</span>
            </label>
          </div>
          <ScopeSelector form={newExtra} setForm={setNewExtra} />
          <button onClick={handleCreate}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition font-semibold">
            Erstellen
          </button>
        </div>

        {/* Liste */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">Lädt...</div>
          ) : extras.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-500">Noch keine Extras</p></div>
          ) : (
            Object.entries(
              extras.reduce((acc, extra) => {
                const key = extra.category || 'Ohne Gruppe'
                if (!acc[key]) acc[key] = []
                acc[key].push(extra)
                return acc
              }, {} as Record<string, Extra[]>)
            ).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-bold mb-3 px-2">{category}</h3>
                <div className="space-y-2">
                  {items.map(extra => (
                    <div key={extra.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      {editingId === extra.id ? (
                        <div>
                          <div className="grid md:grid-cols-4 gap-3 mb-3">
                            <input type="text" value={editForm.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded" />
                            <input type="number" step="0.01" value={editForm.price || ''}
                              onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                              className="px-3 py-2 border border-gray-300 rounded" />
                            <select value={editForm.category}
                              onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded">
                              <option value="">Ohne Gruppe</option>
                              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded">
                              <input type="checkbox" checked={editForm.active}
                                onChange={e => setEditForm({ ...editForm, active: e.target.checked })} className="w-4 h-4" />
                              <span className="text-sm">Aktiv</span>
                            </label>
                          </div>
                          <ScopeSelector form={editForm} setForm={setEditForm} />
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleUpdate(extra.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2">
                              <Save size={16} /> Speichern
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition flex items-center gap-2">
                              <X size={16} /> Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h4 className="font-bold">{extra.name}</h4>
                              <p className="text-sm text-gray-600">
                                {extra.price > 0 ? `${extra.price.toFixed(2)} €` : 'kostenlos'}
                                <span className="ml-2 text-xs text-gray-400">{getScopeLabel(extra)}</span>
                              </p>
                            </div>
                            {!extra.active && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Inaktiv</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(extra)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(extra.id, extra.name)} className="p-2 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function ExtrasPage() {
  return (
    <AdminLayout>
      <ExtrasContent />
    </AdminLayout>
  )
}