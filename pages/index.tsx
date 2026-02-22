import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import ProductCard, { ProductGrid, CategoryHeader } from '@/components/ProductCard'
import MiniCart from '@/components/MiniCart'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import ShopStatusBanner from '@/components/ShopStatusBanner'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [products, setProducts]               = useState<any[]>([])
  const [extras, setExtras]                   = useState<any[]>([])
  const [categories, setCategories]           = useState<string[]>([])
  const [flavors, setFlavors]                 = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [session, setSession]                 = useState<any>(null)
  const [loading, setLoading]                 = useState(true)
  const [cart, setCart]                       = useState<any[]>([])
  const [isCartOpen, setIsCartOpen]           = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    loadProducts()
    loadExtras()
    loadCart()
  }, [])

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0])
    }
  }, [categories])

  const loadCart = () => {
    const saved = localStorage.getItem('simonetti-cart')
    if (saved) setCart(JSON.parse(saved))
  }

  const saveCart = (newCart: any[]) => {
    setCart(newCart)
    localStorage.setItem('simonetti-cart', JSON.stringify(newCart))
  }

  const loadProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products').select('*').eq('active', true).order('category').order('name')

    if (data) {
      setProducts(data)
      await loadCategories(data)
    }
    setLoading(false)
  }

  const loadCategories = async (activeProducts: any[]) => {
    const { data: catData } = await supabase
      .from('categories').select('*').order('sort_order', { ascending: true })

    if (catData) {
      const visibleCats = catData
        .filter(c => c.visible !== false)
        .map(c => c.name)
        .filter(name => activeProducts.some(p => p.category === name))

      setCategories(visibleCats)

      const hiddenCatNames = catData
        .filter(c => c.visible === false)
        .map(c => c.name)

      const dynamicFlavors = activeProducts
        .filter(p => hiddenCatNames.includes(p.category))
        .map(p => p.name)
        .sort()

      setFlavors(dynamicFlavors)

    } else {
      const cats = [...new Set(activeProducts.map(p => p.category))].filter(Boolean) as string[]
      setCategories(cats)
      setFlavors([])
    }
  }

  const loadExtras = async () => {
    const { data } = await supabase.from('extras').select('*').eq('active', true)
    if (data) setExtras(data)
  }

  const handleAddToCart = (product: any, portions = 1, selectedFlavors: string[] = [], selectedExtras: any[] = []) => {
    const cartItem = {
      ...product,
      quantity: portions,
      selectedFlavors,
      selectedExtras,
      totalPrice: (product.price * portions) + selectedExtras.reduce((sum, e) => sum + e.price, 0),
      cartId: `${product.id}-${Date.now()}`
    }
    saveCart([...cart, cartItem])
    setIsCartOpen(true)
  }

  const updateCartQuantity = (cartId: string, newQuantity: number) => {
    if (newQuantity === 0) { removeFromCart(cartId); return }
    saveCart(cart.map(item =>
      item.cartId === cartId
        ? { ...item, quantity: newQuantity, totalPrice: (item.price * newQuantity) + (item.selectedExtras || []).reduce((sum: number, e: any) => sum + e.price, 0) }
        : item
    ))
  }

  // FIX: Anmerkungen updaten ohne den Cart neu zu mounten
  const updateCartNotes = (cartId: string, notes: string) => {
    setCart(prev => {
      const updated = prev.map(item =>
        item.cartId === cartId ? { ...item, notes } : item
      )
      localStorage.setItem('simonetti-cart', JSON.stringify(updated))
      return updated
    })
  }

  const removeFromCart = (cartId: string) => saveCart(cart.filter(item => item.cartId !== cartId))
  const clearCart = () => saveCart([])

  const filteredProducts = products.filter(p => p.category === selectedCategory)
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-white">
      <ShopStatusBanner />
      <Navbar session={session} cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      <HeroSection />

      <MiniCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onUpdateNotes={updateCartNotes}
        onClearCart={clearCart}
        total={cartTotal}
      />

      <section id="speisekarte" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <CategoryHeader
            title="Unsere Gelato-Sorten"
            description="Täglich frisch hergestellt nach traditioneller italienischer Rezeptur"
          />

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mb-12">
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat).length
                return (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 text-sm font-medium uppercase tracking-wider transition ${
                      selectedCategory === cat
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400'
                    }`}>
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-pulse">🍦</div>
              <p className="text-gray-600">Lädt Produkte...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-gray-600 text-xl">Keine Produkte in dieser Kategorie</p>
            </div>
          ) : (
            <ProductGrid>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  extras={extras}
                  flavors={flavors}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </ProductGrid>
          )}
        </div>
      </section>

      <Footer />
      <CookieBanner />
    </div>
  )
}