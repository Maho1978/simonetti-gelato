import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

interface Extra {
  id: string
  name: string
  price: number
  category: string
  active: boolean
}

function ExtrasContent() {
  const [extras, setExtras] = useState<Extra[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [newExtra, setNewExtra] = useState({
    name: '',
    price: 0,
    category: '',
    active: true
  })
  
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    category: '',
    active: true
  })

  useEffect(() => {
    loadExtras()
    loadCategories()
  }, [])

  const loadExtras = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('extras')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    
    if (data) setExtras(data)
    setLoading(false)
  }

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('name')
      .order('sort_order', { ascending: true })
    
    if (data) {
      setCategories(data.map(c => c.name))
    }
  }

  const handleCreate = async () => {
    if (!newExtra.name.trim() || !newExtra.category) {
      alert('Bitte Name und Kategorie eingeben!')
      return
    }

    const { error } = await supabase
      .from('extras')
      .insert({
        name: newExtra.name,
        price: newExtra.price,
        category: newExtra.category,
        active: newExtra.active
      })

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      setNewExtra({ name: '', price: 0, category: '', active: true })
      loadExtras()
    }
  }

  const handleEdit = (extra: Extra) => {
    setEditingId(extra.id)
    setEditForm({
      name: extra.name,
      price: extra.price,
      category: extra.category,
      active: extra.active
    })
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('extras')
      .update({
        name: editForm.name,
        price: editForm.price,
        category: editForm.category,
        active: editForm.active
      })
      .eq('id', id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      setEditingId(null)
      loadExtras()
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Extra "${name}" wirklich löschen?`)) return

    const { error } = await supabase
      .from('extras')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      loadExtras()
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Extras</h1>
          <p className="text-gray-600">Verwalte Toppings, Saucen und Zusätze</p>
        </div>

        {/* Neues Extra */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus size={20} />
            Neues Extra
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Name *"
              value={newExtra.name}
              onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            
            <input
              type="number"
              step="0.01"
              placeholder="Preis *"
              value={newExtra.price}
              onChange={(e) => setNewExtra({ ...newExtra, price: parseFloat(e.target.value) })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            
            <select
              value={newExtra.category}
              onChange={(e) => setNewExtra({ ...newExtra, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Kategorie wählen *</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <input
                type="checkbox"
                checked={newExtra.active}
                onChange={(e) => setNewExtra({ ...newExtra, active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Aktiv</span>
            </label>
          </div>

          <button
            onClick={handleCreate}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition font-semibold"
          >
            Erstellen
          </button>
        </div>

        {/* Extras Liste */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">Lädt...</div>
          ) : extras.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Noch keine Extras</p>
            </div>
          ) : (
            // Gruppiert nach Kategorie
            Object.entries(
              extras.reduce((acc, extra) => {
                if (!acc[extra.category]) acc[extra.category] = []
                acc[extra.category].push(extra)
                return acc
              }, {} as Record<string, Extra[]>)
            ).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-bold mb-3 px-2">{category}</h3>
                <div className="space-y-2">
                  {items.map((extra) => (
                    <div key={extra.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      {editingId === extra.id ? (
                        // EDIT MODE
                        <div>
                          <div className="grid md:grid-cols-4 gap-3 mb-3">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                              className="px-3 py-2 border border-gray-300 rounded"
                            />
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded">
                              <input
                                type="checkbox"
                                checked={editForm.active}
                                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Aktiv</span>
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(extra.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
                            >
                              <Save size={16} />
                              Speichern
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition flex items-center gap-2"
                            >
                              <X size={16} />
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        // VIEW MODE
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h4 className="font-bold">{extra.name}</h4>
                              <p className="text-sm text-gray-600">{extra.price.toFixed(2)} €</p>
                            </div>
                            {!extra.active && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                Inaktiv
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(extra)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(extra.id, extra.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 size={18} />
                            </button>
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