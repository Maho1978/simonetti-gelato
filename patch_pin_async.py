f = r'C:\Projekte\simonetti-hybrid\pages\admin\kalkulation\KalkulationPin.tsx'
content = open(f, encoding='utf-8').read()

old = "  const handleReset = () => {"
new = "  const handleReset = async () => {"

if old in content:
    content = content.replace(old, new)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK")
else:
    print("FEHLER")
