f = r'C:\Projekte\simonetti-hybrid\pages\checkout.tsx'
content = open(f, encoding='utf-8').read()

# 1. State: hausnummer hinzufügen
old_state = "  const [street, setStreet] = useState('')"
new_state = "  const [street, setStreet] = useState('')\n  const [hausnr, setHausnr] = useState('')"
content = content.replace(old_state, new_state)

# 2. isFormValid - street + hausnr prüfen
old_valid = "    : !!(name.trim() && phone.trim() && street.trim() && (!isGuest || email.trim()))"
new_valid = "    : !!(name.trim() && phone.trim() && street.trim() && hausnr.trim() && (!isGuest || email.trim()))"
content = content.replace(old_valid, new_valid)

# 3. delivery_address - street + hausnr zusammenführen
old_addr = "      delivery_address:  orderType === 'pickup' ? null : { name, street, zip, city },"
new_addr = "      delivery_address:  orderType === 'pickup' ? null : { name, street: `${street} ${hausnr}`.trim(), zip, city },"
content = content.replace(old_addr, new_addr)

# 4. StripeForm übergabe - hausnr mitgeben
old_stripe_call = "                          street={street} zip={zip} city={city} notes={notes} orderType={orderType}"
new_stripe_call = "                          street={`${street} ${hausnr}`.trim()} zip={zip} city={city} notes={notes} orderType={orderType}"
content = content.replace(old_stripe_call, new_stripe_call)

# 5. UI - Straße & Hausnummer trennen
old_ui = """                      <Field label="Straße & Hausnummer" required>
                        <StreetInput street={street} setStreet={setStreet} inputClass={inputClass} />
                      </Field>"""
new_ui = """                      <div style={{display:'grid', gridTemplateColumns:'1fr 100px', gap:'8px'}}>
                        <Field label="Straße" required>
                          <StreetInput street={street} setStreet={setStreet} inputClass={inputClass} />
                        </Field>
                        <Field label="Hausnummer" required>
                          <input type="text" value={hausnr} onChange={e => setHausnr(e.target.value)}
                            placeholder="12a" className={inputClass} />
                        </Field>
                      </div>"""
content = content.replace(old_ui, new_ui)

open(f, 'w', encoding='utf-8').write(content)

# Prüfen
checks = [
    "hausnr" in content,
    "Hausnummer" in content,
    "street} ${hausnr}" in content,
]
print("OK" if all(checks) else "FEHLER", checks)
