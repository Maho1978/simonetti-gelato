import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import PwaInstallBanner from '@/components/PwaInstallBanner'

export default function App({ Component, pageProps }: AppProps) {
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (!isStandalone) return
    if (window.location.pathname !== '/') return
    if (window.location.hash === '#speisekarte') return
    router.replace('/#speisekarte')
  }, [router])

  return (
    <>
      <Component {...pageProps} session={session} />
      <PwaInstallBanner />
    </>
  )
}
