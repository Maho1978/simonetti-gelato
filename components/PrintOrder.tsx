import { Printer } from 'lucide-react'

interface Order {
  id: string
  order_number?: string
  customer_name: string
  customer_phone: string
  customer_email: string
  delivery_address: string
  items: any[]
  subtotal: number
  delivery_fee: number
  tip: number
  total: number
  notes?: string
  status: string
  payment_method: string
  created_at: string
}

interface PrintOrderProps {
  order: Order
}

export default function PrintOrder({ order }: PrintOrderProps) {
  
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-lg"
      >
        <Printer size={24} />
        Beleg drucken
      </button>

      {/* Thermal Printer Layout - 80mm (302px width) */}
      <div className="print-only">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-only, .print-only * {
              visibility: visible;
            }
            .print-only {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
          @media screen {
            .print-only {
              display: none;
            }
          }
        `}</style>

        {/* 80mm = 302px width for thermal printers */}
        <div style={{ 
          width: '302px',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '10px',
          lineHeight: '1.4'
        }}>
          
          {/* HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '3px' }}>
              EISCAFE SIMONETTI
            </div>
            <div style={{ fontSize: '11px', marginBottom: '2px' }}>
              Konrad-Adenauer-Platz 2
            </div>
            <div style={{ fontSize: '11px', marginBottom: '2px' }}>
              40764 Langenfeld
            </div>
            <div style={{ fontSize: '11px' }}>
              Tel: 02173 1622780
            </div>
          </div>

          {/* Trennlinie */}
          <div style={{ borderTop: '2px dashed black', margin: '8px 0' }}></div>

          {/* BESTELLNUMMER */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
              #{order.order_number || order.id.substring(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '3px' }}>
              {new Date(order.created_at).toLocaleString('de-DE', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>

          {/* Status */}
          <div style={{ 
            textAlign: 'center', 
            padding: '4px',
            background: '#000',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '11px',
            marginBottom: '8px'
          }}>
            {order.status} | {order.payment_method}
          </div>

          {/* Trennlinie */}
          <div style={{ borderTop: '2px dashed black', margin: '8px 0' }}></div>

          {/* LIEFERADRESSE */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '3px' }}>
              LIEFERADRESSE:
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {order.customer_name}
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              {order.delivery_address}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '3px' }}>
              Tel: {order.customer_phone}
            </div>
          </div>

          {/* Anmerkungen */}
          {order.notes && (
            <div style={{ 
              background: '#f0f0f0', 
              padding: '5px',
              marginBottom: '8px',
              fontSize: '10px',
              border: '1px solid #000'
            }}>
              <strong>HINWEIS:</strong> {order.notes}
            </div>
          )}

          {/* Trennlinie */}
          <div style={{ borderTop: '2px solid black', margin: '8px 0' }}></div>

          {/* ARTIKEL */}
          <div style={{ marginBottom: '8px' }}>
            {order.items.map((item, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                
                {/* Produktname & Preis */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '3px'
                }}>
                  <div style={{ flex: 1 }}>
                    {item.quantity}x {item.name}
                  </div>
                  <div style={{ whiteSpace: 'nowrap', marginLeft: '10px' }}>
                    {(item.price * item.quantity).toFixed(2)} EUR
                  </div>
                </div>

                {/* Sorten */}
                {item.flavors && item.flavors.length > 0 && (
                  <div style={{ 
                    fontSize: '10px',
                    marginLeft: '15px',
                    marginBottom: '2px',
                    fontStyle: 'italic'
                  }}>
                    Sorten: {item.flavors.join(', ')}
                  </div>
                )}

                {/* Extras */}
                {item.extras && item.extras.length > 0 && (
                  <div style={{ 
                    fontSize: '10px',
                    marginLeft: '15px',
                    fontStyle: 'italic'
                  }}>
                    Extras: {item.extras.map((e: any) => e.name).join(', ')}
                  </div>
                )}

                {/* Anmerkungen */}
                {item.notes && (
                  <div style={{ 
                    fontSize: '10px',
                    marginLeft: '15px',
                    marginTop: '2px',
                    fontWeight: 'bold',
                    background: '#f0f0f0',
                    padding: '3px 5px',
                    border: '1px solid #ccc'
                  }}>
                    Hinweis: {item.notes}
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* Trennlinie */}
          <div style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

          {/* SUMMEN */}
          <div style={{ fontSize: '11px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Zwischensumme:</span>
              <span>{order.subtotal.toFixed(2)} EUR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Liefergebuehr:</span>
              <span>{order.delivery_fee.toFixed(2)} EUR</span>
            </div>
            {order.tip > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Trinkgeld:</span>
                <span>{order.tip.toFixed(2)} EUR</span>
              </div>
            )}
          </div>

          {/* Trennlinie */}
          <div style={{ borderTop: '2px solid black', margin: '8px 0' }}></div>

          {/* GESAMT */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            <span>GESAMT:</span>
            <span>{order.total.toFixed(2)} EUR</span>
          </div>

          {/* Trennlinie */}
          <div style={{ borderTop: '2px dashed black', margin: '8px 0' }}></div>

          {/* KONTROLLE */}
          <div style={{ 
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            marginTop: '10px',
            marginBottom: '5px'
          }}>
            [ ] ALLE ARTIKEL KONTROLLIERT
          </div>

          {/* FOOTER */}
          <div style={{ 
            textAlign: 'center',
            fontSize: '9px',
            marginTop: '10px',
            color: '#666'
          }}>
            Gedruckt: {new Date().toLocaleString('de-DE')}
          </div>

          {/* Extra Space for Cutting */}
          <div style={{ height: '20px' }}></div>

        </div>
      </div>
    </>
  )
}