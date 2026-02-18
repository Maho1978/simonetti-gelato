import { X, Minus, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  icon: string
  quantity: number
}

interface CartProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateQuantity: (productId: string, change: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  total: number
  session: Session | null
}

const DELIVERY_FEE = 3.00
const MINIMUM_ORDER = 15.00

export default function Cart({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  total,
  session,
}: CartProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [tipPercentage, setTipPercentage] = useState(0)
  const [customTip, setCustomTip] = useState('')

  const tipAmount = tipPercentage === -1 
    ? parseFloat(customTip) || 0 
    : (total * tipPercentage / 100)

  const grandTotal = total + DELIVERY_FEE + tipAmount
  const isMinimumMet = total >= MINIMUM_ORDER
  const remainingForMinimum = MINIMUM_ORDER - total

  const handleCheckout = () => {
    if (cart.length === 0 || !isMinimumMet) return

    // Save tip to localStorage for checkout
    localStorage.setItem('orderTip', tipAmount.toFixed(2))

    if (session) {
      router.push('/checkout')
    } else {
      router.push('/auth/login?redirect=/checkout')
    }
    onClose()
  }

  const handleGuestCheckout = () => {
    if (cart.length === 0 || !isMinimumMet) return
    
    localStorage.setItem('orderTip', tipAmount.toFixed(2))
    router.push('/checkout?guest=true')
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Cart Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-display font-bold">Dein Warenkorb</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-300"
            >
              <X size={24} />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4">🛒</div>
              <p className="text-xl text-gray-500">Dein Warenkorb ist leer</p>
              <button
                onClick={onClose}
                className="mt-6 btn-primary"
              >
                Weiter einkaufen
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl"
                  >
                    <div className="text-5xl">{item.icon}</div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-primary font-bold">
                        {item.price.toFixed(2)} €
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-2 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="font-bold text-lg w-8 text-center">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-2 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300"
                      >
                        <Plus size={16} />
                      </button>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 ml-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-900 text-white p-6 rounded-2xl space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Zwischensumme:</span>
                  <span>{total.toFixed(2)} €</span>
                </div>

                <div className="flex justify-between text-lg">
                  <span>Lieferung:</span>
                  <span>{DELIVERY_FEE.toFixed(2)} €</span>
                </div>

                {/* Tip Selection */}
                <div className="border-t border-gray-700 pt-3">
                  <div className="text-lg mb-3">Trinkgeld (optional):</div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => { setTipPercentage(0); setCustomTip('') }}
                      className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                        tipPercentage === 0
                          ? 'bg-secondary text-dark'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      Kein
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipPercentage(5); setCustomTip('') }}
                      className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                        tipPercentage === 5
                          ? 'bg-secondary text-dark'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipPercentage(10); setCustomTip('') }}
                      className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                        tipPercentage === 10
                          ? 'bg-secondary text-dark'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipPercentage(15); setCustomTip('') }}
                      className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                        tipPercentage === 15
                          ? 'bg-secondary text-dark'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      15%
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setTipPercentage(-1)}
                      className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                        tipPercentage === -1
                          ? 'bg-secondary text-dark'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      Eigener Betrag
                    </button>
                    {tipPercentage === -1 && (
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={customTip}
                        onChange={(e) => setCustomTip(e.target.value)}
                        placeholder="€"
                        className="flex-1 py-2 px-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-secondary focus:outline-none"
                      />
                    )}
                  </div>

                  {tipAmount > 0 && (
                    <div className="flex justify-between mt-3 text-secondary">
                      <span>Trinkgeld:</span>
                      <span>+{tipAmount.toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Gesamt:</span>
                    <span>{grandTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Minimum Order Warning */}
              {!isMinimumMet && (
                <div className="bg-yellow-50 border-2 border-yellow-300 text-yellow-900 p-4 rounded-xl flex items-start space-x-3 mt-4">
                  <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Mindestbestellwert nicht erreicht</div>
                    <div>Noch <strong>{remainingForMinimum.toFixed(2)} €</strong> bis zur Bestellung (Mindestens {MINIMUM_ORDER.toFixed(2)} €)</div>
                  </div>
                </div>
              )}

              {/* Checkout Buttons */}
              <div className="mt-6 space-y-3">
                {session ? (
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || !isMinimumMet}
                    className={`w-full text-lg ${
                      !isMinimumMet 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'btn-secondary'
                    }`}
                  >
                    {!isMinimumMet ? 'Mindestbestellwert nicht erreicht' : 'Zur Kasse'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCheckout}
                      disabled={!isMinimumMet}
                      className={`w-full text-lg ${
                        !isMinimumMet 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'btn-primary'
                      }`}
                    >
                      {!isMinimumMet ? 'Mindestbestellwert nicht erreicht' : 'Als Kunde zur Kasse'}
                    </button>
                    <button
                      onClick={handleGuestCheckout}
                      disabled={!isMinimumMet}
                      className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 ${
                        !isMinimumMet
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      Als Gast bestellen
                    </button>
                  </>
                )}

                <button
                  onClick={onClearCart}
                  className="w-full text-red-500 hover:bg-red-50 py-3 rounded-xl transition-colors duration-300"
                >
                  Warenkorb leeren
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
