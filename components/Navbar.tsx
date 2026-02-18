import Link from 'next/link'
import Image from 'next/image'
import { Session } from '@supabase/supabase-js'
import { ShoppingCart, User, LogOut, Settings } from 'lucide-react'
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
    <nav style={{ backgroundColor: '#fdfcfb', borderBottom: '1px solid #eee' }} className="sticky top-0 z-50 animate-slide-down">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🍦</span>
            <div>
              <div className="text-2xl font-display font-bold italic" style={{ color: '#4a5d54' }}>
                Simonetti<span style={{ color: '#8da399' }}>.</span>
              </div>
              <div className="text-xs font-semibold tracking-widest" style={{ color: '#8da399' }}>GELATERIA</div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-4">

            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{ backgroundColor: '#4a5d54', color: '#fdfcfb' }}
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:inline">Warenkorb</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#8da399', color: '#fdfcfb' }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {session ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <Link href="/admin"
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors duration-300"
                    style={{ color: '#4a5d54' }}
                  >
                    <Settings size={18} />
                    <span className="hidden md:inline font-semibold text-sm">Admin</span>
                  </Link>
                )}
                <Link href="/account"
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors duration-300"
                  style={{ color: '#4a5d54' }}
                >
                  <User size={18} />
                  <span className="hidden md:inline font-semibold text-sm">Konto</span>
                </Link>
                <button onClick={handleSignOut}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors duration-300"
                  style={{ color: '#8da399' }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/auth/login"
                className="flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300"
                style={{ border: '2px solid #4a5d54', color: '#4a5d54' }}
              >
                <User size={18} />
                <span>Anmelden</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}