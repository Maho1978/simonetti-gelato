f = r'C:\Projekte\simonetti-hybrid\hooks\useKalkulation.ts'
content = open(f, encoding='utf-8').read()

fixes = [
    # saveProdukt
    (
        "      if (error) throw error\n    } else {\n      const { error } = await supabase.from('produkte').insert({...data, aktiv: true})\n      if (error) throw error\n    }\n    await load()\n  }\n\n  const deleteProdukt",
        "      if (error) throw error\n      setProdukte(prev => prev.map(p => p.id === data.id ? {...p, ...data} : p))\n    } else {\n      const { error } = await supabase.from('produkte').insert({...data, aktiv: true})\n      if (error) throw error\n      await load()\n    }\n  }\n\n  const deleteProdukt"
    ),
    # saveZutat
    (
        "      if (error) throw error\n    } else {\n      const { error } = await supabase.from('zutaten').insert({...item, aktiv: true})\n      if (error) throw error\n    }\n    await load()\n  }\n\n  const deleteZutat",
        "      if (error) throw error\n      setZutaten(prev => prev.map(z => z.id === item.id ? {...z, ...item} : z))\n    } else {\n      const { error } = await supabase.from('zutaten').insert({...item, aktiv: true})\n      if (error) throw error\n      await load()\n    }\n  }\n\n  const deleteZutat"
    ),
    # saveBetriebskosten
    (
        "      if (error) throw error\n    } else {\n      const { error } = await supabase.from('betriebskosten').insert(item)\n      if (error) throw error\n    }\n    await load()\n  }\n\n  const deleteBetriebskosten",
        "      if (error) throw error\n      setBetriebskosten(prev => prev.map(b => b.id === item.id ? {...b, ...item} : b))\n    } else {\n      const { error } = await supabase.from('betriebskosten').insert(item)\n      if (error) throw error\n      await load()\n    }\n  }\n\n  const deleteBetriebskosten"
    ),
]

found = 0
for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        found += 1

print(f"{found}/3 fixes angewendet")
open(f, 'w', encoding='utf-8').write(content)
print("OK")
