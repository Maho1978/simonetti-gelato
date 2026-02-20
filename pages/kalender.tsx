import { useRouter } from 'next/router'

export default function Calendar() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.push('/admin')}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          ← Zurück zum Admin
        </button>
        
        <h1 className="text-4xl font-bold mb-4">Kalender Test</h1>
        <p className="text-xl">Wenn du das siehst, funktioniert die Route! 🎉</p>
        
        <div className="mt-8 p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-2">Next Steps:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Route funktioniert ✅</li>
            <li>Jetzt den kompletten Kalender-Code einfügen</li>
            <li>Supabase Tabelle erstellen</li>
          </ol>
        </div>
      </div>
    </div>
  )
}