import { useShopStatus } from '@/hooks/useShopStatus'
import { AlertCircle, Clock } from 'lucide-react'

export default function ShopStatusBanner() {
  const { isOpen, isPreorder, openFrom, openUntil, message, loading } = useShopStatus()

  if (loading) return null

  // Vorbestellung — eigener Banner
  if (isOpen && isPreorder) {
    return (
      <div className="bg-blue-50 border-b border-blue-100 py-2 px-4 text-center text-sm text-blue-700 flex items-center justify-center gap-2">
        <Clock size={14} className="flex-shrink-0 text-blue-500" />
        <span className="font-semibold">Vorbestellung möglich</span>
        {openFrom && (
          <span className="text-blue-600">· Lieferung ab {openFrom} Uhr</span>
        )}
        {message && <span className="text-blue-500 hidden sm:inline">· {message}</span>}
      </div>
    )
  }

  // Normal geöffnet
  if (isOpen) {
    return (
      <div className="bg-green-50 border-b border-green-100 py-2 px-4 text-center text-sm text-green-700 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        <span className="font-semibold">Jetzt geöffnet</span>
        {openFrom && openUntil && (
          <span className="text-green-600">· {openFrom} – {openUntil} Uhr</span>
        )}
        {message && <span className="text-green-500 hidden sm:inline">· {message}</span>}
      </div>
    )
  }

  // Geschlossen
  return (
    <div className="bg-red-50 border-b border-red-100 py-3 px-4 text-center text-sm text-red-700 flex items-center justify-center gap-2">
      <AlertCircle size={15} className="flex-shrink-0" />
      <span className="font-semibold">Derzeit geschlossen</span>
      {message && <span>· {message}</span>}
    </div>
  )
}