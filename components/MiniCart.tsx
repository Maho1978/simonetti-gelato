import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/router'

interface CartItem {
  cartId: string
  id: string
  name: string
  price: number
  quantity: number
  selectedFlavors?: string[]
  selectedExtras?: { id: string; name: string; price: number }[]
  totalPrice: number
  notes?: string
}

interface MiniCartProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateQuantity: (cartId: string, newQuantity: number) => void
  onRemoveItem: (cartId: string) => void
  onUpdateNotes: (cartId: string, notes: string) => void
  onClearCart: () => void
  total: number
}

export default function MiniCart({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onClearCart,
  total
}: MiniCartProps) {
  const router = useRouter()

  const handleCheckout = () => {
    router.push('/checkout-login')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out"
           style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag size={24} />
            Warenkorb ({cart.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500 text-lg">Dein Warenkorb ist leer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.cartId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.price.toFixed(2)} € / Stück</p>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.cartId)}
                      className="p-2 hover:bg-red-100 rounded-full transition text-red-600"
                      title="Entfernen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Sorten */}
                  {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                    <div className="mb-2 text-sm">
                      <span className="font-semibold">Sorten:</span>
                      <div className="text-gray-700 ml-2">
                        🍦 {item.selectedFlavors.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Extras */}
                  {item.selectedExtras && item.selectedExtras.length > 0 && (
                    <div className="mb-2 text-sm">
                      <span className="font-semibold">Extras:</span>
                      <div className="text-gray-700 ml-2">
                        {item.selectedExtras.map(extra => (
                          <div key={extra.id}>
                            ➕ {extra.name} (+{extra.price.toFixed(2)} €)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anmerkungen Input – FIX: stopPropagation verhindert dass der Overlay-Click das Tippen blockiert */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      💬 Anmerkungen (optional)
                    </label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => {
                        e.stopPropagation()
                        onUpdateNotes(item.cartId, e.target.value)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="z.B. weniger süß, extra kalt..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                    />
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold transition"
                      >
                        −
                      </button>
                      <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold transition"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-bold text-xl">
                      {(item.totalPrice || (item.price * item.quantity)).toFixed(2)} €
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
            
            {/* Clear Cart */}
            <button
              onClick={onClearCart}
              className="w-full text-sm text-red-600 hover:text-red-700 font-semibold transition"
            >
              Warenkorb leeren
            </button>

            {/* Total */}
            <div className="flex items-center justify-between text-2xl font-bold border-t border-gray-200 pt-4">
              <span>Zwischensumme:</span>
              <span>{total.toFixed(2)} €</span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-black text-white font-bold text-lg rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2"
            >
              Zur Kasse
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}