f = r'C:\Projekte\simonetti-hybrid\pages\admin\kalkulation\KalkulationClient.tsx'
content = open(f, encoding='utf-8').read()

old = """                                <td style={td}><span style={{fontSize:12,color:C.muted}}>{pos.einheit}</span></td>"""

new = """                                <td style={td}>
                                  <select style={sel} value={pos.einheit}
                                    onChange={e=>saveBasisPosition({id:pos.id, einheit:e.target.value})}>
                                    {['g','kg','L','ml','Stk','EL','TL'].map(u=><option key={u}>{u}</option>)}
                                  </select>
                                </td>"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK")
else:
    print("FEHLER")
    idx = content.find("pos.einheit")
    print(repr(content[idx:idx+200]))
