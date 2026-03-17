f = r'C:\Projekte\simonetti-hybrid\pages\account.tsx'
content = open(f, encoding='utf-8').read()

# signOut import hinzufügen falls nicht da
if 'signOut' not in content:
    # Abmelden Funktion nach den anderen Handler-Funktionen einfügen
    old_return = '  return (\n    <div className="min-h-screen'
    new_return = '''  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen'''
    content = content.replace(old_return, new_return, 1)

# Abmelden Button vor dem letzten </div></div></div> einfügen
old_end = '''        </div>
      </div>
    </div>
  )
}'''

new_end = '''        </div>

        {/* Abmelden */}
        <div className="max-w-4xl mx-auto px-4 pb-10">
          <button
            onClick={handleSignOut}
            className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition text-sm"
          >
            🚪 Abmelden
          </button>
        </div>

      </div>
    </div>
  )
}'''

if old_end in content:
    content = content.replace(old_end, new_end)
    open(f, 'w', encoding='utf-8').write(content)
    print("OK - Abmelden Button eingefuegt")
else:
    print("FEHLER - Ende nicht gefunden")
    print(repr(content[-200:]))