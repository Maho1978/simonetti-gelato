import { Session } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import { FavoritesList } from '@/components/FavoriteButton'

export default function Favorites({ session }: { session: Session | null }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfcfb' }}>
      <Navbar session={session} cartCount={0} onCartClick={() => {}} />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <FavoritesList />
      </div>
    </div>
  )
}