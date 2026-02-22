// pages/admin/customers.tsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import {
  User, Phone, Mail, MapPin, ShoppingBag, Euro,
  Search, ChevronDown, ChevronUp, MessageSquare, X, Plus, Trash2
} from 'lucide-react'

interface Order {
  id: string
  order_number: string
  created_at: string
  total: number
  status: string
  items: any[]
}

interface Note {
  id: string
  text: string
  created_at: string
}

interface Customer {
  email: string
  name: string
  phone: string
  orders: Order[]
  notes: Note[]
  totalSpent: number
  orderCount: number
  lastOrder: string | null
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    OFFEN:          { label: 'Offen',         color: 'bg-red-100 text-red-700' },
    IN_BEARBEITUNG: { label: 'In Arbeit',      color: 'bg-blue-100 text-blue-700' },
    AN_FAHRER:      { label: 'Unterwegs',      color: 'bg-orange-100 text-orange-700' },
    GELIEFERT:      { label: 'Geliefert',      color: 'bg-green-100 text-green-700' },
    ABGELEHNT:      { label: 'Abgelehnt',      color: 'bg-gray-100 text-gray-500' },
  }
  const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-500' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>
}

function CustomerRow({ customer, onSelect, isSelected }: {
  customer: Customer; onSelect: () => void; isSelected: boolean
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 cursor-pointer transition hover:shadow-md
        ${isSelected ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm flex-shrink-0">
            {customer.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-bold text-gray-900">{customer.name || '–'}</div>
            <div className="text-xs text-gray-400 flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1"><Mail size={10} /> {customer.email}</span>
              {customer.phone && <span className="flex items-center gap-1"><Phone size={10} /> {customer.phone}</span>}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className="font-bold text-green-600">{customer.totalSpent.toFixed(2)} €</div>
          <div className="text-xs text-gray-400">{customer.orderCount} Bestellung{customer.orderCount !== 1 ? 'en' : ''}</div>
        </div>
        <div className="ml-3 text-gray-300">
          {isSelected ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
    </div>
  )
}

function CustomerDetail({ customer, onClose, onNoteAdd, onNoteDelete }: {
  customer: Customer
  onClose: () => void
  onNoteAdd: (email: string, text: string) => Promise<void>
  onNoteDelete: (email: string, noteId: string) => Promise<void>
}) {
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSavingNote(true)
    await onNoteAdd(customer.email, newNote.trim())
    setNewNote('')
    setSavingNote(false)
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-xl">
            {customer.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-black text-lg">{customer.name || '–'}</div>
            <div className="text-gray-300 text-sm">{customer.email}</div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition"><X size={20} /></button>
      </div>

      <div className="p-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="font-black text-xl text-green-600">{customer.totalSpent.toFixed(2)} €</div>
            <div className="text-xs text-gray-500">Gesamtumsatz</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="font-black text-xl text-blue-600">{customer.orderCount}</div>
            <div className="text-xs text-gray-500">Bestellungen</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <div className="font-black text-xl text-purple-600">
              {customer.orderCount > 0 ? (customer.totalSpent / customer.orderCount).toFixed(2) : '0.00'} €
            </div>
            <div className="text-xs text-gray-500">Ø Bestellwert</div>
          </div>
        </div>

        {/* Kontakt */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-2">Kontakt</div>
          <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-gray-400" />{customer.email}</div>
          {customer.phone && <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-gray-400" /><a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">{customer.phone}</a></div>}
          {customer.lastOrder && <div className="flex items-center gap-2 text-sm text-gray-500"><ShoppingBag size={14} className="text-gray-400" />Letzte Bestellung: {new Date(customer.lastOrder).toLocaleDateString('de-DE')}</div>}
        </div>

        {/* Bestellhistorie */}
        <div>
          <div className="font-bold text-sm mb-3 flex items-center gap-2">
            <ShoppingBag size={16} /> Bestellhistorie ({customer.orders.length})
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {customer.orders.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4">Keine Bestellungen</div>
            ) : customer.orders.map(order => (
              <div key={order.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">#{order.order_number || order.id.slice(-6).toUpperCase()}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(order.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-bold text-gray-900">{(order.total || 0).toFixed(2)} €</span>
                </div>
                {order.items?.length > 0 && (
                  <div className="mt-1.5 text-xs text-gray-400">
                    {order.items.map((item: any, i: number) => (
                      <span key={i}>{item.quantity}x {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notizen */}
        <div>
          <div className="font-bold text-sm mb-3 flex items-center gap-2">
            <MessageSquare size={16} /> Notizen
          </div>
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {customer.notes.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-2">Noch keine Notizen</div>
            ) : customer.notes.map(note => (
              <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm text-gray-800">{note.text}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(note.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button onClick={() => onNoteDelete(customer.email, note.id)} className="text-gray-300 hover:text-red-500 transition flex-shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              placeholder="Neue Notiz..."
              className="flex-1 text-sm border-2 border-gray-200 rounded-xl px-3 py-2 focus:border-black focus:outline-none"
            />
            <button
              onClick={handleAddNote}
              disabled={savingNote || !newNote.trim()}
              className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-900 disabled:opacity-40 transition flex items-center gap-1">
              <Plus size={14} /> Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers]       = useState<Customer[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [sortBy, setSortBy]             = useState<'name' | 'spent' | 'orders' | 'last'>('spent')

  const loadCustomers = useCallback(async () => {
    setLoading(true)

    // Alle Bestellungen laden
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .not('customer_email', 'is', null)
      .order('created_at', { ascending: false })

    // Alle Notizen laden
    const { data: notesData } = await supabase
      .from('customer_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!orders) { setLoading(false); return }

    // Kunden aus Bestellungen aggregieren
    const customerMap: Record<string, Customer> = {}

    for (const order of orders) {
      const email = order.customer_email
      if (!email) continue

      if (!customerMap[email]) {
        customerMap[email] = {
          email,
          name:        order.customer_name || '–',
          phone:       order.customer_phone || '',
          orders:      [],
          notes:       [],
          totalSpent:  0,
          orderCount:  0,
          lastOrder:   null,
        }
      }

      const c = customerMap[email]
      c.orders.push(order)

      if (order.status === 'GELIEFERT') {
        c.totalSpent += order.total || 0
        c.orderCount++
      }

      if (!c.lastOrder || new Date(order.created_at) > new Date(c.lastOrder)) {
        c.lastOrder = order.created_at
      }

      // Neuesten Namen / Telefon verwenden
      if (order.customer_name && order.customer_name !== '–') c.name  = order.customer_name
      if (order.customer_phone)                                c.phone = order.customer_phone
    }

    // Notizen zuordnen
    if (notesData) {
      for (const note of notesData) {
        if (customerMap[note.customer_email]) {
          customerMap[note.customer_email].notes.push({
            id:         note.id,
            text:       note.note,
            created_at: note.created_at,
          })
        }
      }
    }

    setCustomers(Object.values(customerMap))
    setLoading(false)
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  const handleAddNote = async (email: string, text: string) => {
    const { error } = await supabase
      .from('customer_notes')
      .insert({ customer_email: email, note: text })
    if (!error) await loadCustomers()
  }

  const handleDeleteNote = async (email: string, noteId: string) => {
    if (!confirm('Notiz löschen?')) return
    await supabase.from('customer_notes').delete().eq('id', noteId)
    await loadCustomers()
  }

  // Filter + Sort
  const filtered = customers
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'name')   return a.name.localeCompare(b.name)
      if (sortBy === 'spent')  return b.totalSpent - a.totalSpent
      if (sortBy === 'orders') return b.orderCount - a.orderCount
      if (sortBy === 'last')   return new Date(b.lastOrder || 0).getTime() - new Date(a.lastOrder || 0).getTime()
      return 0
    })

  const selected = customers.find(c => c.email === selectedEmail) || null

  const totalRevenue  = customers.reduce((s, c) => s + c.totalSpent, 0)
  const totalOrders   = customers.reduce((s, c) => s + c.orderCount, 0)
  const repeatBuyers  = customers.filter(c => c.orderCount > 1).length

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><User size={24} /> Kundenverwaltung</h1>
            <p className="text-gray-400 text-sm mt-0.5">{customers.length} Kunden gesamt</p>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-black text-green-600">{totalRevenue.toFixed(2)} €</div>
            <div className="text-xs text-gray-500 mt-0.5">Gesamtumsatz</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-black">{customers.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Kunden</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-black text-blue-600">{repeatBuyers}</div>
            <div className="text-xs text-gray-500 mt-0.5">Stammkunden (2+ Bestellungen)</div>
          </div>
        </div>

        <div className={`grid gap-6 ${selected ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Linke Spalte – Kundenliste */}
          <div>
            {/* Suche + Sort */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name, Email oder Telefon..."
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none"
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none">
                <option value="spent">Nach Umsatz</option>
                <option value="orders">Nach Bestellungen</option>
                <option value="last">Zuletzt aktiv</option>
                <option value="name">Nach Name</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48"><div className="text-5xl animate-pulse">🍦</div></div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-gray-400 py-16">Keine Kunden gefunden.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map(c => (
                  <CustomerRow
                    key={c.email}
                    customer={c}
                    isSelected={c.email === selectedEmail}
                    onSelect={() => setSelectedEmail(c.email === selectedEmail ? null : c.email)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Rechte Spalte – Detail */}
          {selected && (
            <div className="sticky top-6">
              <CustomerDetail
                customer={selected}
                onClose={() => setSelectedEmail(null)}
                onNoteAdd={handleAddNote}
                onNoteDelete={handleDeleteNote}
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}