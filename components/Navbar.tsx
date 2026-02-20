import Link from 'next/link'
import { Session } from '@supabase/supabase-js'
import { ShoppingCart, User, LogOut, Settings, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'

interface NavbarProps {
  session: Session | null
  cartCount: number
  onCartClick: () => void
}

export default function Navbar({ session, cartCount, onCartClick }: NavbarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
                  session?.user?.user_metadata?.role === 'admin'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo - Minimalistisch */}
          <Link href="/" className="flex items-center space-x-4 group">
            <div className="text-3xl transition-transform group-hover:scale-105">🍦</div>
            <div>
              <div className="text-2xl font-display font-bold tracking-tight" style={{ color: '#1a1a1a' }}>
                Simonetti
              </div>
              <div className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">
                Gelateria
              </div>
            </div>
          </Link>

          {/* Navigation - Clean */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/speisekarte" className="text-sm font-medium text-gray-700 hover:text-black transition">
              Speisekarte
            </Link>
            <Link href="/ueber-uns" className="text-sm font-medium text-gray-700 hover:text-black transition">
              Über uns
            </Link>
            {session && (
              <Link href="/favorites" className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition">
                <Heart size={16} />
                <span>Favoriten</span>
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">

            {/* Cart - Minimalistisch */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium tracking-wide uppercase transition hover:bg-gray-900"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Warenkorb</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#c9a66b] text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {session ? (
              <div className="flex items-center space-x-3">
                {isAdmin && (
                  <Link href="/admin" className="text-gray-700 hover:text-black transition">
                    <Settings size={20} />
                  </Link>
                )}
                <Link href="/account" className="text-gray-700 hover:text-black transition">
                  <User size={20} />
                </Link>
                <button onClick={handleSignOut} className="text-gray-400 hover:text-gray-700 transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-black transition">
                Anmelden
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}