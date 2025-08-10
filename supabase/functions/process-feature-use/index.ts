import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_LIMIT_PER_DAY = 3;

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

    const { feature } = await req.json();
    if (!feature) {
      return new Response(JSON.stringify({ error: 'Feature name is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: freeCount, error: freeCountError } = await supabaseAdmin
      .from('free_usage_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('used_at', twentyFourHoursAgo);

    if (freeCountError) throw freeCountError;

    const { count: premiumCount, error: premiumCountError } = await supabaseAdmin
      .from('premium_usage_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('used_at', twentyFourHoursAgo);
    
    if (premiumCountError) throw premiumCountError;

    const totalUsage = (freeCount ?? 0) + (premiumCount ?? 0);

    if (totalUsage < FREE_LIMIT_PER_DAY) {
      const { error: logError } = await supabaseAdmin
        .from('free_usage_log')
        .insert({ user_id: user.id, feature_name: feature });

      if (logError) {
        console.error('Failed to log free usage:', logError);
      }

      return new Response(JSON.stringify({ status: 'free_use_logged', remaining_free: FREE_LIMIT_PER_DAY - totalUsage - 1 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      const { error: rpcError } = await supabaseAdmin.rpc('deduct_credit', { user_id_param: user.id });

      if (rpcError) {
        if (rpcError.message.includes('insufficient_credits')) {
          return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 402,
          });
        }
        throw rpcError;
      }

      const { error: logError } = await supabaseAdmin
        .from('premium_usage_log')
        .insert({ user_id: user.id, feature_name: feature });

      if (logError) {
        console.error('Failed to log premium usage:', logError);
      }

      return new Response(JSON.stringify({ status: 'paid_use_logged' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})