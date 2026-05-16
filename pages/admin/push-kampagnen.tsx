import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Send, Loader2, CheckCircle, AlertCircle, Smartphone, Bell } from 'lucide-react';

export default function PushKampagnen() {
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [result, setResult]   = useState<{ ok: boolean; sent: number; failed: number; message?: string } | null>(null);

  // Anzahl verfügbarer Push Tokens laden
  useEffect(() => {
    supabaseAdmin
      .from('push_tokens')
      .select('token', { count: 'exact', head: false })
      .not('token', 'is', null)
      .then(({ count }) => setTokenCount(count ?? 0));
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      alert('Bitte Titel und Nachricht eingeben');
      return;
    }
    if (!confirm(`Push-Nachricht an alle ${tokenCount ?? '?'} Kunden senden?`)) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/push/send-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, sent: 0, failed: 0, message: 'Netzwerkfehler' });
    } finally {
      setSending(false);
    }
  };

  const quickTexts = [
    { label: '🍦 Neue Sorten', title: 'Neue Eissorten sind da!', body: 'Frische neue Sorten warten auf dich – jetzt bestellen!' },
    { label: '🎉 Angebot', title: 'Exklusives Angebot für dich!', body: 'Heute gibt es besondere Aktionen im Eiscafé Simonetti.' },
    { label: '☀️ Schönes Wetter', title: 'Perfektes Eiswetter heute! 🌞', body: 'Bei diesem Wetter schmeckt Eis noch besser – jetzt liefern lassen!' },
    { label: '📦 Neue Produkte', title: 'Neu im Sortiment!', body: 'Entdecke unsere neuen Produkte – schau jetzt rein!' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell size={28} className="text-[#4a5d54]" />
            Push-Kampagnen
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Direktnachrichten an die Kunden-App
          </p>
        </div>

        {/* Token Zähler */}
        <div className="flex items-center gap-3 bg-[#f0f5f3] border border-[#c4d8d0] rounded-2xl p-4 mb-6">
          <Smartphone size={20} className="text-[#4a5d54]" />
          <div>
            <div className="text-sm font-semibold text-[#4a5d54]">
              {tokenCount === null ? 'Laden...' : `${tokenCount} Kunden mit Push-Benachrichtigungen`}
            </div>
            <div className="text-xs text-gray-400">
              Nur Kunden die sich in der App angemeldet und Benachrichtigungen erlaubt haben
            </div>
          </div>
        </div>

        {/* Ergebnis-Banner */}
        {result && (
          <div className={`flex items-start gap-3 p-4 rounded-xl mb-6 ${result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.ok
              ? <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              : <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />}
            <div className="text-sm font-semibold">
              {result.ok
                ? `✅ Gesendet! ${result.sent} erfolgreich${result.failed > 0 ? `, ${result.failed} fehlgeschlagen` : ''}${result.message ? ` · ${result.message}` : ''}`
                : `❌ Fehler: ${result.message || 'Unbekannt'}`}
            </div>
          </div>
        )}

        {/* Schnelltexte */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Schnelltexte</p>
          <div className="grid grid-cols-2 gap-2">
            {quickTexts.map(q => (
              <button
                key={q.label}
                onClick={() => { setTitle(q.title); setBody(q.body); }}
                className="text-left px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-[#4a5d54] hover:bg-[#f0f5f3] text-sm font-semibold text-gray-600 hover:text-[#4a5d54] transition"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formular */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nachricht</p>

          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">
              Titel <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Neue Eissorten sind da!"
              maxLength={65}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm"
            />
            <p className="text-xs text-gray-300 mt-1 text-right">{title.length}/65</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">
              Nachricht <span className="text-red-400">*</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="z.B. Frische neue Sorten warten auf dich – jetzt bestellen!"
              rows={4}
              maxLength={200}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a5d54] focus:outline-none text-sm resize-none"
            />
            <p className="text-xs text-gray-300 mt-1 text-right">{body.length}/200</p>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim() || tokenCount === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4a5d54] text-white rounded-xl text-sm font-bold hover:bg-[#3a4d44] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending
              ? <><Loader2 size={16} className="animate-spin" /> Wird gesendet...</>
              : <><Send size={16} /> An alle {tokenCount ?? '?'} Kunden senden</>}
          </button>

          {tokenCount === 0 && (
            <p className="text-xs text-center text-gray-400">
              Noch keine Kunden mit Push-Benachrichtigungen registriert
            </p>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
