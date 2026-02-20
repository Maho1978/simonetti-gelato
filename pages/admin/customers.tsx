import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ChevronLeft, User, Mail, ShoppingBag, Star, Heart, Gift, MessageSquare, X } from 'lucide-react'

interface Customer {
  user_id: string
  email: string
  total_orders: number
  total_spent: number
  avg_order_value: number
  last_order_date: string
  current_points: number
  next_reward_at: number
  favorite_count: number
  review_count: number
}

interface CustomerNote {
  id: string
  note: string
  created_at: string
}

export default function Customers({ session }: { session: Session | null }) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/admin/customers')
      return
    }
    fetchCustomers()
  }, [session])

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerNotes(selectedCustomer.user_id)
    }
  }, [selectedCustomer])

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customer_stats')
      .select('*')
      .order('total_spent', { ascending: false })

    if (data) setCustomers(data)
    setLoading(false)
  }

  const fetchCustomerNotes = async (userId: string) => {
    const { data } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (data) setCustomerNotes(data)
  }

  const addNote = async () => {
    if (!newNote.trim() || !selectedCustomer) return

    await supabase.from('customer_notes').insert({
      user_id: selectedCustomer.user_id,
      note: newNote,
      created_by: session?.user?.id
    })

    setNewNote('')
    fetchCustomerNotes(selectedCustomer.user_id)
  }

  const deleteNote = async (noteId: string) => {
    await supabase.from('customer_notes').delete().eq('id', noteId)
    if (selectedCustomer) fetchCustomerNotes(selectedCustomer.user_id)
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdfcfb' }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">👥</div>
          <div className="font-display italic text-xl" style={{ color: '#4a5d54' }}>Lade Kunden...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <button 
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-[#8da399] font-bold text-sm mb-6 hover:text-[#4a5d54] transition"
        >
          <ChevronLeft size={18} /> ZURÜCK ZUM ADMIN
        </button>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-5xl font-display font-bold italic" style={{ color: '#4a5d54' }}>
              Kunden-Übersicht
            </h1>
            <p className="text-lg mt-1" style={{ color: '#8da399' }}>
              {customers.length} Kunden • {customers.reduce((sum, c) => sum + c.total_orders, 0)} Bestellungen
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Kunden-Liste */}
          <div className="lg:col-span-2 space-y-3">
            {customers.map(customer => {
              const progressPercent = getProgressPercentage(customer.current_points || 0, customer.next_reward_at || 10)

              return (
                <div
                  key={customer.user_id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`bg-white rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all ${
                    selectedCustomer?.user_id === customer.user_id
                      ? 'border-[#4a5d54] shadow-md'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: '#4a5d54' }}>
                        {customer.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-lg" style={{ color: '#4a5d54' }}>
                          {customer.email}
                        </div>
                        {customer.last_order_date && (
                          <div className="text-xs text-gray-400">
                            Letzte Bestellung: {new Date(customer.last_order_date).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statistiken */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: '#4a5d54' }}>
                        {customer.total_orders || 0}
                      </div>
                      <div className="text-xs text-gray-400">Bestellungen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: '#4a5d54' }}>
                        {(customer.total_spent || 0).toFixed(0)} €
                      </div>
                      <div className="text-xs text-gray-400">Umsatz</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: '#4a5d54' }}>
                        {(customer.avg_order_value || 0).toFixed(0)} €
                      </div>
                      <div className="text-xs text-gray-400">Ø Wert</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: '#4a5d54' }}>
                        {customer.favorite_count || 0}
                      </div>
                      <div className="text-xs text-gray-400">Favoriten</div>
                    </div>
                  </div>

                  {/* Treue-Fortschritt */}
                  {customer.total_orders > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold" style={{ color: '#8da399' }}>
                          <Gift size={12} className="inline mr-1" />
                          Treueprogramm
                        </span>
                        <span className="font-bold" style={{ color: '#4a5d54' }}>
                          {customer.current_points || 0} / {customer.next_reward_at || 10}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: '#4a5d54'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detail-Panel */}
          <div className="lg:col-span-1">
            {selectedCustomer ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold" style={{ color: '#4a5d54' }}>
                    Kunden-Details
                  </h3>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Mail size={16} style={{ color: '#8da399' }} />
                    <span className="text-sm">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} style={{ color: '#8da399' }} />
                    <span className="text-sm">{selectedCustomer.total_orders} Bestellungen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart size={16} style={{ color: '#8da399' }} />
                    <span className="text-sm">{selectedCustomer.favorite_count} Favoriten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={16} style={{ color: '#8da399' }} />
                    <span className="text-sm">{selectedCustomer.review_count} Bewertungen</span>
                  </div>
                </div>

                {/* Notizen */}
                <div className="border-t pt-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#4a5d54' }}>
                    <MessageSquare size={16} />
                    Notizen
                  </h4>

                  <div className="space-y-2 mb-3">
                    {customerNotes.map(note => (
                      <div key={note.id} className="bg-gray-50 p-3 rounded-lg relative group">
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-white rounded"
                        >
                          <X size={12} />
                        </button>
                        <div className="text-sm text-gray-700 pr-6">{note.note}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(note.created_at).toLocaleString('de-DE')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addNote()}
                      placeholder="Neue Notiz..."
                      className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#4a5d54] focus:outline-none"
                    />
                    <button
                      onClick={addNote}
                      className="px-4 py-2 rounded-lg text-white font-bold text-sm"
                      style={{ backgroundColor: '#4a5d54' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <User size={48} className="mx-auto mb-3" style={{ color: '#8da399' }} />
                <p className="text-gray-400">Wähle einen Kunden aus</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}