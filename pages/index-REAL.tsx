import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import ProductCard, { ProductGrid, CategoryHeader } from '@/components/ProductCard'
import MiniCart from '@/components/MiniCart'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [products, setProducts] = useState([])
  const [extras, setExtras] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // CART STATE
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    loadProducts()
    loadExtras()
    loadCart()
  }, [])

  // Setze erste Kategorie als ausgewählt
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0])
    }
  }, [categories])

  // Cart aus localStorage laden
  const loadCart = () => {
    const savedCart = localStorage.getItem('simonetti-cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  // Cart speichern
  const saveCart = (newCart) => {
    setCart(newCart)
    localStorage.setItem('simonetti-cart', JSON.stringify(newCart))
  }

  const loadProducts = async () => {
    setLoading(true)
    
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true })

    if (data) {
      setProducts(data)
      // Extract unique categories from products AND check if visible in categories table
      await loadVisibleCategories(data)
    }
    setLoading(false)
  }

  const loadVisibleCategories = async (products) => {
    // Hole alle sichtbaren PARENT Kategorien (ohne parent_id)
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('name')
      .eq('visible', true)
      .is('parent_id', null)  // Nur Top-Level Kategorien
      .order('sort_order', { ascending: true })
    
    if (categoriesData) {
      // Filtere nur Kategorien die auch Produkte haben
      const categoriesWithProducts = categoriesData
        .map(c => c.name)
        .filter(catName => products.some(p => p.category === catName))
      
      setCategories(categoriesWithProducts)
    }
  }

  const loadExtras = async () => {
    const { data } = await supabase
      .from('extras')
      .select('*')
      .eq('active', true)
    
    if (data) setExtras(data)
  }

  // ADD TO CART mit Portionen & Extras
  const handleAddToCart = (product, portions = 1, selectedFlavors = [], selectedExtras = []) => {
    const cartItem = {
      ...product,
      quantity: portions,
      selectedFlavors: selectedFlavors,
      selectedExtras: selectedExtras,
      totalPrice: (product.price * portions) + selectedExtras.reduce((sum, e) => sum + e.price, 0),
      cartId: `${product.id}-${Date.now()}` // Unique ID für mehrfache gleiche Produkte
    }

    const newCart = [...cart, cartItem]
    saveCart(newCart)
    setIsCartOpen(true) // Auto-open cart
  }

  const updateCartQuantity = (cartId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(cartId)
      return
    }
    const newCart = cart.map(item => 
      item.cartId === cartId 
        ? { ...item, quantity: newQuantity, totalPrice: (item.price * newQuantity) + item.selectedExtras.reduce((sum, e) => sum + e.price, 0) }
        : item
    )
    saveCart(newCart)
  }

  const removeFromCart = (cartId) => {
    const newCart = cart.filter(item => item.cartId !== cartId)
    saveCart(newCart)
  }

  const clearCart = () => {
    saveCart([])
  }

  const filteredProducts = products.filter(p => p.category === selectedCategory)

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        session={session} 
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* MiniCart */}
      <MiniCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        total={cartTotal}
      />

      {/* Speisekarte */}
      <section id="speisekarte" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <CategoryHeader 
            title="Unsere Gelato-Sorten"
            description="Täglich frisch hergestellt nach traditioneller italienischer Rezeptur"
          />

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mb-12">
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 text-sm font-medium uppercase tracking-wider transition ${
                      selectedCategory === cat
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Products Grid */}
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
                  onAddToCart={handleAddToCart}
                />
              ))}
            </ProductGrid>
          )}

        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}