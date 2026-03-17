f = r'C:\Projekte\simonetti-hybrid\pages\index.tsx'
content = open(f, encoding='utf-8').read()

# flavors state als Objekte
old_flavors_state = "  const [flavors, setFlavors]                 = useState<string[]>([])"
new_flavors_state = "  const [flavors, setFlavors]                 = useState<{ name: string; price: number }[]>([])"
content = content.replace(old_flavors_state, new_flavors_state)

# loadCategories - Flavors mit Preis laden
old_dynamic = """      const dynamicFlavors = activeProducts
        .filter(p => hiddenCatNames.includes(p.category))
        .map(p => p.name)
        .sort()"""
new_dynamic = """      const dynamicFlavors = activeProducts
        .filter(p => hiddenCatNames.includes(p.category))
        .map(p => ({ name: p.name, price: p.price || 0 }))
        .sort((a, b) => a.name.localeCompare(b.name))"""
content = content.replace(old_dynamic, new_dynamic)

open(f, 'w', encoding='utf-8').write(content)
print("OK - Flavors mit Preisen in index.tsx")