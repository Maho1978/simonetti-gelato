f = r'C:\Projekte\simonetti-hybrid\pages\admin\kalkulation\KalkulationClient.tsx'
content = open(f, encoding='utf-8').read()

old1 = """                  <div style={{flex:2,minWidth:150}}>
                    <label style={lbl}>Produktname</label>
                    <input style={inp} value={prod.name}
                      onChange={e=>saveProdukt({id:prod.id,name:e.target.value})}/>
                  </div>"""

new1 = """                  <div style={{flex:2,minWidth:150}}>
                    <label style={lbl}>Produktname</label>
                    <TdInput value={prod.name} width={220} delay={800}
                      onChange={v=>saveProdukt({id:prod.id,name:v})}/>
                  </div>"""

old2 = """                  <div style={{flex:1,minWidth:110}}>
                    <label style={lbl}>Portionen/Monat</label>
                    <input type="number" style={inp} value={prod.verkauf_monat??0}
                      onChange={e=>saveProdukt({id:prod.id,verkauf_monat:parseInt(e.target.value)||0})}/>
                  </div>"""

new2 = """                  <div style={{flex:1,minWidth:110}}>
                    <label style={lbl}>Portionen/Monat</label>
                    <TdInput type="number" value={prod.verkauf_monat??0} width={110} delay={800}
                      onChange={v=>saveProdukt({id:prod.id,verkauf_monat:parseInt(v)||0})}/>
                  </div>"""

found1 = old1 in content
found2 = old2 in content
print(f"Produktname: {found1}, Portionen: {found2}")

if found1: content = content.replace(old1, new1)
if found2: content = content.replace(old2, new2)

if found1 or found2:
    open(f, 'w', encoding='utf-8').write(content)
    print("OK - gespeichert")
else:
    print("FEHLER - Text nicht gefunden")
    idx = content.find("Produktname")
    print(repr(content[idx:idx+200]))
