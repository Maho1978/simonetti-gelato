import { Plus } from 'lucide-react'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  icon: string
  available: boolean
}

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

  const handleAddToCart = (product: Product) => {
    onAddToCart(product)
    setAddedProducts(prev => new Set(prev).add(product.id))
    
    setTimeout(() => {
      setAddedProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }, 1000)
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🍽️</div>
        <p className="text-xl text-gray-500">Keine Produkte in dieser Kategorie</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="card hover:-translate-y-2 animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex justify-center items-center h-48 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl mb-4">
            <span className="text-8xl">{product.icon}</span>
          </div>

          <h3 className="text-2xl font-display font-bold mb-2 text-gray-900">
            {product.name}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>

          <div className="flex justify-between items-center mt-auto pt-4">
            <span className="text-3xl font-bold text-primary">
              {product.price.toFixed(2)} €
            </span>

            <button
              onClick={() => handleAddToCart(product)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                addedProducts.has(product.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:scale-105'
              }`}
            >
              {addedProducts.has(product.id) ? (
                <>
                  <span>✓</span>
                  <span>Hinzugefügt</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Hinzufügen</span>
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
