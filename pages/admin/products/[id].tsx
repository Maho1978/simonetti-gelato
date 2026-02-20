import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface Product {
  id: string; name: string; price: number; icon: string
}
interface Variant {
  id: string; name: string; price: number; available: boolean; sort_order: number
}
interface Extra {
  id: string; name: string; price: number; available: boolean; sort_order: number
}

export default function ProductVariants({ session }: { session: Session | null }) {
  const router = useRouter()
  const { id } = router.query
  
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)
  
  // Variant Form
  const [variantName, setVariantName] = useState('')
  const [variantPrice, setVariantPrice] = useState('')
  
  // Extra Form
  const [extraName, setExtraName] = useState('')
  const [extraPrice, setExtraPrice] = useState('')
  
  // Messages
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const fetchData = async () => {
    // Produkt laden
    const { data: prod } = await supabase.from('products').select('*').eq('id', id).single()
    setProduct(prod)
    
    // Varianten laden
    const { data: vars } = await supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order')
    setVariants(vars || [])
    
    // Extras laden
    const { data: exs } = await supabase.from('product_extras').select('*').eq('product_id', id).order('sort_order')
    setExtras(exs || [])
    
    setLoading(false)
  }

  const addVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('product_variants').insert({
      product_id: id,
      name: variantName,
      price: parseFloat(variantPrice),
      sort_order: variants.length,
      available: true
    }).select().single()
    
    if (error) {
      showMessage('❌ Fehler: ' + error.message)
      console.error(error)
      return
    }
    
    if (data) {
      setVariants([...variants, data])
      setVariantName('')
      setVariantPrice('')
      showMessage('✅ Variante hinzugefügt!')
    }
  }

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Variante löschen?')) return
    const { error } = await supabase.from('product_variants').delete().eq('id', variantId)
    
    if (error) {
      showMessage('❌ Fehler beim Löschen')
      return
    }
    
    setVariants(variants.filter(v => v.id !== variantId))
    showMessage('✅ Variante gelöscht!')
  }

  const addExtra = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Adding extra:', { product_id: id, name: extraName, price: extraPrice })
    
    const { data, error } = await supabase.from('product_extras').insert({
      product_id: id,
      name: extraName,
      price: parseFloat(extraPrice),
      sort_order: extras.length,
      available: true
    }).select().single()
    
    if (error) {
      showMessage('❌ Fehler: ' + error.message)
      console.error('Extra Error:', error)
      return
    }
    
    if (data) {
      console.log('Extra added:', data)
      setExtras([...extras, data])
      setExtraName('')
      setExtraPrice('')
      showMessage('✅ Extra hinzugefügt!')
    }
  }

  const deleteExtra = async (extraId: string) => {
    if (!confirm('Extra löschen?')) return
    const { error } = await supabase.from('product_extras').delete().eq('id', extraId)
    
    if (error) {
      showMessage('❌ Fehler beim Löschen')
      return
    }
    
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
        <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 transition-all">
          <ArrowLeft size={20} />
          Zurück
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-6xl">{product?.icon}</span>
            <h1 className="text-4xl font-display font-bold italic" style={{ color: '#4a5d54' }}>
              {product?.name}
            </h1>
          </div>
          <p className="text-gray-500">Basis-Preis: {product?.price.toFixed(2)} €</p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl text-center font-bold" 
            style={{ backgroundColor: message.includes('✅') ? '#e8f8f0' : '#fde8e8', color: message.includes('✅') ? '#27ae60' : '#e74c3c' }}>
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* VARIANTEN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Varianten</h2>
            <p className="text-sm text-gray-500 mb-4">z.B. "2 Kugeln", "3 Kugeln"</p>
            
            <form onSubmit={addVariant} className="space-y-3 mb-6">
              <input type="text" value={variantName} onChange={e => setVariantName(e.target.value)} 
                placeholder="Name (z.B. 2 Kugeln)" required className="w-full p-3 rounded-xl border-2 border-gray-200" />
              <input type="number" step="0.10" value={variantPrice} onChange={e => setVariantPrice(e.target.value)}
                placeholder="Preis (€)" required className="w-full p-3 rounded-xl border-2 border-gray-200" />
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90" 
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
              {variants.length === 0 && (
                <div className="text-center py-8 text-gray-400">Keine Varianten</div>
              )}
            </div>
          </div>

          {/* EXTRAS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#4a5d54' }}>Extras</h2>
            <p className="text-sm text-gray-500 mb-4">z.B. "Sahne +1,50€"</p>
            
            <form onSubmit={addExtra} className="space-y-3 mb-6">
              <input type="text" value={extraName} onChange={e => setExtraName(e.target.value)}
                placeholder="Name (z.B. Sahne)" required className="w-full p-3 rounded-xl border-2 border-gray-200" />
              <input type="number" step="0.10" value={extraPrice} onChange={e => setExtraPrice(e.target.value)}
                placeholder="Aufpreis (€)" required className="w-full p-3 rounded-xl border-2 border-gray-200" />
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90" 
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
              {extras.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  Keine Extras
                  <div className="text-xs mt-2">Extras werden im Shop bei Eisportionen angezeigt</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}