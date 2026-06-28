import { Banknote } from 'lucide-react'

const METHODS = [
  { id: 'visa',       label: 'Visa',         src: '/icons/payments/visa.svg' },
  { id: 'mastercard', label: 'Mastercard',    src: '/icons/payments/mastercard.svg' },
  { id: 'paypal',     label: 'PayPal',        src: '/icons/payments/paypal.svg' },
  { id: 'apple-pay',  label: 'Apple Pay',     src: '/icons/payments/apple-pay.svg' },
  { id: 'google-pay', label: 'Google Pay',    src: '/icons/payments/google-pay.svg' },
  { id: 'link',       label: 'Link by Stripe',src: '/icons/payments/link.svg' },
]

interface Props {
  variant: 'footer' | 'cart'
}

export default function PaymentMethods({ variant }: Props) {
  const isCart = variant === 'cart'

  return (
    <div className={isCart ? '' : 'border-t border-[rgba(196,151,58,0.2)] pt-5'}>
      {isCart && (
        <p className="text-xs font-cinzel tracking-widest text-[#C4973A] uppercase mb-3">
          Sicher bezahlen mit
        </p>
      )}
      <div className="flex flex-wrap gap-2 md:gap-3 items-center">
        <div
          className="flex items-center gap-1.5 bg-[#f5f5f5] rounded-md px-[10px] py-[6px]"
          title="Barzahlung bei Lieferung"
        >
          <Banknote size={isCart ? 18 : 16} color="#C4973A" />
          <span className="text-xs font-medium text-gray-600 leading-none">Bar</span>
        </div>
        {METHODS.map(({ id, label, src }) => (
          <div
            key={id}
            className="flex items-center justify-center bg-[#f5f5f5] rounded-md px-[10px] py-[6px]"
            title={label}
          >
            <img
              src={src}
              alt={label}
              className={`block object-contain ${isCart ? 'h-5 md:h-8' : 'h-5 md:h-6'}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
