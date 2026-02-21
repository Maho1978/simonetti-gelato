import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, X } from 'lucide-react'
import FavoriteButton from './FavoriteButton'

interface Extra {
  id: string
  name: string
  price: number
}

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    image_url: string
    category: string
    has_portions?: boolean
    portion_size?: number
    available_flavors?: string[]
    allergens?: string[]
    ingredients?: string
    is_vegan?: boolean
    is_vegetarian?: boolean
    is_glutenfree?: boolean
    is_lactosefree?: boolean
  }
  extras: Extra[]
  onAddToCart: (product: any, portions: number, selectedFlavors: string[], selectedExtras: Extra[]) => void
}

export default function ProductCard({ product, extras, onAddToCart }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false)
  const portionSize = product.portion_size || 1
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([])

  const handleQuickAdd = () => {
    if (product.has_portions) {
      setShowModal(true)
    } else {
      onAddToCart(product, 1, [], [])
    }
  }

  const handleAddToCart = () => {
    if (product.has_portions && selectedFlavors.length === 0) {
      alert(`Bitte wähle mindestens 1 Sorte aus!`)
      return
    }
    onAddToCart(product, 1, selectedFlavors, selectedExtras)
    setShowModal(false)
    setSelectedFlavors([])
    setSelectedExtras([])
  }

  const toggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor))
    } else {
      if (selectedFlavors.length >= portionSize) {
        alert(`Du kannst maximal ${portionSize} Sorte${portionSize > 1 ? 'n' : ''} auswählen!`)
        return
      }
      setSelectedFlavors([...selectedFlavors, flavor])
    }
  }

  const toggleExtra = (extra: Extra) => {
    if (selectedExtras.find(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id))
    } else {
      setSelectedExtras([...selectedExtras, extra])
    }
  }

  const totalPrice = product.price + selectedExtras.reduce((sum, e) => sum + e.price, 0)

  // Diät & Allergen Badges
  const DiaetBadges = () => (
    <div className="flex flex-wrap gap-1 mt-2">
      {product.is_vegan && (
        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">🌱 Vegan</span>
      )}
      {product.is_vegetarian && !product.is_vegan && (
        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">🥗 Vegetarisch</span>
      )}
      {product.is_glutenfree && (
        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">🌾 Glutenfrei</span>
      )}
      {product.is_lactosefree && (
        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">🥛 Laktosefrei</span>
      )}
    </div>
  )

  return (
    <>
      <div className="group relative bg-white overflow-hidden transition-all duration-300 hover:shadow-xl">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🍦</div>
          )}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FavoriteButton productId={product.id} size={20} className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full" />
          </div>

          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-medium uppercase tracking-wider">
              {product.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display text-xl font-bold mb-1 text-gray-900">{product.name}</h3>

          {product.description && (
            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
          )}

          {/* Diät Badges auf der Karte */}
          <DiaetBadges />

          {/* Allergene auf der Karte (kompakt) */}
          {product.allergens && product.allergens.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              ⚠️ Enthält: {product.allergens.join(', ')}
            </p>
          )}

          {/* Price & Button */}
          <div className="flex items-center justify-between mt-3">
            <div className="font-display text-2xl font-bold text-black">
              {product.price.toFixed(2)} €
            </div>
            <button
              onClick={handleQuickAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-medium uppercase tracking-wide transition hover:bg-gray-900"
            >
              <ShoppingCart size={14} />
              <span className="hidden sm:inline">Bestellen</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">{product.name}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* SORTEN AUSWAHL */}
              {product.has_portions && product.available_flavors && product.available_flavors.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    Sorten auswählen ({selectedFlavors.length}/{portionSize})
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Wähle bis zu {portionSize} Sorte{portionSize > 1 ? 'n' : ''} für deinen {product.name}
                  </p>
                  <p className="text-xs text-blue-600 mb-3">
                    💡 Tipp: Du kannst auch nur 1 Sorte wählen, dann bekommst du {portionSize}x diese Sorte!
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {product.available_flavors.map(flavor => (
                      <button
                        key={flavor}
                        onClick={() => toggleFlavor(flavor)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                          selectedFlavors.includes(flavor)
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-black'
                        }`}
                      >
                        {flavor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* EXTRAS */}
              {extras && extras.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3">Extras hinzufügen (optional)</h3>
                  <div className="space-y-2">
                    {extras.map(extra => (
                      <label
                        key={extra.id}
                        className="flex items-center justify-between p-3 border-2 border-gray-300 rounded-lg hover:border-black cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedExtras.find(e => e.id === extra.id) !== undefined}
                            onChange={() => toggleExtra(extra)}
                            className="w-5 h-5"
                          />
                          <span className="font-medium">{extra.name}</span>
                        </div>
                        <span className="font-bold">+{extra.price.toFixed(2)} €</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUKTINFO im Modal */}
              {(product.allergens?.length || product.ingredients || product.is_vegan || product.is_vegetarian || product.is_glutenfree || product.is_lactosefree) && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold text-sm text-gray-700 mb-3">📋 Produktinformationen</h3>

                  {/* Diät Labels */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.is_vegan && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">🌱 Vegan</span>}
                    {product.is_vegetarian && !product.is_vegan && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">🥗 Vegetarisch</span>}
                    {product.is_glutenfree && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">🌾 Glutenfrei</span>}
                    {product.is_lactosefree && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">🥛 Laktosefrei</span>}
                  </div>

                  {/* Zutaten */}
                  {product.ingredients && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-600">Zutaten: </span>
                      <span className="text-xs text-gray-600">{product.ingredients}</span>
                    </div>
                  )}

                  {/* Allergene */}
                  {product.allergens && product.allergens.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-orange-600">⚠️ Allergene: </span>
                      <span className="text-xs text-orange-600">{product.allergens.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TOTAL & BUTTON */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold">Gesamt:</span>
                  <span className="text-3xl font-display font-bold">{totalPrice.toFixed(2)} €</span>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-black text-white font-bold text-lg uppercase tracking-wider hover:bg-gray-900 transition rounded-lg"
                >
                  In den Warenkorb
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  )
}

export function CategoryHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="font-display text-4xl font-bold mb-3 text-black">{title}</h2>
      {description && (
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
      )}
    </div>
  )
}