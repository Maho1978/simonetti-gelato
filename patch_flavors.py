f = r'C:\Projekte\simonetti-hybrid\components\ProductCard.tsx'
content = open(f, encoding='utf-8').read()

# 1. Interface erweitern - flavors als Objekte
old_interface = "  flavors?: string[]\n  onAddToCart: (product: any, portions: number, selectedFlavors: string[], selectedExtras: Extra[]) => void"
new_interface = """  flavors?: { name: string; price: number }[]
  onAddToCart: (product: any, portions: number, selectedFlavors: string[], selectedExtras: Extra[]) => void"""
content = content.replace(old_interface, new_interface)

# 2. availableFlavors anpassen
old_avail = "  const availableFlavors                = flavors.length > 0 ? flavors : (product.available_flavors || [])"
new_avail = """  const availableFlavors = flavors.length > 0 ? flavors : (product.available_flavors || []).map((f: any) => typeof f === 'string' ? { name: f, price: 0 } : f)"""
content = content.replace(old_avail, new_avail)

# 3. toggleFlavor anpassen
old_toggle = """  const toggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor))
    } else {
      if (selectedFlavors.length >= portionSize) {
        setSelectedFlavors([...selectedFlavors.slice(1), flavor])
        return
      }
      setSelectedFlavors([...selectedFlavors, flavor])
    }
  }"""
new_toggle = """  const toggleFlavor = (flavorName: string) => {
    if (selectedFlavors.includes(flavorName)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavorName))
    } else {
      if (selectedFlavors.length >= portionSize) {
        setSelectedFlavors([...selectedFlavors.slice(1), flavorName])
        return
      }
      setSelectedFlavors([...selectedFlavors, flavorName])
    }
  }"""
content = content.replace(old_toggle, new_toggle)

# 4. Sorten-Preis in totalPrice einrechnen
old_total = "  const totalPrice = product.price + selectedExtras.reduce((sum, e) => sum + e.price, 0)"
new_total = """  const selectedFlavorObjects = availableFlavors.filter((f: any) => selectedFlavors.includes(f.name))
  const flavorExtraPrice = selectedFlavorObjects.reduce((sum: number, f: any) => sum + (f.price || 0), 0)
  const totalPrice = product.price + flavorExtraPrice + selectedExtras.reduce((sum, e) => sum + e.price, 0)"""
content = content.replace(old_total, new_total)

# 5. Sorten-Auswahl im Modal wie Extras anzeigen
old_flavors_grid = """                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableFlavors.map(flavor => (
                      <button key={flavor} onClick={() => toggleFlavor(flavor)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition ${selectedFlavors.includes(flavor) ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
                        🍦 {flavor}
                      </button>
                    ))}
                  </div>"""
new_flavors_grid = """                  <div className="space-y-2">
                    {availableFlavors.map((flavor: any) => {
                      const flavorName = typeof flavor === 'string' ? flavor : flavor.name
                      const flavorPrice = typeof flavor === 'string' ? 0 : (flavor.price || 0)
                      const isSelected = selectedFlavors.includes(flavorName)
                      return (
                        <label key={flavorName}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition ${isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFlavor(flavorName)}
                              className="w-5 h-5"
                            />
                            <span className="font-medium">🍦 {flavorName}</span>
                          </div>
                          <span className="font-bold text-green-600">
                            {flavorPrice > 0 ? `+${flavorPrice.toFixed(2)} €` : 'kostenlos'}
                          </span>
                        </label>
                      )
                    })}
                  </div>"""
content = content.replace(old_flavors_grid, new_flavors_grid)

open(f, 'w', encoding='utf-8').write(content)
print("OK - Eissorten mit Preisen wie Extras")