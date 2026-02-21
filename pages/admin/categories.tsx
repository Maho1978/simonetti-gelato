import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Edit2, Trash2, Save, X, Tag, Eye, EyeOff } from 'lucide-react'

function CategoriesContent() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', description: '', emoji: '🍦', sort_order: 0 })
  const [editForm, setEditForm] = useState({ name: '', description: '', emoji: '', sort_order: 0 })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (data) setCategories(data)
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      alert('Bitte Namen eingeben!')
      return
    }

    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategory.name,
        description: newCategory.description,
        emoji: newCategory.emoji,
        sort_order: newCategory.sort_order || categories.length
      })

    if (error) {
      alert('Fehler beim Erstellen: ' + error.message)
    } else {
      setNewCategory({ name: '', description: '', emoji: '🍦', sort_order: 0 })
      loadCategories()
    }
  }

  const handleEdit = (category: any) => {
    setEditingId(category.id)
    setEditForm({
      name: category.name,
      description: category.description || '',
      emoji: category.emoji || '🍦',
      sort_order: category.sort_order || 0
    })
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .update({
        name: editForm.name,
        description: editForm.description,
        emoji: editForm.emoji,
        sort_order: editForm.sort_order
      })
      .eq('id', id)

    if (error) {
      alert('Fehler beim Aktualisieren: ' + error.message)
    } else {
      setEditingId(null)
      loadCategories()
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Kategorie "${name}" wirklich löschen?`)) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Fehler beim Löschen: ' + error.message)
    } else {
      loadCategories()
    }
  }

  const toggleVisible = async (id: string, currentVisible: boolean) => {
    const { error } = await supabase
      .from('categories')
      .update({ visible: !currentVisible })
      .eq('id', id)

    if (!error) loadCategories()
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2" style={{ fontStyle: 'italic' }}>
            Kategorien
          </h1>
          <p className="text-gray-600">Strukturiere dein Sortiment</p>
        </div>

        {/* Neue Kategorie - BREIT */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Plus size={24} />
            Neu erstellen
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Emoji - Klein */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">ICON</label>
                <input
                  type="text"
                  placeholder="🍦"
                  value={newCategory.emoji}
                  onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-3xl text-center focus:border-black focus:outline-none"
                  maxLength={2}
                />
              </div>

              {/* Name - Breit */}
              <div className="col-span-7">
                <label className="block text-sm font-semibold mb-2 text-gray-700">NAME</label>
                <input
                  type="text"
                  placeholder="z.B. Eisbecher, Getränke, Kuchen..."
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-black focus:outline-none"
                />
              </div>

              {/* Sortierung - Klein */}
              <div className="col-span-3">
                <label className="block text-sm font-semibold mb-2 text-gray-700">SORTIERUNG</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newCategory.sort_order}
                  onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-black focus:outline-none"
                />
              </div>
            </div>

            {/* Beschreibung - Volle Breite */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">BESCHREIBUNG</label>
              <input
                type="text"
                placeholder="Kurze Info für Kunden..."
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              />
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-4 bg-black text-white rounded-lg hover:bg-gray-900 transition font-bold text-lg uppercase tracking-wider"
            >
              Kategorie anlegen
            </button>
          </div>
        </div>

        {/* Kategorien Liste */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">Lädt...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Tag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Noch keine Kategorien</p>
            </div>
          ) : (
            categories.map((cat: any) => (
              <div key={cat.id} className="bg-white rounded-lg border border-gray-200 p-6">
                {editingId === cat.id ? (
                  // EDIT MODE
                  <div>
                    <div className="grid grid-cols-12 gap-4 mb-4">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={editForm.emoji}
                          onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded text-3xl text-center"
                          maxLength={2}
                        />
                      </div>
                      <div className="col-span-7">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded text-lg"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={editForm.sort_order}
                          onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded text-lg"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded mb-4"
                      placeholder="Beschreibung"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(cat.id)}
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
                    <div className="flex items-center gap-6">
                      <div className="text-4xl">{cat.emoji || '🍦'}</div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display font-bold text-xl" style={{ fontStyle: 'italic' }}>
                            {cat.name}
                          </h3>
                          {cat.visible === false && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                              VERSTECKT
                            </span>
                          )}
                        </div>
                        {cat.description && (
                          <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          POS: {cat.sort_order}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleVisible(cat.id, cat.visible ?? true)}
                        className={`p-2 rounded transition ${
                          cat.visible === false
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={cat.visible === false ? 'Einblenden' : 'Ausblenden'}
                      >
                        {cat.visible === false ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Bearbeiten"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Löschen"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <AdminLayout>
      <CategoriesContent />
    </AdminLayout>
  )
}