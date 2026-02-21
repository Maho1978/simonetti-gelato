import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Plus, Trash2, Check, Edit2, Home } from 'lucide-react'

interface Address {
  id: string
  label: string
  name: string
  phone: string
  street: string
  house_number: string
  postal_code: string
  city: string
  notes?: string
  is_default: boolean
}

interface AddressPickerProps {
  session: any
  onSelectAddress: (address: Address) => void
  selectedAddressId?: string
}

export default function AddressPicker({ session, onSelectAddress, selectedAddressId }: AddressPickerProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [newAddress, setNewAddress] = useState({
    label: '',
    name: session?.user?.user_metadata?.name || '',
    phone: session?.user?.user_metadata?.phone || '',
    street: '',
    house_number: '',
    postal_code: '40764',
    city: 'Langenfeld',
    notes: '',
    is_default: false
  })

  useEffect(() => {
    if (session) {
      loadAddresses()
    }
  }, [session])

  const loadAddresses = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      setAddresses(data)
      // Auto-select default address
      const defaultAddr = data.find(a => a.is_default)
      if (defaultAddr && !selectedAddressId) {
        onSelectAddress(defaultAddr)
      }
    }
    setLoading(false)
  }

  const handleSaveAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.house_number) {
      alert('Bitte alle Pflichtfelder ausfüllen!')
      return
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: session.user.id,
        ...newAddress
      })
      .select()
      .single()

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } else {
      setAddresses([data, ...addresses])
      setShowNewForm(false)
      setNewAddress({
        label: '',
        name: session?.user?.user_metadata?.name || '',
        phone: session?.user?.user_metadata?.phone || '',
        street: '',
        house_number: '',
        postal_code: '40764',
        city: 'Langenfeld',
        notes: '',
        is_default: false
      })
      onSelectAddress(data)
    }
  }

  const handleSetDefault = async (id: string) => {
    // Entferne Default von allen anderen
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', session.user.id)

    // Setze neue Default
    await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', id)

    loadAddresses()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Adresse wirklich löschen?')) return

    await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id)

    loadAddresses()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MapPin size={20} />
          Lieferadresse wählen
        </h3>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
        >
          <Plus size={16} />
          Neue Adresse
        </button>
      </div>

      {/* Neue Adresse Formular */}
      {showNewForm && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
          <h4 className="font-bold">Neue Adresse hinzufügen</h4>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Label (optional)</label>
              <input
                type="text"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                placeholder="z.B. Zuhause, Büro, Eltern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Name *</label>
              <input
                type="text"
                required
                value={newAddress.name}
                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Telefon *</label>
              <input
                type="tel"
                required
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Straße *</label>
              <input
                type="text"
                required
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Hausnummer *</label>
              <input
                type="text"
                required
                value={newAddress.house_number}
                onChange={(e) => setNewAddress({ ...newAddress, house_number: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Anmerkungen</label>
              <input
                type="text"
                value={newAddress.notes}
                onChange={(e) => setNewAddress({ ...newAddress, notes: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                placeholder="z.B. Klingel Name..."
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAddress.is_default}
                onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-sm font-semibold">Als Standard-Adresse speichern</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveAddress}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Speichern
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Gespeicherte Adressen */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Lädt Adressen...</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Noch keine gespeicherten Adressen</p>
          <p className="text-sm text-gray-400 mt-2">Klicke auf "Neue Adresse" um eine hinzuzufügen</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {addresses.map(addr => (
            <div
              key={addr.id}
              onClick={() => onSelectAddress(addr)}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition ${
                selectedAddressId === addr.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {/* Ausgewählt Badge */}
              {selectedAddressId === addr.id && (
                <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-1">
                  <Check size={16} />
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    {addr.label && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded">
                        {addr.label}
                      </span>
                    )}
                    {addr.is_default && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1">
                        <Home size={12} />
                        Standard
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-lg mt-2">{addr.name}</h4>
                  <p className="text-sm text-gray-600">{addr.phone}</p>
                </div>
              </div>

              <p className="text-gray-700 mb-1">
                {addr.street} {addr.house_number}
              </p>
              <p className="text-gray-700 mb-3">
                {addr.postal_code} {addr.city}
              </p>

              {addr.notes && (
                <p className="text-xs text-gray-500 mb-3">💬 {addr.notes}</p>
              )}

              <div className="flex gap-2">
                {!addr.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetDefault(addr.id)
                    }}
                    className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition font-semibold"
                  >
                    Als Standard
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(addr.id)
                  }}
                  className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition font-semibold flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}