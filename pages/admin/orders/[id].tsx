import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import PrintOrder from '@/components/PrintOrder'
import { ArrowLeft, Printer, CheckCircle, Truck, Clock } from 'lucide-react'

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadOrder()
  }, [id])

  const loadOrder = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (data) setOrder(data)
    setLoading(false)
  }

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) loadOrder()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">Lädt...</div>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-8">Bestellung nicht gefunden</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-5xl">
          
          {/* Header */}
          <button
            onClick={() => router.push('/admin/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition"
          >
            <ArrowLeft size={20} />
            Zurück zu Bestellungen
          </button>

          <h1 className="text-3xl font-display font-bold italic mb-8">
            Bestellung #{order.order_number || order.id.substring(0, 8).toUpperCase()}
          </h1>

          {/* Status Buttons */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Status ändern</h2>
            <div className="flex gap-3">
              <button
                onClick={() => updateStatus('OFFEN')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  order.status === 'OFFEN'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Clock size={16} className="inline mr-2" />
                Offen
              </button>
              <button
                onClick={() => updateStatus('IN_BEARBEITUNG')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  order.status === 'IN_BEARBEITUNG'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                In Bearbeitung
              </button>
              <button
                onClick={() => updateStatus('AN_FAHRER')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  order.status === 'AN_FAHRER'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Truck size={16} className="inline mr-2" />
                An Fahrer
              </button>
              <button
                onClick={() => updateStatus('GELIEFERT')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  order.status === 'GELIEFERT'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CheckCircle size={16} className="inline mr-2" />
                Geliefert
              </button>
            </div>
          </div>

          {/* Print Buttons */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">
              <Printer size={20} className="inline mr-2" />
              Belege drucken
            </h2>
            <div className="flex gap-3">
              <PrintOrder order={order} type="kitchen" />
              <PrintOrder order={order} type="driver" />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              💡 Tipp: Küchen-Beleg für die Zubereitung, Liefer-Beleg für den Fahrer (mit Adresse & Kontakt)
            </p>
          </div>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Kundeninformationen */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-bold text-lg mb-4">Kundeninformationen</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {order.customer_name}</p>
                <p><strong>Telefon:</strong> {order.customer_phone}</p>
                <p><strong>Email:</strong> {order.customer_email}</p>
                <p><strong>Adresse:</strong> {order.delivery_address}</p>
                {order.notes && (
                  <p><strong>Anmerkungen:</strong> {order.notes}</p>
                )}
              </div>
            </div>

            {/* Bestellinformationen */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-bold text-lg mb-4">Bestellinformationen</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Bestellzeit:</strong> {new Date(order.created_at).toLocaleString('de-DE')}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Zahlungsart:</strong> {order.payment_method}</p>
                <p><strong>Payment Intent:</strong> {order.payment_intent_id}</p>
              </div>
            </div>

          </div>

          {/* Artikel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <h2 className="font-bold text-lg mb-4">Bestellte Artikel</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">
                        {item.quantity}x {item.name}
                      </div>
                      {item.flavors && item.flavors.length > 0 && (
                        <div className="text-sm text-gray-600 ml-4 mt-1">
                          🍦 {item.flavors.join(', ')}
                        </div>
                      )}
                      {item.extras && item.extras.length > 0 && (
                        <div className="text-sm text-gray-600 ml-4 mt-1">
                          ➕ {item.extras.map((e: any) => e.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="font-bold">
                      {(item.price * item.quantity).toFixed(2)} €
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summen */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Zwischensumme:</span>
                <span>{order.subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Liefergebühr:</span>
                <span>{order.delivery_fee.toFixed(2)} €</span>
              </div>
              {order.tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Trinkgeld:</span>
                  <span>{order.tip.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-4 border-t border-gray-200">
                <span>Gesamt:</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}