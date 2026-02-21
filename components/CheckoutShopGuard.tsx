import { useState, useEffect } from 'react'
import { AlertCircle, Clock } from 'lucide-react'

interface ShopStatus {
  isOpen: boolean
  openFrom?: string
  openUntil?: string
  message: string
}

interface Props {
  onStatusLoaded?: (isOpen: boolean) => void
}

export default function CheckoutShopGuard({ onStatusLoaded }: Props) {
  const [status, setStatus] = useState<ShopStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shop-status')
      .then(r => r.json())
      .then(data => {
        setStatus(data)
        onStatusLoaded?.(data.isOpen)
        setLoading(false)
      })
      .catch(() => {
        // Im Fehlerfall offen lassen
        setStatus({ isOpen: true, message: '' })
        onStatusLoaded?.(true)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
      <Clock size={16} className="animate-pulse" />
      Öffnungszeiten werden geprüft...
    </div>
  )

  if (!status || status.isOpen) return null

  // Shop ist geschlossen - Sperrblock anzeigen
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center mb-6">
      <div className="text-4xl mb-3">🔒</div>
      <h3 className="font-bold text-red-800 text-lg mb-2">Shop momentan geschlossen</h3>
      <p className="text-red-600 text-sm mb-1">{status.message}</p>
      {status.openFrom && status.openUntil && (
        <p className="text-red-500 text-xs mt-2">
          Nächste Öffnung: {status.openFrom} – {status.openUntil} Uhr
        </p>
      )}
    </div>
  )
}