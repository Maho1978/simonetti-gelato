import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string; name: string; price: number; icon: string
}
interface Variant {
  id: string; name: string; price: number; number_of_scoops: number
}
interface Extra {
  id: string; name: string; price: number
}

export default function ProductWithVariants({ 
  product, 
  availableFlavors,
  onAddToCart 
}: { 
  product: Product
  availableFlavors: Product[]
  onAddToCart: (item: any) => void 
}) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])

  useEffect(() => {
    fetchVariantsAndExtras()
  }, [product.id])

  useEffect(() => {
    if (selectedVariant) {
      // Reset flavors wenn Variante wechselt
      setSelectedFlavors(new Array(selectedVariant.number_of_scoops).fill(''))
    }
  }, [selectedVariant])

  const fetchVariantsAndExtras = async () => {
    const { data: vars } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .eq('available', true)
      .order('sort_order')
    
    const { data: exs } = await supabase
      .from('product_extras')
      .select('*')
      .eq('product_id', product.id)
      .eq('available', true)
      .order('sort_order')
    
    setVariants(vars || [])
    setExtras(exs || [])
    
    if (vars && vars.length > 0) {
      setSelectedVariant(vars[0])
    }
  }

  const handleFlavorChange = (index: number, flavorId: string) => {
    const newFlavors = [...selectedFlavors]
    newFlavors[index] = flavorId
    setSelectedFlavors(newFlavors)
  }

  const toggleExtra = (extraId: string) => {
    if (selectedExtras.includes(extraId)) {
      setSelectedExtras(selectedExtras.filter(id => id !== extraId))
    } else {
      setSelectedExtras([...selectedExtras, extraId])
    }
  }

  const calculateTotal = () => {
    if (!selectedVariant) return 0
    
    const extrasTotal = extras
      .filter(e => selectedExtras.includes(e.id))
      .reduce((sum, e) => sum + e.price, 0)
    
    return selectedVariant.price + extrasTotal
  }

  const handleAddToCart = () => {
    if (!selectedVariant) return
    
    // Prüfe ob alle Sorten gewählt
    const allFlavorsSelected = selectedFlavors.every(f => f !== '')
    if (!allFlavorsSelected) {
      alert('Bitte wähle alle Eissorten aus!')
      return
    }

    const selectedFlavorNames = selectedFlavors.map(id => 
      availableFlavors.find(f => f.id === id)?.name
    ).filter(Boolean)

    const selectedExtraNames = extras
      .filter(e => selectedExtras.includes(e.id))
      .map(e => ({ name: e.name, price: e.price }))

    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      baseProduct: product,
      variant: selectedVariant,
      flavors: selectedFlavorNames,
      extras: selectedExtraNames,
      price: calculateTotal(),
      displayName: `${product.name} - ${selectedVariant.name}`
    }

    onAddToCart(cartItem)
  }

  // Falls keine Varianten: Normales Produkt
  if (variants.length === 0) {
    return (
      <button onClick={() => onAddToCart(product)} className="btn-primary w-full">
        In den Warenkorb - {product.price.toFixed(2)} €
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {/* Varianten-Auswahl */}
      <div>
        <label className="block text-sm font-bold mb-2">Größe wählen:</label>
        <select 
          value={selectedVariant?.id || ''} 
          onChange={e => setSelectedVariant(variants.find(v => v.id === e.target.value) || null)}
          className="w-full p-3 rounded-xl border-2 border-gray-200 font-semibold"
        >
          {variants.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} - {v.price.toFixed(2)} €
            </option>
          ))}
        </select>
      </div>

      {/* Sorten-Auswahl */}
      {selectedVariant && (
        <div>
          <label className="block text-sm font-bold mb-2">
            Wähle {selectedVariant.number_of_scoops} Sorten:
          </label>
          <div className="space-y-2">
            {Array.from({ length: selectedVariant.number_of_scoops }).map((_, index) => (
              <select
                key={index}
                value={selectedFlavors[index] || ''}
                onChange={e => handleFlavorChange(index, e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200"
              >
                <option value="">Kugel {index + 1} - Sorte wählen...</option>
                {availableFlavors.map(flavor => (
                  <option key={flavor.id} value={flavor.id}>
                    {flavor.icon} {flavor.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      )}

      {/* Extras */}
      {extras.length > 0 && (
        <div>
          <label className="block text-sm font-bold mb-2">Extras:</label>
          <div className="space-y-2">
            {extras.map(extra => (
              <label key={extra.id} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer hover:bg-gray-50"
                style={{ borderColor: selectedExtras.includes(extra.id) ? '#4a5d54' : '#e5e7eb' }}>
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(extra.id)}
                  onChange={() => toggleExtra(extra.id)}
                  className="w-5 h-5 accent-green-600"
                />
                <span className="flex-1">{extra.name}</span>
                <span className="font-bold">+{extra.price.toFixed(2)} €</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Total & Button */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold">Gesamt:</span>
          <span className="text-2xl font-bold" style={{ color: '#4a5d54' }}>
            {calculateTotal().toFixed(2)} €
          </span>
        </div>
        <button onClick={handleAddToCart} className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#4a5d54' }}>
          In den Warenkorb
        </button>
      </div>
    </div>
  )
}