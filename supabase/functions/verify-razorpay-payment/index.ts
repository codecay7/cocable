import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { timingSafeEqual } from "https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts";
import { encodeToString } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('Payment provider not configured on the server.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: Missing token');
    }
    
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) {
      throw new Error('Unauthorized: Invalid token');
    }

    const { order_id, payment_id, signature } = await req.json();
    if (!order_id || !payment_id || !signature) {
      throw new Error('Missing payment details in request.');
    }

    const body = `${order_id}|${payment_id}`;
    const isVerified = await verifySignature(body, signature, RAZORPAY_KEY_SECRET);
    if (!isVerified) {
      throw new Error('Payment verification failed. Signature mismatch.');
    }

    const { error: rpcError } = await supabaseAdmin.rpc('add_credits', {
      user_id_param: user.id,
      credits_to_add: 50
    });
    if (rpcError) {
      throw new Error(`Failed to add credits: ${rpcError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const generatedSignature = encodeToString(new Uint8Array(mac));
  try {
    return timingSafeEqual(
      new TextEncoder().encode(generatedSignature),
      new TextEncoder().encode(signature),
    );
  } catch {
    return false;
  }
}