import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import KalkulationPin from './KalkulationPin'
import KalkulationClient from './KalkulationClient'

export default function KalkulationPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth/login')
      else setReady(true)
    })
  }, [router])

  if (!ready) return null

  return (
    <AdminLayout>
      <KalkulationPin>
        <KalkulationClient />
      </KalkulationPin>
    </AdminLayout>
  )
}
