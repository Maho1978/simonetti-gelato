import { ShoppingCart } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface MiniCartProps {
  cart: CartItem[]
  total: number
  onOpenCart: () => void
}

const DELIVERY_FEE = 3.00

export default function MiniCart({ cart, total, onOpenCart }: MiniCartProps) {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const grandTotal = total + DELIVERY_FEE

  if (cartCount === 0) return null

  return (
    <>
      {/* Desktop - Fixed Right Sidebar */}
      <div className="hidden lg:block fixed right-6 top-24 z-30">
        <div 
          onClick={onOpenCart}
          className="bg-white rounded-2xl shadow-xl p-5 cursor-pointer transition-all hover:shadow-2xl hover:scale-105"
          style={{ width: '280px', border: '3px solid #4a5d54' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} style={{ color: '#4a5d54' }} />
              <span className="font-bold" style={{ color: '#4a5d54' }}>
                Warenkorb
              </span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
              style={{ backgroundColor: '#4a5d54' }}>
              {cartCount}
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded-lg"
                style={{ backgroundColor: '#f9f8f4' }}>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate" style={{ color: '#4a5d54' }}>
                    {item.quantity}x {item.name}
                  </div>
                </div>
                <div className="font-bold ml-2" style={{ color: '#8da399' }}>
                  {(item.price * item.quantity).toFixed(2)}€
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t-2 pt-3 space-y-2" style={{ borderColor: '#f0ede8' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#8da399' }}>Zwischensumme</span>
              <span className="font-bold" style={{ color: '#4a5d54' }}>
                {total.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#8da399' }}>Liefergebühr</span>
              <span className="font-bold" style={{ color: '#4a5d54' }}>
                {DELIVERY_FEE.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: '#f0ede8' }}>
              <span className="font-bold text-lg" style={{ color: '#4a5d54' }}>
                Gesamt
              </span>
              <span className="font-bold text-2xl" style={{ color: '#4a5d54' }}>
                {grandTotal.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            className="w-full mt-4 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#4a5d54' }}
          >
            Zur Kasse →
          </button>
        </div>
      </div>

      {/* Mobile - Floating Button */}
      <button
        onClick={onOpenCart}
        className="lg:hidden fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-40"
        style={{ backgroundColor: '#4a5d54', color: '#fdfcfb' }}
      >
        <ShoppingCart size={24} />
        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: '#8da399' }}>
          {cartCount}
        </span>
        <div className="absolute -bottom-12 right-0 bg-white px-3 py-1 rounded-full shadow-lg font-bold text-sm whitespace-nowrap"
          style={{ color: '#4a5d54' }}>
          {grandTotal.toFixed(2)} €
        </div>
      </button>
    </>
  )
}