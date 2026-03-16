f = r'C:\Projekte\simonetti-hybrid\pages\admin\kanban.tsx'
content = open(f, encoding='utf-8').read()

old = "    const basePrice = item.price * item.quantity\n    itemsHtml += `<tr><td class=\"item-qty\">${item.quantity}x</td><td class=\"item-name\">${item.name || item.productName}</td><td class=\"item-price\">${basePrice.toFixed(2)}</td></tr>`"

new = """    const extrasTotal2 = (item.selectedExtras || []).filter((e: any) => typeof e === 'object' && e.price).reduce((s: number, e: any) => s + (e.price || 0), 0)
    const basePrice = item.totalPrice ? (item.totalPrice - extrasTotal2) : item.price * item.quantity
    itemsHtml += `<tr><td class="item-qty">${item.quantity}x</td><td class="item-name">${item.name || item.productName}</td><td class="item-price">${basePrice.toFixed(2)}</td></tr>`"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK")
else:
    print("FEHLER - exakter Text:")
    idx = content.find("basePrice = item.price")
    print(repr(content[idx-100:idx+300]))