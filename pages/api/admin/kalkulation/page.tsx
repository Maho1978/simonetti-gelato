// app/admin/kalkulation/page.tsx
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import KalkulationPin from './KalkulationPin'
import KalkulationClient from './KalkulationClient'

export const metadata = { title: 'Kalkulation | Simonetti Admin' }

export default async function KalkulationPage() {
  // Schicht 1: Supabase Auth — keine Session = sofort redirect
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/admin/login')

  // Schicht 2: PIN-Screen — kein PIN = Setup, falscher PIN = gesperrt
  return (
    <KalkulationPin>
      <KalkulationClient />
    </KalkulationPin>
  )
}