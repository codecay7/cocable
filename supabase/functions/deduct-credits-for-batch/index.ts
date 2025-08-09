import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { creditsToDeduct, feature, imageCount } = await req.json();
    if (!creditsToDeduct || creditsToDeduct <= 0) {
      return new Response(JSON.stringify({ error: 'Credits to deduct must be a positive number.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (!feature) {
        return new Response(JSON.stringify({ error: 'Feature name is required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
    if (!imageCount || imageCount <= 0) {
        return new Response(JSON.stringify({ error: 'Image count is required.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // Call the new SQL function
    const { error: rpcError } = await supabaseAdmin.rpc('deduct_credits', { 
        user_id_param: user.id,
        credits_to_deduct: creditsToDeduct
    });

    if (rpcError) {
      if (rpcError.message.includes('insufficient_credits')) {
        return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 402, // Payment Required
        });
      }
      throw rpcError;
    }

    // Log usage for each image
    const logs = Array.from({ length: imageCount }).map(() => ({
        user_id: user.id,
        feature_name: feature
    }));

    const { error: logError } = await supabaseAdmin
        .from('premium_usage_log')
        .insert(logs);

    if (logError) {
        // Don't fail the whole request if logging fails, but log it server-side
        console.error('Failed to log batch premium usage:', logError);
    }


    return new Response(JSON.stringify({ message: 'Credits deducted successfully' }), {
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