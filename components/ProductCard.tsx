import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, X, Plus, Minus } from 'lucide-react'
import FavoriteButton from './FavoriteButton'

interface Extra {
  id: string
  name: string
  price: number
  selection_type?: 'multiple' | 'single'
}

interface FlavorItem {
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
  flavors?: FlavorItem[] | string[]
  onAddToCart: (product: any, portions: number, selectedFlavors: string[], selectedExtras: Extra[]) => void
}

export default function ProductCard({ product, extras, flavors = [], onAddToCart }: ProductCardProps) {
  const [showModal, setShowModal]       = useState(false)
  const portionSize                     = product.portion_size || 1

  // Normalize flavors to objects
  const availableFlavors: FlavorItem[] = (flavors.length > 0 ? flavors : (product.available_flavors || []))
    .map((f: any) => typeof f === 'string' ? { name: f, price: 0 } : f)

  // Mengenauswahl pro Sorte: { [flavorName]: count }
  const [flavorCounts, setFlavorCounts] = useState<Record<string, number>>({})
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([])
  const [radioError, setRadioError]     = useState(false)

  const singleExtras   = extras.filter(e => e.selection_type === 'single')
  const multipleExtras = extras.filter(e => e.selection_type !== 'single')

  // Gesamtanzahl gewählter Kugeln
  const totalSelected = Object.values(flavorCounts).reduce((s, n) => s + n, 0)

  // selectedFlavors als flaches Array (z.B. ["Pistazie","Pistazie","Vanille"])
  const selectedFlavors = Object.entries(flavorCounts).flatMap(([name, count]) =>
    Array(count).fill(name)
  )

  const handleQuickAdd = () => {
    if (product.has_portions || (extras && extras.length > 0)) {
      setShowModal(true)
    } else {
      onAddToCart(product, 1, [], [])
    }
  }

  const handleAddToCart = () => {
    if (product.has_portions && totalSelected === 0) {
      alert(`Bitte wähle mindestens 1 Sorte aus!`)
      return
    }
    if (singleExtras.length > 0) {
      const hasSelectedSingle = selectedExtras.some(e => singleExtras.find(s => s.id === e.id))
      if (!hasSelectedSingle) {
        setRadioError(true)
        return
      }
    }
    setRadioError(false)
    onAddToCart(product, 1, selectedFlavors, selectedExtras)
    setShowModal(false)
    setFlavorCounts({})
    setSelectedExtras([])
  }

  const incrementFlavor = (flavorName: string) => {
    if (totalSelected >= portionSize) return
    setFlavorCounts(prev => ({ ...prev, [flavorName]: (prev[flavorName] || 0) + 1 }))
  }

  const decrementFlavor = (flavorName: string) => {
    setFlavorCounts(prev => {
      const newCount = (prev[flavorName] || 0) - 1
      if (newCount <= 0) {
        const { [flavorName]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [flavorName]: newCount }
    })
  }

  const toggleExtra = (extra: Extra) => {
    if (selectedExtras.find(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id))
    } else {
      setSelectedExtras([...selectedExtras, extra])
    }
  }

  const selectSingleExtra = (extra: Extra) => {
    const singleIds = singleExtras.map(e => e.id)
    const alreadySelected = selectedExtras.find(e => e.id === extra.id)
    if (alreadySelected) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id))
    } else {
      setSelectedExtras([...selectedExtras.filter(e => !singleIds.includes(e.id)), extra])
    }
    setRadioError(false)
  }

  // Gesamtpreis inkl. Sorten-Aufpreise
  const flavorExtraPrice = Object.entries(flavorCounts).reduce((sum, [name, count]) => {
    const fl = availableFlavors.find(f => f.name === name)
    return sum + (fl ? (fl.price || 0) * count : 0)
  }, 0)
  const totalPrice = product.price + flavorExtraPrice + selectedExtras.reduce((sum, e) => sum + e.price, 0)

  const DiaetBadges = ({ small = false }: { small?: boolean }) => (
    <div className="flex flex-wrap gap-1">
      {product.is_vegan && <span className={`px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium ${small ? 'text-xs' : 'text-xs'}`}>🌱 Vegan</span>}
      {product.is_vegetarian && !product.is_vegan && <span className={`px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium ${small ? 'text-xs' : 'text-xs'}`}>🥗 Vegetarisch</span>}
      {product.is_glutenfree && <span className={`px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium ${small ? 'text-xs' : 'text-xs'}`}>🌾 Glutenfrei</span>}
      {product.is_lactosefree && <span className={`px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium ${small ? 'text-xs' : 'text-xs'}`}>🥛 Laktosefrei</span>}
    </div>
  )

  return (
    <>
      {/* KARTE */}
      <div className="group relative bg-white border border-gray-100 hover:border-gray-300 transition-all duration-300 hover:shadow-md rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display font-bold text-gray-900 text-sm leading-tight">{product.name}</h3>
              <FavoriteButton productId={product.id} size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {product.description && <p className="text-gray-500 text-xs line-clamp-2 mb-1.5">{product.description}</p>}
            <DiaetBadges small />
            {product.allergens && product.allergens.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 truncate">⚠️ {product.allergens.join(', ')}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="font-display font-bold text-lg text-black">{product.price.toFixed(2)} €</span>
              <button onClick={handleQuickAdd}
                className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs font-medium uppercase tracking-wide transition hover:bg-gray-800 rounded">
                <ShoppingCart size={12} />
                <span>Bestellen</span>
              </button>
            </div>
          </div>
          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 relative">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🍦</div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {product.image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <h2 className="font-display text-xl font-bold">{product.name}</h2>
                  <p className="text-gray-500 text-sm">{product.price.toFixed(2)} €</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* SORTEN AUSWAHL */}
              {product.has_portions && availableFlavors.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    Sorten auswählen
                    <span className={`ml-2 text-sm px-2 py-0.5 rounded-full ${totalSelected === portionSize ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {totalSelected}/{portionSize}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Wähle {portionSize} Kugel{portionSize > 1 ? 'n' : ''} für deinen {product.name}
                  </p>
                  <div className="space-y-2">
                    {availableFlavors.map(flavor => {
                      const count = flavorCounts[flavor.name] || 0
                      const canAdd = totalSelected < portionSize
                      return (
                        <div key={flavor.name}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg transition ${count > 0 ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">🍦 {flavor.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-green-600 text-sm min-w-[60px] text-right">
                              {flavor.price > 0 ? `+${flavor.price.toFixed(2)} €` : 'kostenlos'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => decrementFlavor(flavor.name)}
                                disabled={count === 0}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${count > 0 ? 'border-black bg-black text-white hover:bg-gray-800' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center font-bold text-sm">{count}</span>
                              <button
                                type="button"
                                onClick={() => incrementFlavor(flavor.name)}
                                disabled={!canAdd}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${canAdd ? 'border-black bg-black text-white hover:bg-gray-800' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* EXTRAS */}
              {extras && extras.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3">Extras</h3>
                  <div className="space-y-2">

                    {/* SINGLE: Radio — Pflichtauswahl */}
                    {singleExtras.length > 0 && (
                      <div className="mb-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${radioError ? 'text-red-500' : 'text-gray-400'}`}>
                          {radioError
                            ? '⚠️ Bitte eine Option wählen (Pflichtfeld)'
                            : 'Bitte wählen ✱ (Pflichtfeld)'}
                        </p>
                        {singleExtras.map(extra => {
                          const isSelected = !!selectedExtras.find(e => e.id === extra.id)
                          return (
                            <label key={extra.id}
                              className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition mb-2
                                ${isSelected
                                  ? 'border-black bg-gray-50'
                                  : radioError
                                    ? 'border-red-300 hover:border-red-500'
                                    : 'border-gray-200 hover:border-black'}`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`single-extra-${product.id}`}
                                  checked={isSelected}
                                  onChange={() => selectSingleExtra(extra)}
                                  className="w-4 h-4"
                                />
                                <span className="font-medium">{extra.name}</span>
                              </div>
                              <span className="font-bold text-green-600">
                                {extra.price > 0 ? `+${extra.price.toFixed(2)} €` : 'kostenlos'}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {/* MULTIPLE: Checkbox — optional */}
                    {multipleExtras.length > 0 && (
                      <div>
                        {singleExtras.length > 0 && (
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Optional</p>
                        )}
                        {multipleExtras.map(extra => (
                          <label key={extra.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition mb-2 ${selectedExtras.find(e => e.id === extra.id) ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}>
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!!selectedExtras.find(e => e.id === extra.id)}
                                onChange={() => toggleExtra(extra)}
                                className="w-5 h-5"
                              />
                              <span className="font-medium">{extra.name}</span>
                            </div>
                            <span className="font-bold text-green-600">
                              {extra.price > 0 ? `+${extra.price.toFixed(2)} €` : 'kostenlos'}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* PRODUKTINFO */}
              {(product.allergens?.length || product.ingredients || product.is_vegan || product.is_vegetarian || product.is_glutenfree || product.is_lactosefree) && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold text-sm text-gray-700 mb-3">📋 Produktinformationen</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.is_vegan && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">🌱 Vegan</span>}
                    {product.is_vegetarian && !product.is_vegan && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">🥗 Vegetarisch</span>}
                    {product.is_glutenfree && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">🌾 Glutenfrei</span>}
                    {product.is_lactosefree && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">🥛 Laktosefrei</span>}
                  </div>
                  {product.ingredients && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-600">Zutaten: </span>
                      <span className="text-xs text-gray-600">{product.ingredients}</span>
                    </div>
                  )}
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
                <button onClick={handleAddToCart}
                  disabled={product.has_portions && totalSelected === 0}
                  className="w-full py-4 bg-black text-white font-bold text-lg uppercase tracking-wider hover:bg-gray-900 transition rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                  {product.has_portions && totalSelected === 0
                    ? `Bitte ${portionSize} Kugel${portionSize > 1 ? 'n' : ''} wählen`
                    : product.has_portions && totalSelected < portionSize
                      ? `Noch ${portionSize - totalSelected} Kugel${portionSize - totalSelected > 1 ? 'n' : ''} wählen`
                      : singleExtras.length > 0 && !selectedExtras.some(e => singleExtras.find(s => s.id === e.id))
                        ? 'Bitte eine Option wählen'
                        : 'In den Warenkorb'
                  }
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {children}
    </div>
  )
}

export function CategoryHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center mb-10">
      <h2 className="font-display text-4xl font-bold mb-3 text-black">{title}</h2>
      {description && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>}
    </div>
  )
}