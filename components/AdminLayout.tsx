import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  ShoppingBag, 
  Package, 
  Layers, 
  Tag, 
  KanbanSquare, 
  BarChart3, 
  Ticket, 
  Heart,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
    } else {
      setSession(session)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { icon: ShoppingBag, label: 'Bestellungen', href: '/admin' },  // Dashboard
    { icon: Package, label: 'Produkte', href: '/admin/products' },
    { icon: Layers, label: 'Extras', href: '/admin/extras' },
    { icon: Tag, label: 'Kategorien', href: '/admin/categories' },
    { icon: KanbanSquare, label: 'Kanban', href: '/admin/kanban' },  // NEU!
    { icon: BarChart3, label: 'Reports', href: '/admin/reports' },
    { icon: Ticket, label: 'Gutscheine', href: '/admin/vouchers' },
    { icon: Heart, label: 'Favoriten', href: '/admin/customers' },
    { icon: Settings, label: 'Setup', href: '/admin/settings' },
  ]

  const currentPath = router.pathname

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#1a1a1a] text-white
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="text-3xl">🍦</span>
            <div>
              <div className="font-display text-xl font-bold">Simonetti</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Admin</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-black font-semibold' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="mb-3 px-4 py-2">
            <div className="text-xs text-gray-500">Angemeldet als</div>
            <div className="text-sm font-semibold truncate">{session?.user?.email}</div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
          >
            <LogOut size={20} />
            <span>Abmelden</span>
          </button>
        </div>

      </aside>

      {/* Overlay für Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Top Bar (Mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍦</span>
              <div className="font-display text-xl font-bold">Admin</div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <div className="transition-opacity duration-200">
            {children}
          </div>
        </main>

      </div>

      <style jsx global>{`
        /* Smooth Page Transitions */
        .page-transition-enter {
          opacity: 0;
        }
        .page-transition-enter-active {
          opacity: 1;
          transition: opacity 200ms ease-in;
        }
        .page-transition-exit {
          opacity: 1;
        }
        .page-transition-exit-active {
          opacity: 0;
          transition: opacity 200ms ease-out;
        }
      `}</style>
    </div>
  )
}