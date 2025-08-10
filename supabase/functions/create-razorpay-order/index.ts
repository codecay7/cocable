import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("📥 Incoming request:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Preflight check
  if (req.method === "OPTIONS") {
    console.log("✅ OPTIONS preflight request received, sending CORS headers...");
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Only allow POST for main logic
  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("💳 Handling Razorpay order creation...");

    // Simulate Razorpay order creation
    const order = { id: "test_order_123", amount: 50000, currency: "INR" };
    console.log("✅ Order created:", order);

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Error creating Razorpay order:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});