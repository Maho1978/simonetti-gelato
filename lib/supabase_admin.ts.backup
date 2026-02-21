// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

Dann in `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseWRhY25zYnNucHdwcWV6dW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTAxNzE3NCwiZXhwIjoyMDg2NTkzMTc0fQ.K5ATKAoqXar9x_F-BmmVZLZNhGiK-Vfwq2coRxJDweE