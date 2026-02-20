import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Plus, Edit2, Trash2, GripVertical } from 'lucide-react'

interface Category {
  id: string
  name: string
  icon: string
  description: string
  sort_order: number
}

export default function CategoriesAdmin({ session }: { session: Session | null }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [message, setMessage] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    icon: '🍦',
    description: ''
  })

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/admin/categories')
      return
    }
    fetchCategories()
  }, [session])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    
    if (data) setCategories(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editing) {
      // Update
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          icon: formData.icon,
          description: formData.description
        })
        .eq('id', editing.id)
      
      if (error) {
        showMessage('❌ Fehler: ' + error.message)
        return
      }
      
      showMessage('✅ Kategorie aktualisiert!')
    } else {
      // Create
      const { error } = await supabase
        .from('categories')
        .insert({
          name: formData.name,
          icon: formData.icon,
          description: formData.description,
          sort_order: categories.length
        })
      
      if (error) {
        showMessage('❌ Fehler: ' + error.message)
        return
      }
      
      showMessage('✅ Kategorie erstellt!')
    }
    
    setFormData({ name: '', icon: '🍦', description: '' })
    setEditing(null)
    fetchCategories()
  }

  const handleEdit = (category: Category) => {
    setEditing(category)
    setFormData({
      name: category.name,
      icon: category.icon,
      description: category.description
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Kategorie wirklich löschen? Alle Produkte dieser Kategorie bleiben erhalten.')) return
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      showMessage('❌ Fehler: ' + error.message)
      return
    }
    
    showMessage('✅ Kategorie gelöscht!')
    fetchCategories()
  }

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newCategories = [...categories]
    const [moved] = newCategories.splice(index, 1)
    newCategories.splice(newIndex, 0, moved)
    
    // Update sort_order in DB
    const updates = newCategories.map((cat, idx) => 
      supabase.from('categories').update({ sort_order: idx }).eq('id', cat.id)
    )
    
    await Promise.all(updates)
    fetchCategories()
    showMessage('✅ Reihenfolge geändert!')
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
      
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button onClick={() => router.push('/admin')} 
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 transition-all">
          <ArrowLeft size={20} />
          Zurück zum Admin
        </button>

        <h1 className="text-4xl font-display font-bold italic mb-2" style={{ color: '#4a5d54' }}>
          Kategorien verwalten
        </h1>
        <p className="text-gray-500 mb-8">Organisiere deine Produkt-Kategorien</p>

        {message && (
          <div className="mb-6 p-4 rounded-xl text-center font-bold" 
            style={{ 
              backgroundColor: message.includes('✅') ? '#e8f8f0' : '#fde8e8',
              color: message.includes('✅') ? '#27ae60' : '#e74c3c'
            }}>
            {message}
          </div>
        )}

        {/* Formular */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-2xl font-bold mb-5" style={{ color: '#4a5d54' }}>
            {editing ? '✏️ Kategorie bearbeiten' : '➕ Neue Kategorie'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: '#8da399' }}>
                  NAME
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full p-3 rounded-xl border-2 border-gray-200"
                  placeholder="z.B. Frozen Yogurt"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: '#8da399' }}>
                  ICON (Emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  required
                  className="w-full p-3 rounded-xl border-2 border-gray-200 text-center text-3xl"
                  placeholder="🍦"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: '#8da399' }}>
                  BESCHREIBUNG
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200"
                  placeholder="Kurze Beschreibung"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#4a5d54' }}>
                {editing ? '✅ Aktualisieren' : '➕ Hinzufügen'}
              </button>
              
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setFormData({ name: '', icon: '🍦', description: '' })
                  }}
                  className="px-6 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 transition-all">
                  Abbrechen
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Liste */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-5" style={{ color: '#4a5d54' }}>
            Alle Kategorien ({categories.length})
          </h2>
          
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div key={category.id} 
                className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-gray-50"
                style={{ backgroundColor: '#f9f8f4' }}>
                
                {/* Drag Handle */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded transition-all ${
                      index === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white'
                    }`}>
                    ▲
                  </button>
                  <button
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={index === categories.length - 1}
                    className={`p-1 rounded transition-all ${
                      index === categories.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white'
                    }`}>
                    ▼
                  </button>
                </div>
                
                {/* Icon */}
                <div className="text-4xl">{category.icon}</div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="font-bold" style={{ color: '#4a5d54' }}>
                    {category.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {category.description || 'Keine Beschreibung'}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 rounded-lg text-white transition-all hover:opacity-80"
                    style={{ backgroundColor: '#8da399' }}>
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {categories.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <div className="text-6xl mb-4">📂</div>
                <div className="text-lg">Noch keine Kategorien</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}