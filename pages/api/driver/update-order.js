Set-Content pages\api\driver\update-order.js @'
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { order_id, driver_id, status } = req.body;
  if (!order_id || !driver_id) return res.status(400).json({ error: "Fehlende Parameter" });
  const updateData = { status };
  if (status === "GELIEFERT") updateData.delivered_at = new Date().toISOString();
  const { data: order, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", order_id)
    .eq("driver_id", driver_id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, order });
}
'@