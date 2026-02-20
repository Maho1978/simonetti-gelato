import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import { ProductGrid, ProductCard, CategoryHeader } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [products, setProducts] = useState([])
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Session laden
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    // Produkte laden
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true })

    if (data) setProducts(data)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />
      
      <HeroSection />

      {/* Speisekarte */}
      <section id="speisekarte" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <CategoryHeader 
            title="Unsere Gelato-Sorten"
            description="Täglich frisch hergestellt nach traditioneller italienischer Rezeptur"
          />

          <ProductGrid>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => {/* add to cart */}}
              />
            ))}
          </ProductGrid>

        </div>
      </section>

      {/* Footer - Professional */}
      <footer className="bg-[#1a1a1a] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            
            <div>
              <h3 className="font-display text-2xl font-bold mb-4">Simonetti</h3>
              <p className="text-gray-400">
                Italienisches Gelato aus Liebe zum Handwerk<br />
                
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Öffnungszeiten</h4>
              <p className="text-gray-400 text-sm">
                Mo - Sa: 09:00 - 19:00 Uhr<br />
                So: 13:00 - 19:00 Uhr
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <p className="text-gray-400 text-sm">
                Konrad-Adenauer-Platz 2<br />
                40764 Langenfeld<br />
                Tel: 02173 1622780
              </p>
            </div>

          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
            © 2026 Eiscafe Simonetti. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  )
}