import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Edit2, Trash2, Copy, Check, X } from 'lucide-react'

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

function VouchersContent() {
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
    checkAuth()
    fetchVouchers()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login?redirect=/admin/vouchers')
    }
  }

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
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold italic text-[#4a5d54]">Gutscheine</h1>
          <p className="text-gray-500">{vouchers.length} Gutscheine insgesamt</p>
        </div>
        <button
          onClick={() => { setShowModal(true); resetForm(); }}
          className="flex items-center gap-2 px-6 py-3 bg-[#4a5d54] text-white rounded-xl font-bold hover:opacity-90 transition shadow-sm"
        >
          <Plus size={20} /> Neuer Gutschein
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map(voucher => {
          const isExpired = voucher.valid_until && new Date(voucher.valid_until) < new Date()
          const isExhausted = voucher.current_uses >= voucher.max_uses
          const isActive = voucher.is_active && !isExpired && !isExhausted

          return (
            <div
              key={voucher.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                isActive ? 'border-green-100' : 'border-gray-200 opacity-75'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <button
                  onClick={() => copyCode(voucher.code)}
                  className="px-4 py-2 bg-[#f9f8f4] border border-[#4a5d54]/20 text-[#4a5d54] rounded-lg font-bold text-lg tracking-wider hover:bg-white transition flex items-center gap-2"
                >
                  {voucher.code}
                  {copied === voucher.code ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(voucher)} className="p-2 hover:bg-gray-100 rounded-lg transition text-[#4a5d54]">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(voucher.id)} className="p-2 hover:bg-red-50 rounded-lg transition text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-4xl font-bold text-[#4a5d54]">
                  {voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : `${voucher.discount_value}€`}
                </div>
                <div className="text-xs uppercase tracking-widest text-[#8da399] font-bold">
                  {voucher.discount_type === 'percentage' ? 'Rabatt' : 'Festbetrag'}
                </div>
              </div>

              <div className="space-y-2 text-sm border-t border-gray-50 pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Min. Bestellwert:</span>
                  <span className="font-bold">{voucher.min_order_value}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Einlösungen:</span>
                  <span className="font-bold">{voucher.current_uses} / {voucher.max_uses}</span>
                </div>
                {voucher.valid_until && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ablaufdatum:</span>
                    <span className="font-bold">{new Date(voucher.valid_until).toLocaleDateString('de-DE')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-tighter">
                  {isExpired && <span className="text-red-500">⏰ Abgelaufen</span>}
                  {isExhausted && <span className="text-orange-500">⚠️ Limit erreicht</span>}
                  {isActive && <span className="text-green-600">✅ Aktiv</span>}
                  {!voucher.is_active && <span className="text-gray-400">⏸️ Pausiert</span>}
                </div>
                <button
                  onClick={() => toggleActive(voucher.id, voucher.is_active)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    voucher.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}
                >
                  {voucher.is_active ? 'Deaktivieren' : 'Aktivieren'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold italic text-[#4a5d54]">
                {editingVoucher ? 'Gutschein anpassen' : 'Neuer Gutschein'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingVoucher(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8da399] mb-2">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-lg focus:border-[#4a5d54] outline-none transition"
                    placeholder="SIMONETTI2026"
                  />
                  <button type="button" onClick={generateCode} className="px-4 py-2 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition">🎲</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                  className={`p-4 rounded-xl border-2 transition font-bold ${formData.discount_type === 'percentage' ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-50 text-gray-400'}`}
                >
                  Prozent (%)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                  className={`p-4 rounded-xl border-2 transition font-bold ${formData.discount_type === 'fixed' ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-50 text-gray-400'}`}
                >
                  Festbetrag (€)
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#8da399] mb-2">Wert</label>
                  <input
                    type="number"
                    required
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-[#4a5d54]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#8da399] mb-2">Mindestumsatz</label>
                  <input
                    type="number"
                    value={formData.min_order_value}
                    onChange={e => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) })}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-[#4a5d54]"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#8da399] mb-2">Limit</label>
                  <input
                    type="number"
                    required
                    value={formData.max_uses}
                    onChange={e => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-[#4a5d54]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#8da399] mb-2">Ablaufdatum</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-[#4a5d54]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#4a5d54] text-white rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg"
              >
                {editingVoucher ? 'Änderungen speichern' : 'Gutschein aktivieren'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VouchersPage() {
  return (
    <AdminLayout>
      <VouchersContent />
    </AdminLayout>
  )
}