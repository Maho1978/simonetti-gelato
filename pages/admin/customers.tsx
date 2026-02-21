import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { User, Mail, ShoppingBag, Star, Heart, Gift, MessageSquare, X, Search } from 'lucide-react'

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

function CustomersContent() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerNotes(selectedCustomer.user_id)
    }
  }, [selectedCustomer])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login?redirect=/admin/customers')
    }
  }

  const fetchCustomers = async () => {
    setLoading(true)
    const { data } = await supabase
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!newNote.trim() || !selectedCustomer || !session) return

    await supabase.from('customer_notes').insert({
      user_id: selectedCustomer.user_id,
      note: newNote,
      created_by: session.user.id
    })

    setNewNote('')
    fetchCustomerNotes(selectedCustomer.user_id)
  }

  const deleteNote = async (noteId: string) => {
    await supabase.from('customer_notes').delete().eq('id', noteId)
    if (selectedCustomer) fetchCustomerNotes(selectedCustomer.user_id)
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / (target || 10)) * 100, 100)
  }

  const filteredCustomers = customers.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-4 animate-bounce">👥</div>
        <p className="text-gray-500 italic">Lade Kunden-Daten...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold italic text-[#4a5d54]">CRM & Kunden</h1>
          <p className="text-gray-500">{customers.length} registrierte Profile</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Kunden suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl focus:border-[#4a5d54] outline-none transition w-64"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Liste */}
        <div className="lg:col-span-2 space-y-4">
          {filteredCustomers.map(customer => (
            <div
              key={customer.user_id}
              onClick={() => setSelectedCustomer(customer)}
              className={`bg-white rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all ${
                selectedCustomer?.user_id === customer.user_id
                  ? 'border-[#4a5d54] bg-[#f9f8f4]'
                  : 'border-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#4a5d54] text-white flex items-center justify-center font-bold">
                    {customer.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-[#4a5d54]">{customer.email}</div>
                    <div className="text-xs text-[#8da399]">
                      Seit {new Date(customer.last_order_date).toLocaleDateString('de-DE')} aktiv
                    </div>
                  </div>
                </div>
                <div className="text-right text-[#4a5d54]">
                  <div className="text-xl font-black">{customer.total_spent.toFixed(2)} €</div>
                  <div className="text-[10px] uppercase font-bold text-[#8da399]">Lifetime Value</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/50 p-2 rounded-lg text-center border border-gray-50">
                  <div className="font-bold text-sm">{customer.total_orders}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Orders</div>
                </div>
                <div className="bg-white/50 p-2 rounded-lg text-center border border-gray-50">
                  <div className="font-bold text-sm">{customer.avg_order_value.toFixed(2)}€</div>
                  <div className="text-[10px] text-gray-400 uppercase">Ø Wert</div>
                </div>
                <div className="bg-white/50 p-2 rounded-lg text-center border border-gray-50">
                  <div className="font-bold text-sm">{customer.favorite_count}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Favs</div>
                </div>
              </div>

              {/* Progress */}
              <div className="flex justify-between items-center text-[10px] font-bold uppercase mb-1">
                <span className="text-[#8da399]">Points Progress</span>
                <span className="text-[#4a5d54]">{customer.current_points} / {customer.next_reward_at || 10}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#4a5d54] h-full transition-all duration-1000"
                  style={{ width: `${getProgressPercentage(customer.current_points, customer.next_reward_at)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Details */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-display font-bold italic text-[#4a5d54]">Details</h2>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="text-[#8da399]" size={18} />
                  <span className="text-sm font-medium">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Star className="text-[#8da399]" size={18} />
                  <span className="text-sm font-medium">{selectedCustomer.review_count} Rezensionen</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Heart className="text-[#8da399]" size={18} />
                  <span className="text-sm font-medium">{selectedCustomer.favorite_count} gespeicherte Artikel</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold text-[#4a5d54] mb-4 flex items-center gap-2">
                  <MessageSquare size={18} /> CRM Notizen
                </h3>
                
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {customerNotes.map(note => (
                    <div key={note.id} className="bg-[#f9f8f4] p-3 rounded-xl relative group border border-[#4a5d54]/5">
                      <button 
                        onClick={() => deleteNote(note.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-red-400"
                      >
                        <X size={14} />
                      </button>
                      <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
                      <span className="text-[10px] text-gray-400 block mt-2">
                        {new Date(note.created_at).toLocaleString('de-DE')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    placeholder="Interaktion erfassen..."
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 ring-[#4a5d54] outline-none"
                  />
                  <button 
                    onClick={addNote}
                    className="bg-[#4a5d54] text-white px-4 py-2 rounded-xl font-bold hover:scale-105 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
              <User size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">Kunden auswählen für CRM-Details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  return (
    <AdminLayout>
      <CustomersContent />
    </AdminLayout>
  )
}