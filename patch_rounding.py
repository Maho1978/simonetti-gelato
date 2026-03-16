f = r'C:\Projekte\simonetti-hybrid\pages\checkout.tsx'
content = open(f, encoding='utf-8').read()

# grandTotal auf 0.10 runden (kaufmännisch)
old = "  const grandTotal = parseFloat(Math.max(0, subtotal - discount + effectiveDeliveryFee + tip).toFixed(2))"
new = """  const roundTo10Cents = (val: number) => Math.round(val * 10) / 10
  const grandTotal = roundTo10Cents(Math.max(0, subtotal - discount + effectiveDeliveryFee + tip))"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK - grandTotal auf 0.10 gerundet")
else:
    print("FEHLER - nicht gefunden")
    idx = content.find("grandTotal")
    print(repr(content[idx:idx+150]))