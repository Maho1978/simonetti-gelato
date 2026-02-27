import { useState, useEffect } from 'react'
import { Clock, AlertCircle } from 'lucide-react'

interface ShopTimes { isOpen: boolean; openFrom: string; openUntil: string }
interface Status {
  isOpen: boolean; isPreorder: boolean; preorderHint: string
  delivery: ShopTimes; pickup: ShopTimes; message: string; loading: boolean
}

export default function ShopStatusBanner() {
  const [status, setStatus] = useState<Status>({
    isOpen: false, isPreorder: false, preorderHint: '',
    delivery: { isOpen: false, openFrom: '', openUntil: '' },
    pickup:   { isOpen: false, openFrom: '', openUntil: '' },
    message: '', loading: true,
  })

  useEffect(() => {
    const load = () =>
      fetch('/api/shop-status').then(r => r.json())
        .then(d => setStatus({ ...d, loading: false }))
        .catch(() => setStatus(s => ({ ...s, loading: false, isOpen: true })))
    load()
    const iv = setInterval(load, 60000)
    return () => clearInterval(iv)
  }, [])

  if (status.loading) return null
  const { delivery, pickup } = status

  if (!status.isOpen && status.isPreorder) {
    return (
      <div className="bg-blue-50 border-b border-blue-100 py-2 px-4 text-center text-sm text-blue-700 flex items-center justify-center gap-2 flex-wrap">
        <Clock size={14} className="flex-shrink-0 text-blue-500" />
        <span className="font-semibold">Vorbestellung möglich</span>
        {delivery.openFrom && <span className="text-blue-600">· Lieferung ab {delivery.openFrom} Uhr</span>}
      </div>
    )
  }

  if (!status.isOpen) {
    return (
      <div className="bg-red-50 border-b border-red-100 py-2.5 px-4 text-center text-sm text-red-700 flex items-center justify-center gap-2">
        <AlertCircle size={15} className="flex-shrink-0" />
        <span className="font-semibold">Derzeit geschlossen</span>
        {status.message && <span>· {status.message}</span>}
      </div>
    )
  }

  if (delivery.isOpen && pickup.isOpen) {
    return (
      <div className="bg-green-50 border-b border-green-100 py-2 px-4 text-center text-sm text-green-700 flex items-center justify-center gap-3 flex-wrap">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        <span className="font-semibold">Jetzt geöffnet</span>
        <span className="text-green-600">🚗 Lieferung {delivery.openFrom}–{delivery.openUntil} Uhr</span>
        <span className="text-green-400 hidden sm:inline">·</span>
        <span className="text-green-600">🏪 Abholung {pickup.openFrom}–{pickup.openUntil} Uhr</span>
      </div>
    )
  }

  if (delivery.isOpen) {
    return (
      <div className="bg-green-50 border-b border-green-100 py-2 px-4 text-center text-sm text-green-700 flex items-center justify-center gap-2 flex-wrap">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        <span className="font-semibold">🚗 Lieferung geöffnet</span>
        <span className="text-green-600">{delivery.openFrom}–{delivery.openUntil} Uhr</span>
        {pickup.openFrom && <span className="text-green-500 text-xs">· 🏪 Abholung ab {pickup.openFrom} Uhr</span>}
      </div>
    )
  }

  if (pickup.isOpen) {
    return (
      <div className="bg-purple-50 border-b border-purple-100 py-2 px-4 text-center text-sm text-purple-700 flex items-center justify-center gap-2 flex-wrap">
        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
        <span className="font-semibold">🏪 Abholung geöffnet</span>
        <span className="text-purple-600">{pickup.openFrom}–{pickup.openUntil} Uhr</span>
        {delivery.openFrom && <span className="text-purple-400 text-xs">· 🚗 Lieferung ab {delivery.openFrom} Uhr</span>}
      </div>
    )
  }

  return null
}