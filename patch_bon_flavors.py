f = r'C:\Projekte\simonetti-hybrid\pages\admin\kanban.tsx'
content = open(f, encoding='utf-8').read()

old = "    if (item.flavors.length > 0) itemsHtml += `<tr><td></td><td colspan=\"2\" class=\"item-detail\">Sorten: ${item.flavors.join(', ')}</td></tr>`"

new = """    if (item.flavors.length > 0) {
      for (const flavor of item.flavors) {
        const flavorName = typeof flavor === 'object' ? flavor.name : flavor
        const flavorPrice = typeof flavor === 'object' ? (flavor.price || 0) : 0
        itemsHtml += `<tr><td></td><td class="item-detail">🍦 ${flavorName}</td><td class="item-price" style="font-size:12px">${flavorPrice > 0 ? flavorPrice.toFixed(2) : 'inkl.'}</td></tr>`
      }
    }"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK - Eissorten mit Preisen auf Bon")
else:
    print("FEHLER - nicht gefunden")
    idx = content.find("item.flavors.length")
    print(repr(content[idx:idx+200]))