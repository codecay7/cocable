import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { createHmac } from "https://deno.land/std@0.190.0/crypto/hmac.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

function verifySignature(body: string, signature: string, secret: string): boolean {
  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.toString();
  return digest === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { order_id, payment_id, signature } = await req.json();
    const body = `${order_id}|${payment_id}`;

    const isVerified = verifySignature(body, signature, RAZORPAY_KEY_SECRET!);

    if (!isVerified) {
      throw new Error('Payment verification failed. Signature mismatch.');
    }

    const credits_to_add = 50; // Hardcoded for the 50 credit pack

    const { error: rpcError } = await supabaseAdmin.rpc('add_credits', {
      user_id_param: user.id,
      credits_to_add: credits_to_add
    });

    if (rpcError) {
      throw new Error(`Failed to add credits: ${rpcError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Payment verified and credits added.' }), {
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