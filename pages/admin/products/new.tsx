import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { ArrowLeft, Save } from 'lucide-react'

function NewProductContent() {
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([])
  const [flavors, setFlavors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    emoji: '🍦',
    active: true,
    scoop_count: 0,
    available_flavors: [] as string[]
  })

  useEffect(() => {
    loadCategories()
    loadFlavors()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('name')
      .order('sort_order', { ascending: true })
    
    if (data) setCategories(data.map(c => c.name))
  }

  const loadFlavors = async () => {
    const { data } = await supabase
      .from('products')
      .select('name')
      .eq('category', 'Eis')
    
    if (data) {
      setFlavors(data.map(p => p.name))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category) {
      alert('Bitte Name und Kategorie ausfüllen!')
      return
    }

    setLoading(true)

    const productData: any = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price.replace(',', '.')) || 0,
      category: formData.category,
      icon: formData.emoji,
      active: formData.active,
      available: true
    }

    // Nur für Eisportionen
    if (formData.category === 'Eisportionen' && formData.scoop_count > 0) {
      productData.scoop_count = formData.scoop_count
      productData.available_flavors = formData.available_flavors
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    setLoading(false)

    if (error) {
      alert('Fehler: ' + error.message)
      console.error(error)
      return
    }

    if (data) {
      alert('✅ Produkt erstellt!')
      router.push(`/admin/products/${data.id}`)
    }
  }

  const toggleFlavor = (flavor: string) => {
    if (formData.available_flavors.includes(flavor)) {
      setFormData({
        ...formData,
        available_flavors: formData.available_flavors.filter(f => f !== flavor)
      })
    } else {
      setFormData({
        ...formData,
        available_flavors: [...formData.available_flavors, flavor]
      })
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl">
        
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={20} />
          Zurück
        </button>

        <h1 className="text-3xl font-display font-bold italic mb-8">Neues Produkt</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          
          {/* Name */}
          <div>
            <label className="block text-sm font-bold mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="z.B. 3er Becher"
              required
            />
          </div>

          {/* Beschreibung */}
          <div>
            <label className="block text-sm font-bold mb-2">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Optionale Beschreibung..."
            />
          </div>

          {/* Preis */}
          <div>
            <label className="block text-sm font-bold mb-2">Preis (€) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="6.90"
              required
            />
          </div>

          {/* Kategorie */}
          <div>
            <label className="block text-sm font-bold mb-2">Kategorie *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Kategorie wählen...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-sm font-bold mb-2">Icon/Emoji</label>
            <input
              type="text"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-4xl text-center"
              placeholder="🍦"
              maxLength={4}
            />
          </div>

          {/* EISPORTIONEN SPEZIFISCH */}
          {formData.category === 'Eisportionen' && (
            <>
              {/* Anzahl Kugeln */}
              <div>
                <label className="block text-sm font-bold mb-2">Anzahl Kugeln</label>
                <input
                  type="number"
                  min="0"
                  value={formData.scoop_count}
                  onChange={(e) => setFormData({ ...formData, scoop_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wie viele Sorten kann der Kunde wählen?
                </p>
              </div>

              {/* Verfügbare Sorten */}
              {flavors.length > 0 && (
                <div>
                  <label className="block text-sm font-bold mb-2">Verfügbare Sorten</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {flavors.map(flavor => (
                      <label
                        key={flavor}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.available_flavors.includes(flavor)}
                          onChange={() => toggleFlavor(flavor)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{flavor}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.available_flavors.length} Sorten ausgewählt
                  </p>
                </div>
              )}
            </>
          )}

          {/* Aktiv */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-bold">Produkt aktivieren</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Wird erstellt...' : 'Produkt erstellen'}
            </button>
            
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-bold"
            >
              Abbrechen
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}

export default function NewProductPage() {
  return (
    <AdminLayout>
      <NewProductContent />
    </AdminLayout>
  )
}