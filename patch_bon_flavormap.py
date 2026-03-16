f = r'C:\Projekte\simonetti-hybrid\pages\admin\kanban.tsx'
content = open(f, encoding='utf-8').read()

old = """    if (item.flavors.length > 0) {
      for (const flavor of item.flavors) {
        const flavorName = typeof flavor === 'object' ? flavor.name : flavor
        const flavorPrice = typeof flavor === 'object' ? (flavor.price || 0) : 0
        itemsHtml += `<tr><td></td><td class="item-detail">🍦 ${flavorName}</td><td class="item-price" style="font-size:12px">${flavorPrice > 0 ? flavorPrice.toFixed(2) : 'inkl.'}</td></tr>`
      }
    }"""

new = """    if (item.flavors.length > 0) {
      const flavorPriceMap = item.flavorPriceMap || {}
      // Sorten gruppieren und zählen
      const flavorGroups: Record<string, number> = {}
      for (const flavor of item.flavors) {
        const fname = typeof flavor === 'object' ? flavor.name : flavor
        flavorGroups[fname] = (flavorGroups[fname] || 0) + 1
      }
      for (const [fname, count] of Object.entries(flavorGroups)) {
        const unitPrice = flavorPriceMap[fname] || (typeof item.flavors[0] === 'object' ? 0 : 0)
        const linePrice = unitPrice * count
        const priceLabel = linePrice > 0 ? `${linePrice.toFixed(2)}` : 'inkl.'
        const label = count > 1 ? `🍦 ${count}x ${fname}` : `🍦 ${fname}`
        itemsHtml += `<tr><td></td><td class="item-detail">${label}</td><td class="item-price" style="font-size:12px">${priceLabel}</td></tr>`
      }
    }"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK - flavorPriceMap im Bon")
else:
    print("FEHLER")
    idx = content.find("item.flavors.length > 0")
    print(repr(content[idx:idx+300]))