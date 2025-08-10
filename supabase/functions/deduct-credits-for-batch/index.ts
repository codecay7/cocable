import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { creditsToDeduct, feature, imageCount } = await req.json();
    if (!creditsToDeduct || creditsToDeduct <= 0) throw new Error('Credits to deduct must be a positive number.');
    if (!feature) throw new Error('Feature name is required');
    if (!imageCount || imageCount <= 0) throw new Error('Image count is required.');

    const { error: rpcError } = await supabaseAdmin.rpc('deduct_credits', { 
        user_id_param: user.id,
        credits_to_deduct: creditsToDeduct
    });

    if (rpcError) {
      if (rpcError.message.includes('insufficient_credits')) {
        return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402,
        });
      }
      throw rpcError;
    }

    const logs = Array.from({ length: imageCount }).map(() => ({ user_id: user.id, feature_name: feature }));
    await supabaseAdmin.from('premium_usage_log').insert(logs);

    return new Response(JSON.stringify({ message: 'Credits deducted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})