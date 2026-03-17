f = r'C:\Projekte\simonetti-hybrid\pages\admin\kanban.tsx'
content = open(f, encoding='utf-8').read()

old = """    const extrasWithPrice = (item.selectedExtras || []).filter((e: any) => typeof e === 'object' && e.price)
    const basePrice = item.price * item.quantity
    itemsHtml += `<tr><td class="item-qty">${item.quantity}x</td><td class="item-name">${item.name}</td><td class="item-price">${basePrice.toFixed(2)}</td></tr>`"""

new = """    const extrasWithPrice = (item.selectedExtras || []).filter((e: any) => typeof e === 'object' && e.price)
    const extrasTotal = extrasWithPrice.reduce((s: number, e: any) => s + (e.price || 0), 0)
    const basePrice = item.totalPrice ? (item.totalPrice - extrasTotal) : item.price * item.quantity
    itemsHtml += `<tr><td class="item-qty">${item.quantity}x</td><td class="item-name">${item.name}</td><td class="item-price">${basePrice.toFixed(2)}</td></tr>`"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK - basePrice aus totalPrice")
else:
    print("FEHLER")
    idx = content.find("basePrice")
    print(repr(content[idx:idx+200]))