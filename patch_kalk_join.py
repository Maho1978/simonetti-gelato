f = r'C:\Projekte\simonetti-hybrid\hooks\useKalkulation.ts'
content = open(f, encoding='utf-8').read()

old = "          .select(`*, rezept_positionen(*, zutat:zutaten(*), basis:basis_rezepte(*))`)"
new = "          .select(`*, rezept_positionen(*, zutat:zutaten(*))`)"

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK")
else:
    print("FEHLER")
    idx = content.find("rezept_positionen")
    print(repr(content[idx:idx+100]))
