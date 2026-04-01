f = r'C:\Projekte\simonetti-hybrid\pages\admin\kalkulation\KalkulationClient.tsx'
content = open(f, encoding='utf-8').read()

old = """                          const portMenge = (prod as any).port_menge ?? 1
                          const portEinheit = (prod as any).port_einheit ?? 'kg'
                          const toBase = (m: number, e: string) => e==='g'?m/1000:e==='ml'?m/1000:m
                          const portFaktor = prod.port_key==='free' ? toBase(portMenge,portEinheit) : (PORTIONEN.find(p=>p.key===prod.port_key)?.faktor??1)"""

new = """                          // Bei freier Eingabe: Mengen im Rezept sind bereits die Gesamtmenge → faktor=1
                          const portFaktor = prod.port_key==='free' ? 1 : (PORTIONEN.find(p=>p.key===prod.port_key)?.faktor??1)"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK")
else:
    print("FEHLER")
    idx = content.find("portFaktor")
    print(repr(content[idx:idx+200]))