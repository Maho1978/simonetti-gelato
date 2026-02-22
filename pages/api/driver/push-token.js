import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { driver_id, push_token } = req.body;
  await supabase.from("drivers").update({ push_token }).eq("id", driver_id);
  return res.status(200).json({ success: true });
}
