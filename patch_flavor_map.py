f = r'C:\Projekte\simonetti-hybrid\pages\index.tsx'
content = open(f, encoding='utf-8').read()

old = """    const cartItem = {
      ...product,
      quantity: portions,
      selectedFlavors,
      selectedExtras,
      totalPrice: (product.price * portions) + selectedExtras.reduce((sum, e) => sum + e.price, 0) + flavorExtraPrice,
      cartId: `${product.id}-${Date.now()}`
    }"""

new = """    // Flavor-Preise als Map speichern { "Pistazie": 0.50, "Vanille": 0 }
    const flavorPriceMap: Record<string, number> = {}
    selectedFlavors.forEach(fname => {
      const fl = flavors.find(f => f.name === fname)
      if (fl && fl.price > 0) flavorPriceMap[fname] = fl.price
    })

    const cartItem = {
      ...product,
      quantity: portions,
      selectedFlavors,
      selectedExtras,
      flavorPriceMap,
      totalPrice: (product.price * portions) + selectedExtras.reduce((sum, e) => sum + e.price, 0) + flavorExtraPrice,
      cartId: `${product.id}-${Date.now()}`
    }"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK - flavorPriceMap gespeichert")
else:
    print("FEHLER")
    idx = content.find("const cartItem")
    print(repr(content[idx:idx+300]))