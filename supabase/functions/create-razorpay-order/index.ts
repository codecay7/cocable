import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// Define the single allowed product for server-side validation
const ALLOWED_AMOUNT = 50000; // 500.00 INR in paise

serve(async (req) => {
  console.log("📥 Incoming request:", req.method, req.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  };

  if (req.method === "OPTIONS") {
    console.log("⚙️ Handling CORS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount } = await req.json();

    // 1. Server-side amount validation
    if (!amount || amount !== ALLOWED_AMOUNT) {
      console.error(`🚨 Invalid amount received: ${amount}. Expected: ${ALLOWED_AMOUNT}`);
      throw new Error("Invalid payment amount specified.");
    }

    console.log("💰 Creating Razorpay order for amount:", amount);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      console.error("❌ Missing Razorpay credentials in environment variables.");
      throw new Error("Payment provider is not configured on the server.");
    }

    const auth = btoa(`${keyId}:${keySecret}`);

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1,
      }),
    });

    // 2. Better error mapping
    if (!razorpayRes.ok) {
      const errorBody = await razorpayRes.json();
      const errorMessage = errorBody?.error?.description || 'Failed to create payment order.';
      console.error("❌ Razorpay API error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await razorpayRes.json();
    console.log("✅ Razorpay order created:", data.id);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 Error in create-razorpay-order:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});