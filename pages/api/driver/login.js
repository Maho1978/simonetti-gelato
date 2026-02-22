Set-Content pages\api\driver\login.js @'
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { email, password } = req.body;
  const { data: driver, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("is_active", true)
    .single();
  if (error || !driver) return res.status(401).json({ error: "Fahrer nicht gefunden" });
  const valid = await bcrypt.compare(password, driver.password_hash);
  if (!valid) return res.status(401).json({ error: "Falsches Passwort" });
  const { password_hash, ...safeDriver } = driver;
  return res.status(200).json({ success: true, driver: safeDriver });
}
'@