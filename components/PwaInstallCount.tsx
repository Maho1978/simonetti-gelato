import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PwaInstallCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('pwa_installs')
      .select('*', { count: 'exact', head: true })
      .then(({ count: c }) => setCount(c ?? 0))
  }, [])

  if (count === null) return null
  return <div>📱 {count} PWA Installationen</div>
}
