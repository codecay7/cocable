import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_USAGE_LIMIT = 10;

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
    const { count, error: countError } = await supabaseAdmin
      .from('free_usage_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('used_at', twentyFourHoursAgo);

    if (countError) throw countError;

    if (count !== null && count >= FREE_USAGE_LIMIT) {
      return new Response(JSON.stringify({ error: `You have reached your daily limit of ${FREE_USAGE_LIMIT} free uses.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429, // Too Many Requests
      });
    }

    // Log the usage
    const { error: logError } = await supabaseAdmin
      .from('free_usage_log')
      .insert({ user_id: user.id, feature_name: feature });

    if (logError) {
      // Don't block the user if logging fails, but log it on the server
      console.error('Failed to log free usage:', logError);
    }

    return new Response(JSON.stringify({ message: 'Free usage allowed and logged.' }), {
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