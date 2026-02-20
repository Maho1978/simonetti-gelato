import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FavoriteButtonProps {
  productId: string
  size?: number
  className?: string
}

export default function FavoriteButton({ productId, size = 24, className = '' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Session laden
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        checkFavorite(data.session.user.id)
      }
    })
  }, [productId])

  const checkFavorite = async (userId: string) => {
    const { data } = await supabase
      .from('customer_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()
    
    setIsFavorite(!!data)
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      alert('Bitte einloggen um Favoriten zu speichern!')
      return
    }

    setLoading(true)

    try {
      if (isFavorite) {
        // Entfernen
        await supabase
          .from('customer_favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('product_id', productId)
        
        setIsFavorite(false)
      } else {
        // Hinzufügen
        await supabase
          .from('customer_favorites')
          .insert({
            user_id: session.user.id,
            product_id: productId
          })
        
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Favorite toggle error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`transition-all hover:scale-110 active:scale-95 ${className}`}
      title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
    >
      <Heart
        size={size}
        fill={isFavorite ? '#ef4444' : 'none'}
        stroke={isFavorite ? '#ef4444' : '#666'}
        strokeWidth={2}
        className={loading ? 'animate-pulse' : ''}
      />
    </button>
  )
}

// ============================================================
// FAVORITEN-LISTE Component
// ============================================================

export function FavoritesList() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session)
        loadFavorites(data.session.user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  const loadFavorites = async (userId: string) => {
    const { data } = await supabase
      .from('customer_favorites')
      .select(`
        id,
        created_at,
        products (
          id,
          name,
          price,
          emoji,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) setFavorites(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-12">Lade Favoriten...</div>
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❤️</div>
        <p className="text-xl text-gray-600">Bitte einloggen um Favoriten zu sehen</p>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💔</div>
        <p className="text-xl text-gray-600">Noch keine Favoriten</p>
        <p className="text-sm text-gray-400 mt-2">Klicke auf das Herz bei deinen Lieblingsprodukten!</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-display font-bold italic mb-6" style={{ color: '#4a5d54' }}>
        Meine Favoriten ❤️
      </h2>
      <p className="text-gray-600 mb-8">{favorites.length} Produkte</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map(fav => (
          <div key={fav.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
            {/* Favorit entfernen */}
            <div className="absolute top-4 right-4">
              <FavoriteButton productId={fav.products.id} size={28} />
            </div>

            {/* Produkt */}
            <div className="text-6xl mb-4">{fav.products.emoji || '🍦'}</div>
            <h3 className="font-bold text-xl mb-2" style={{ color: '#4a5d54' }}>
              {fav.products.name}
            </h3>
            <div className="text-2xl font-bold" style={{ color: '#4a5d54' }}>
              {fav.products.price.toFixed(2)} €
            </div>
            
            <button 
              className="mt-4 w-full py-2 rounded-xl font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: '#4a5d54' }}
            >
              In den Warenkorb
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}