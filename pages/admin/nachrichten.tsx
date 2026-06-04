import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import { Session } from '@supabase/supabase-js'
import { Send } from 'lucide-react'

export default function NachrichtenAdmin({ session }: { session: Session | null }) {
  const [convos, setConvos]     = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput]       = useState('')
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchConvos() }, [])
  useEffect(() => { if (selected) fetchMessages(selected) }, [selected])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchConvos = async () => {
    const { data } = await supabase
      .from('customer_messages')
      .select('user_id, message, created_at, read_by_admin')
      .order('created_at', { ascending: false })
    if (!data) return
    const map = new Map()
    data.forEach(m => { if (!map.has(m.user_id)) map.set(m.user_id, m) })
    setConvos(Array.from(map.values()))
  }

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase
      .from('customer_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    await supabase.from('customer_messages')
      .update({ read_by_admin: true })
      .eq('user_id', userId)
      .eq('direction', 'from_customer')
    fetchConvos()
  }

  const sendMessage = async () => {
    if (!input.trim() || !selected) return
    await supabase.from('customer_messages').insert({
      user_id: selected, direction: 'from_shop', message: input.trim(),
      read_by_admin: true, read_by_customer: false,
    })
    setInput('')
    fetchMessages(selected)
  }

  return (
    <AdminLayout session={session}>
      <div className="flex h-[calc(100vh-60px)]">
        <div className="w-72 border-r border-gray-100 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Nachrichten</h2>
          </div>
          {convos.map(c => (
            <div key={c.user_id} onClick={() => setSelected(c.user_id)}
              className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${selected === c.user_id ? 'bg-[#fffbf2]' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold text-gray-700">{c.user_id.slice(0, 8)}...</div>
                {!c.read_by_admin && <span className="w-2 h-2 bg-red-500 rounded-full" />}
              </div>
              <div className="text-xs text-gray-400 truncate">{c.message}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          {selected ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === 'from_customer' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.direction === 'from_customer' ? 'bg-gray-100 text-gray-800' : 'bg-[#C4973A] text-white'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                  placeholder="Antwort schreiben..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C4973A]" />
                <button onClick={sendMessage} className="px-4 py-2 bg-[#1a1a1a] text-white rounded-xl hover:bg-black">
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Konversation auswählen
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}