Set-Content pages\api\driver\orders.js @'
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const { driver_id, status } = req.query;
  if (!driver_id) return res.status(400).json({ error: "driver_id fehlt" });
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("driver_id", driver_id)
    .eq("status", status || "AN_FAHRER")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const ordersWithNav = orders.map((order) => ({
    ...order,
    navigation_url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`,
  }));
  return res.status(200).json({ success: true, orders: ordersWithNav });
}
'@