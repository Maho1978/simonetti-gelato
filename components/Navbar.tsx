import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, User } from 'lucide-react'
import Image from 'next/image'

export default function Navbar({ session, cartCount, onCartClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <Image 
              src="/images/simonetti-logo.jpg" 
              alt="Eiscafe Simonetti Logo" 
              width={60} 
              height={60}
              className="rounded-full"
            />
            <div>
              <div className="font-display font-bold text-xl" style={{ color: '#4a5d54' }}>
                EISCAFE SIMONETTI
              </div>
              <div className="text-xs text-gray-600 italic">
                Gelateria
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-[#4a5d54] font-semibold transition"
            >
              Speisekarte
            </Link>
            <Link 
              href="/ueber-uns" 
              className="text-gray-700 hover:text-[#4a5d54] font-semibold transition"
            >
              Über uns
            </Link>
            
            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#4a5d54] font-semibold transition"
            >
              <ShoppingBag size={24} />
              <span>Warenkorb</span>
              {cartCount > 0 && (
                <span className="bg-[#4a5d54] text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {session ? (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-4 py-2 bg-[#4a5d54] text-white rounded-lg hover:bg-[#3a4d44] transition font-semibold"
              >
                <User size={18} />
                Admin
              </Link>
            ) : (
              <Link 
                href="/auth/login" 
                className="px-4 py-2 border-2 border-[#4a5d54] text-[#4a5d54] rounded-lg hover:bg-[#4a5d54] hover:text-white transition font-semibold"
              >
                Anmelden
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-[#4a5d54] font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Speisekarte
              </Link>
              <Link 
                href="/ueber-uns" 
                className="text-gray-700 hover:text-[#4a5d54] font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Über uns
              </Link>
              
              <button
                onClick={() => {
                  onCartClick()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-[#4a5d54] font-semibold"
              >
                <ShoppingBag size={20} />
                Warenkorb ({cartCount})
              </button>

              {session ? (
                <Link 
                  href="/admin" 
                  className="text-gray-700 hover:text-[#4a5d54] font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              ) : (
                <Link 
                  href="/auth/login" 
                  className="text-gray-700 hover:text-[#4a5d54] font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Anmelden
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}