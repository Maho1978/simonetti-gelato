f = r'C:\Projekte\simonetti-hybrid\pages\checkout.tsx'
content = open(f, encoding='utf-8').read()

# 1. Banner anpassen
old_banner = """                {pickupEnabled && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">🏪</span>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-800 text-sm">Abholung nur für registrierte Kunden</p>
                      <p className="text-xs text-amber-600 mt-0.5">Bitte <a href="/auth/customer-login" className="underline font-bold">anmelden</a> oder <a href="/auth/customer-login" className="underline font-bold">registrieren</a> um Abholung zu nutzen.</p>
                    </div>
                  </div>
                )}"""

new_banner = """                {pickupEnabled && isGuest && paymentMethod === 'cash' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl">🏪</span>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-800 text-sm">Abholung mit Barzahlung nur für registrierte Kunden</p>
                      <p className="text-xs text-amber-600 mt-0.5">Bitte <a href="/auth/customer-login" className="underline font-bold">anmelden</a> oder online bezahlen.</p>
                    </div>
                  </div>
                )}"""

# 2. Pickup Button
old_btn = "                      <button type=\"button\" onClick={() => setOrderType('pickup')}\n                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all font-semibold text-sm ${orderType === 'pickup' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>"

new_btn = "                      <button type=\"button\" onClick={() => { if (!(isGuest && paymentMethod === 'cash')) setOrderType('pickup') }}\n                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all font-semibold text-sm ${isGuest && paymentMethod === 'cash' ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : orderType === 'pickup' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>"

found_banner = old_banner in content
found_btn = old_btn in content

print(f"Banner gefunden: {found_banner}")
print(f"Button gefunden: {found_btn}")

if found_banner:
    content = content.replace(old_banner, new_banner)
if found_btn:
    content = content.replace(old_btn, new_btn)

if found_banner or found_btn:
    open(f, 'w', encoding='utf-8').write(content)
    print("OK - gespeichert")
else:
    print("FEHLER - nichts gefunden")
    idx = content.find("Abholung nur")
    print(repr(content[idx:idx+300]))
