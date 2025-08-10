import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  console.log("📥 Incoming request:", req.method, req.url);

  if (req.method === "OPTIONS") {
    console.log("⚙️ Handling CORS preflight");
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
      },
    });
  }

  try {
    const { amount } = await req.json();
    if (!amount || isNaN(amount)) {
      throw new Error("Invalid or missing amount");
    }

    console.log("💰 Creating Razorpay order for amount:", amount);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      throw new Error("Missing Razorpay credentials in environment variables");
    }

    const auth = btoa(`${keyId}:${keySecret}`);

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amount, // expecting amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1,
      }),
    });

    if (!razorpayRes.ok) {
      const errText = await razorpayRes.text();
      console.error("❌ Razorpay API error:", errText);
      throw new Error(`Razorpay API returned ${razorpayRes.status}`);
    }

    const data = await razorpayRes.json();
    console.log("✅ Razorpay order created:", data);

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("🚨 Error in create-razorpay-order:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});