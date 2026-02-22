import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { LogOut, Menu, X } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/admin',            icon: '📊' },
  { label: 'Kanban',      href: '/admin/kanban',     icon: '🗂️' },
  { label: 'Produkte',    href: '/admin/products',   icon: '🍦' },
  { label: 'Extras',      href: '/admin/extras',     icon: '➕' },
  { label: 'Kategorien',  href: '/admin/categories', icon: '📂' },
  { label: 'Fahrer',      href: '/admin/drivers',    icon: '🚗' },
  { label: 'Reports',     href: '/admin/reports',    icon: '📈' },
  { label: 'Gutscheine',  href: '/admin/vouchers',   icon: '🎟️' },
  { label: 'Kunden',      href: '/admin/customers',  icon: '👥' },
  { label: 'Bewertungen', href: '/admin/reviews',    icon: '⭐' },
  { label: 'Setup',       href: '/admin/settings',   icon: '⚙️' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openOrders, setOpenOrders] = useState(0)

  useEffect(() => {
    checkAuth()
    loadOpenOrders()
    const iv = setInterval(loadOpenOrders, 30000)
    return () => clearInterval(iv)
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/auth/login')
    else setSession(session)
  }

  const loadOpenOrders = async () => {
    const { data } = await supabase.from('orders').select('id').in('status', ['OFFEN'])
    setOpenOrders(data?.length || 0)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Horizontale Navigation ── */}
      <nav className="bg-[#1a1a1a] text-white shadow-lg sticky top-0 z-40">
        <div className="flex items-center">

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 px-4 py-3 border-r border-gray-700 flex-shrink-0">
            <span className="text-2xl">🍦</span>
            <div className="hidden sm:block">
              <div className="font-bold text-sm leading-none">Simonetti</div>
              <div className="text-xs text-gray-400">Admin</div>
            </div>
          </Link>

          {/* Nav Items Desktop – scrollable */}
          <div className="hidden md:flex items-center overflow-x-auto flex-1 scrollbar-hide">
            {NAV_ITEMS.map(item => {
              const isActive = router.pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={`relative flex items-center gap-1.5 px-3 py-4 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                    isActive
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                  }`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === '/admin/kanban' && openOrders > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {openOrders}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-white transition ml-auto"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logout Desktop */}
          <button onClick={handleSignOut}
            className="hidden md:flex items-center gap-1.5 px-4 py-3 text-xs text-gray-400 hover:text-white transition border-l border-gray-700 flex-shrink-0 ml-auto">
            <LogOut size={14} />
            <span>Abmelden</span>
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-[#1a1a1a] grid grid-cols-3 gap-0">
            {NAV_ITEMS.map(item => {
              const isActive = router.pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold transition ${
                    isActive ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <button onClick={handleSignOut}
              className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition">
              <LogOut size={18} />
              <span>Abmelden</span>
            </button>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  )
}