import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Minus } from 'lucide-react'

interface Product {
  id: string; name: string; price: number; icon: string; scoop_count: number; category: string
}
interface Extra {
  id: string; name: string; price: number; icon?: string
}
interface FlavorCount {
  [flavorId: string]: number
}

export default function IceCreamPortionSelector({ 
  product, 
  availableFlavors,
  onAddToCart 
}: { 
  product: Product
  availableFlavors: Product[]
  onAddToCart: (item: any) => void 
}) {
  const [flavorCounts, setFlavorCounts] = useState<FlavorCount>({})
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [extras, setExtras] = useState<Extra[]>([])

  useEffect(() => {
    fetchExtras()
  }, [product.id])

  const fetchExtras = async () => {
    // Lade globale Extras basierend auf Produkt-Kategorie
    const { data } = await supabase
      .from('global_extras')
      .select('*')
      .contains('categories', [product.category])
      .eq('available', true)
      .order('sort_order')
    
    console.log('Loaded global extras:', data)
    setExtras(data || [])
  }

  const totalScoops = Object.values(flavorCounts).reduce((sum, count) => sum + count, 0)
  const maxScoops = product.scoop_count

  const adjustFlavor = (flavorId: string, change: number) => {
    const current = flavorCounts[flavorId] || 0
    const newCount = Math.max(0, current + change)
    
    if (change > 0 && totalScoops >= maxScoops) return
    
    const newCounts = { ...flavorCounts }
    if (newCount === 0) {
      delete newCounts[flavorId]
    } else {
      newCounts[flavorId] = newCount
    }
    setFlavorCounts(newCounts)
  }

  const toggleExtra = (extraId: string) => {
    if (selectedExtras.includes(extraId)) {
      setSelectedExtras(selectedExtras.filter(id => id !== extraId))
    } else {
      setSelectedExtras([...selectedExtras, extraId])
    }
  }

  const calculateTotal = () => {
    const extrasTotal = extras
      .filter(e => selectedExtras.includes(e.id))
      .reduce((sum, e) => sum + e.price, 0)
    
    return product.price + extrasTotal
  }

  const handleAddToCart = () => {
    if (totalScoops === 0) {
      alert('Bitte wähle mindestens eine Kugel Eis!')
      return
    }

    const flavorList: string[] = []
    Object.entries(flavorCounts).forEach(([flavorId, count]) => {
      const flavor = availableFlavors.find(f => f.id === flavorId)
      if (flavor) {
        for (let i = 0; i < count; i++) {
          flavorList.push(flavor.name)
        }
      }
    })

    const selectedExtraNames = extras
      .filter(e => selectedExtras.includes(e.id))
      .map(e => ({ name: e.name, price: e.price }))

    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      name: `${product.name} (${flavorList.join(', ')}${selectedExtraNames.length > 0 ? ' + ' + selectedExtraNames.map(e => e.name).join(', ') : ''})`,
      baseProduct: product,
      flavors: flavorList,
      extras: selectedExtraNames,
      price: calculateTotal(),
      quantity: 1
    }

    onAddToCart(cartItem)
    
    setFlavorCounts({})
    setSelectedExtras([])
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-sm">Wähle deine Sorten:</span>
          <span className="text-sm font-bold px-3 py-1 rounded-full" 
            style={{ 
              backgroundColor: totalScoops === maxScoops ? '#4a5d54' : '#f9f8f4',
              color: totalScoops === maxScoops ? 'white' : '#4a5d54'
            }}>
            {totalScoops}/{maxScoops} Kugeln
          </span>
        </div>

        <div className="space-y-2">
          {availableFlavors.map(flavor => {
            const count = flavorCounts[flavor.id] || 0
            const canAdd = totalScoops < maxScoops
            
            return (
              <div key={flavor.id} className="flex items-center justify-between p-3 rounded-lg bg-white">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{flavor.icon}</span>
                  <span className="font-semibold">{flavor.name}</span>
                  {count > 0 && (
                    <span className="text-sm px-2 py-0.5 rounded-full font-bold" 
                      style={{ backgroundColor: '#4a5d54', color: 'white' }}>
                      {count}x
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {count > 0 && (
                    <button
                      onClick={() => adjustFlavor(flavor.id, -1)}
                      className="p-1.5 rounded-lg transition-all hover:bg-gray-100"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => adjustFlavor(flavor.id, 1)}
                    disabled={!canAdd}
                    className={`p-1.5 rounded-lg transition-all ${
                      canAdd 
                        ? 'hover:bg-green-50 text-green-600' 
                        : 'opacity-30 cursor-not-allowed'
                    }`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {extras.length > 0 && (
        <div>
          <label className="block text-sm font-bold mb-2">Extras (optional):</label>
          <div className="space-y-2">
            {extras.map(extra => (
              <label key={extra.id} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer hover:bg-gray-50 transition-all"
                style={{ borderColor: selectedExtras.includes(extra.id) ? '#4a5d54' : '#e5e7eb' }}>
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(extra.id)}
                  onChange={() => toggleExtra(extra.id)}
                  className="w-5 h-5 accent-green-600"
                />
                <span className="text-xl">{extra.icon || '➕'}</span>
                <span className="flex-1 font-semibold">{extra.name}</span>
                <span className="font-bold text-lg" style={{ color: '#4a5d54' }}>
                  +{extra.price.toFixed(2)} €
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 text-white p-4 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold">Gesamt:</span>
          <span className="text-2xl font-bold">
            {calculateTotal().toFixed(2)} €
          </span>
        </div>
        <button 
          onClick={handleAddToCart} 
          disabled={totalScoops === 0}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            totalScoops === 0
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          {totalScoops === 0 ? 'Wähle mindestens 1 Kugel' : `In den Warenkorb - ${calculateTotal().toFixed(2)} €`}
        </button>
      </div>
    </div>
  )
}