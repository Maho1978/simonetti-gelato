import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ProductGrid from '@/components/ProductGrid'
import Cart from '@/components/Cart'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  icon: string
  available: boolean
}

interface CartItem extends Product {
  quantity: number
}

export default function Home({ session }: { session: Session | null }) {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
    loadCartFromStorage()
  }, [])

  useEffect(() => {
    saveCartToStorage()
  }, [cart])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCartFromStorage = () => {
    const saved = localStorage.getItem('simonetti_cart')
    if (saved) setCart(JSON.parse(saved))
  }

  const saveCartToStorage = () => {
    localStorage.setItem('simonetti_cart', JSON.stringify(cart))
  }

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id)
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, change: number) => {
    setCart(prevCart =>
      prevCart
        .map(item => item.id === productId ? { ...item, quantity: item.quantity + change } : item)
        .filter(item => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const clearCart = () => setCart([])

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory)

  return (
    <div style={{ backgroundColor: '#fdfcfb' }} className="min-h-screen">
      <Navbar session={session} cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />

      <main>
        <Hero />

        {/* Produkte */}
        <div id="produkte" className="max-w-7xl mx-auto px-6 lg:px-8 py-16">

          {/* Kategorien */}
          <div className="flex gap-3 mb-10 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-300"
                style={selectedCategory === category
                  ? { backgroundColor: '#4a5d54', color: '#fdfcfb', boxShadow: '0 4px 12px rgba(74,93,84,0.3)' }
                  : { backgroundColor: 'white', color: '#4a5d54', border: '2px solid #e5e7eb' }
                }
              >
                {category === 'all' ? '🍦 Alle' : `${getCategoryIcon(category)} ${category}`}
              </button>
            ))}
          </div>

          {/* Produkte Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">🍦</div>
                <div className="font-display italic text-xl" style={{ color: '#4a5d54' }}>Lade Eissorten...</div>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🍦</div>
              <div className="text-xl font-semibold" style={{ color: '#4a5d54' }}>Keine Produkte gefunden</div>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
          )}
        </div>

        {/* Footer */}
        <footer style={{ backgroundColor: '#4a5d54', color: '#fdfcfb' }} className="mt-20 py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
              <div>
                <h2 className="text-3xl font-display font-bold italic mb-3">Simonetti</h2>
                <p style={{ opacity: 0.7, maxWidth: '280px', lineHeight: '1.7' }}>
                  Frische Eistradition für Langenfeld.<br />Qualität, die man schmeckt.
                </p>
              </div>
              <div className="flex gap-16">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#8da399' }}>MENU</span>
                  <Link href="/" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8 }}>Shop</Link>
                  <Link href="/account" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8 }}>Konto</Link>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#8da399' }}>INFO</span>
                  <Link href="/impressum" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8 }}>Impressum</Link>
                  <Link href="/datenschutz" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8 }}>Datenschutz</Link>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(253,252,251,0.15)' }} className="pt-6 flex justify-between items-center text-sm" style={{ opacity: 0.6 }}>
              <span>© {new Date().getFullYear()} Simonetti Gelateria Langenfeld</span>
              <span>🍦 Handgemacht mit Liebe</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Warenkorb */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        total={cartTotal}
        session={session}
      />

      {/* Floating Cart (Mobile) */}
      {cartCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-40 md:hidden"
          style={{ backgroundColor: '#4a5d54', color: '#fdfcfb' }}
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: '#8da399' }}>
            {cartCount}
          </span>
        </button>
      )}
    </div>
  )
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Eis': '🍦',
    'Sorbet': '🍧',
    'Spezialitäten': '⭐',
    'Getränke': '🥤',
    'Waffeln': '🧇',
  }
  return icons[category] || '🍦'
}