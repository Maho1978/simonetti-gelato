import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ChevronLeft, Plus, Edit2, Trash2, Copy, Check, X } from 'lucide-react'

interface Voucher {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value: number
  max_uses: number
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export default function Vouchers({ session }: { session: Session | null }) {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_order_value: 0,
    max_uses: 100,
    valid_until: '',
    is_active: true
  })
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/admin/vouchers')
      return
    }
    fetchVouchers()
  }, [session])

  const fetchVouchers = async () => {
    const { data } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setVouchers(data)
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_order_value: formData.min_order_value,
      max_uses: formData.max_uses,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active
    }

    if (editingVoucher) {
      await supabase
        .from('vouchers')
        .update(data)
        .eq('id', editingVoucher.id)
    } else {
      await supabase.from('vouchers').insert(data)
    }

    setShowModal(false)
    setEditingVoucher(null)
    resetForm()
    fetchVouchers()
  }

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher)
    setFormData({
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      min_order_value: voucher.min_order_value,
      max_uses: voucher.max_uses,
      valid_until: voucher.valid_until ? voucher.valid_until.split('T')[0] : '',
      is_active: voucher.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Gutschein wirklich löschen?')) return
    await supabase.from('vouchers').delete().eq('id', id)
    fetchVouchers()
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('vouchers').update({ is_active: !isActive }).eq('id', id)
    fetchVouchers()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_value: 0,
      max_uses: 100,
      valid_until: '',
      is_active: true
    })
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
              Gutscheine
            </h1>
            <p className="text-lg mt-1" style={{ color: '#8da399' }}>
              {vouchers.length} Gutscheine erstellt
            </p>
          </div>
          <button
            onClick={() => { setShowModal(true); resetForm(); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#4a5d54' }}
          >
            <Plus size={20} />
            Neuer Gutschein
          </button>
        </div>

        {/* Gutschein-Liste */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map(voucher => {
            const isExpired = voucher.valid_until && new Date(voucher.valid_until) < new Date()
            const isExhausted = voucher.current_uses >= voucher.max_uses

            return (
              <div
                key={voucher.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                  voucher.is_active && !isExpired && !isExhausted
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyCode(voucher.code)}
                      className="px-4 py-2 bg-gradient-to-r from-[#4a5d54] to-[#8da399] text-white rounded-lg font-bold text-lg tracking-wider hover:opacity-90 transition flex items-center gap-2"
                    >
                      {voucher.code}
                      {copied === voucher.code ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(voucher)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Edit2 size={16} style={{ color: '#4a5d54' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(voucher.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Rabatt */}
                <div className="mb-4">
                  <div className="text-4xl font-bold mb-1" style={{ color: '#4a5d54' }}>
                    {voucher.discount_type === 'percentage' 
                      ? `${voucher.discount_value}%`
                      : `${voucher.discount_value}€`
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    {voucher.discount_type === 'percentage' ? 'Prozentual' : 'Festbetrag'}
                  </div>
                </div>

                {/* Infos */}
                <div className="space-y-2 text-sm mb-4">
                  {voucher.min_order_value > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mindestbestellwert:</span>
                      <span className="font-bold">{voucher.min_order_value}€</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Einlösungen:</span>
                    <span className="font-bold">
                      {voucher.current_uses} / {voucher.max_uses}
                    </span>
                  </div>
                  {voucher.valid_until && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gültig bis:</span>
                      <span className="font-bold">
                        {new Date(voucher.valid_until).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {isExpired && <span className="text-xs font-bold text-red-500">⏰ Abgelaufen</span>}
                    {isExhausted && <span className="text-xs font-bold text-orange-500">⚠️ Aufgebraucht</span>}
                    {!isExpired && !isExhausted && voucher.is_active && (
                      <span className="text-xs font-bold text-green-600">✅ Aktiv</span>
                    )}
                    {!voucher.is_active && <span className="text-xs font-bold text-gray-400">⏸️ Deaktiviert</span>}
                  </div>
                  <button
                    onClick={() => toggleActive(voucher.id, voucher.is_active)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      voucher.is_active
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {voucher.is_active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-display font-bold italic" style={{ color: '#4a5d54' }}>
                  {editingVoucher ? 'Gutschein bearbeiten' : 'Neuer Gutschein'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingVoucher(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Code */}
                <div>
                  <label className="block text-xs font-bold text-[#8da399] uppercase tracking-widest mb-2">
                    Gutscheincode
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-lg tracking-wider focus:border-[#4a5d54] focus:outline-none"
                      placeholder="SUMMER20"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-6 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                      🎲 Generieren
                    </button>
                  </div>
                </div>

                {/* Rabatt-Typ */}
                <div>
                  <label className="block text-xs font-bold text-[#8da399] uppercase tracking-widest mb-2">
                    Rabatt-Typ
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                      className={`p-4 rounded-xl border-2 transition ${
                        formData.discount_type === 'percentage'
                          ? 'border-[#4a5d54] bg-[#f9f8f4]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">📊</div>
                      <div className="font-bold">Prozentual (%)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                      className={`p-4 rounded-xl border-2 transition ${
                        formData.discount_type === 'fixed'
                          ? 'border-[#4a5d54] bg-[#f9f8f4]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">💰</div>
                      <div className="font-bold">Festbetrag (€)</div>
                    </button>
                  </div>
                </div>

                {/* Rabatt-Wert */}
                <div>
                  <label className="block text-xs font-bold text-[#8da399] uppercase tracking-widest mb-2">
                    Rabatt-Wert {formData.discount_type === 'percentage' ? '(%)' : '(€)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-2xl focus:border-[#4a5d54] focus:outline-none"
                  />
                </div>

                {/* Mindestbestellwert */}
                <div>
                  <label className="block text-xs font-bold text-[#8da399] uppercase tracking-widest mb-2">
                    Mindestbestellwert (€) - Optional
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_value}
                    onChange={e => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-semibold focus:border-[#4a5d54] focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                {/* Max Nutzungen */}
                <div>
                  <label className="block text-xs font-bold text-[#8da399] uppercase tracking-widest mb-2">
                    Maximale Einlösungen
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.max_uses}
                    onChange={e => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-semibold focus:border-[#4a5d54] focus:outline-none"
                  />
                </div>

                {/* Gültig bis */}
                <div>
                  <label className="block text-xs font-bold text-[#8da399] uppercase tracking-widest mb-2">
                    Gültig bis - Optional
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-semibold focus:border-[#4a5d54] focus:outline-none"
                  />
                </div>

                {/* Aktiv */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="is_active" className="font-semibold cursor-pointer">
                    Sofort aktivieren
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-white text-lg transition hover:opacity-90"
                  style={{ backgroundColor: '#4a5d54' }}
                >
                  {editingVoucher ? '💾 Speichern' : '✨ Gutschein erstellen'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}