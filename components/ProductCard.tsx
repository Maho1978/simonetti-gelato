import Image from 'next/image'
import { ShoppingCart, Heart } from 'lucide-react'
import FavoriteButton from './FavoriteButton'

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    image_url: string
    category: string
  }
  onAddToCart: () => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="group relative bg-white overflow-hidden transition-all duration-300 hover:shadow-xl">
      
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            🍦
          </div>
        )}
        
        {/* Favorit Button - Oben rechts */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <FavoriteButton productId={product.id} size={24} className="bg-white/90 backdrop-blur-sm p-2 rounded-full" />
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-medium uppercase tracking-wider">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        
        <h3 className="font-display text-2xl font-bold mb-2 text-gray-900">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price & Button */}
        <div className="flex items-center justify-between mt-4">
          <div className="font-display text-3xl font-bold text-black">
            {product.price.toFixed(2)} €
          </div>

          <button
            onClick={onAddToCart}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium uppercase tracking-wide transition hover:bg-gray-900"
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Bestellen</span>
          </button>
        </div>
      </div>

    </div>
  )
}

// ============================================================
// PRODUKT-GRID LAYOUT
// ============================================================

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {children}
    </div>
  )
}

// ============================================================
// KATEGORIE HEADER
// ============================================================

export function CategoryHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center mb-16">
      <h2 className="font-display text-5xl font-bold mb-4 text-black">
        {title}
      </h2>
      {description && (
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}