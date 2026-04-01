f = r'C:\Projekte\simonetti-hybrid\hooks\useKalkulation.ts'
content = open(f, encoding='utf-8').read()

old = "import { supabaseAdmin as supabase } from '@/lib/supabase'"
new = "import { supabase } from '@/lib/supabase'"

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK")
else:
    print("FEHLER")
    print(repr(content[:200]))
