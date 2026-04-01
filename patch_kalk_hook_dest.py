f = r'C:\Projekte\simonetti-hybrid\pages\admin\kalkulation\KalkulationClient.tsx'
content = open(f, encoding='utf-8').read()

old = """  const {
    zutaten, betriebskosten, produkte, einstellungen,
    loading, error, betriebGesamt, gesamtPortionen, reload,
    saveEinstellungen, saveBetriebskosten, deleteBetriebskosten,
    saveZutat, deleteZutat, saveProdukt, deleteProdukt,
    saveRezeptPosition, deleteRezeptPosition,
  } = useKalkulation()"""

new = """  const {
    zutaten, betriebskosten, produkte, einstellungen, basisRezepte,
    loading, error, betriebGesamt, gesamtPortionen, reload,
    calcBasisKosten,
    saveEinstellungen, saveBetriebskosten, deleteBetriebskosten,
    saveZutat, deleteZutat, saveProdukt, deleteProdukt,
    saveRezeptPosition, deleteRezeptPosition,
    saveBasis, deleteBasis, saveBasisPosition, deleteBasisPosition,
  } = useKalkulation()"""

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK")
else:
    print("FEHLER")
    idx = content.find("useKalkulation()")
    print(repr(content[max(0,idx-200):idx+100]))
