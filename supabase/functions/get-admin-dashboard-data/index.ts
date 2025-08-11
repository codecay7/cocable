import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ADMIN_EMAIL = 'kumardiwakar497@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Authenticate user and check if they are admin
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user || user.email !== ADMIN_EMAIL) {
      throw new Error('Unauthorized');
    }

    // --- Re-implement RPC logic directly in the function for robustness ---

    // Get user count
    const { count: userCount, error: userCountError } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    if (userCountError) throw userCountError;

    // Get revenue and credits sold
    const { data: transactionsData, error: transactionsError } = await supabaseAdmin.from('transactions').select('amount_paid, credits_purchased');
    if (transactionsError) throw transactionsError;
    const totalRevenue = transactionsData.reduce((sum, t) => sum + (t.amount_paid || 0), 0);
    const totalCreditsSold = transactionsData.reduce((sum, t) => sum + (t.credits_purchased || 0), 0);

    // Get recent users
    const { data: recentUsers, error: recentUsersError } = await supabaseAdmin.from('profiles').select('id, created_at, first_name, last_name, avatar_url').order('created_at', { ascending: false }).limit(5);
    if (recentUsersError) throw recentUsersError;

    // Get feature usage
    const { data: freeUsage, error: freeUsageError } = await supabaseAdmin.from('free_usage_log').select('feature_name');
    if (freeUsageError) throw freeUsageError;
    const { data: premiumUsage, error: premiumUsageError } = await supabaseAdmin.from('premium_usage_log').select('feature_name');
    if (premiumUsageError) throw premiumUsageError;

    const freeCounts: { [key: string]: number } = freeUsage.reduce((acc, log) => {
      acc[log.feature_name] = (acc[log.feature_name] || 0) + 1;
      return acc;
    }, {});

    const premiumCounts: { [key: string]: number } = premiumUsage.reduce((acc, log) => {
      acc[log.feature_name] = (acc[log.feature_name] || 0) + 1;
      return acc;
    }, {});

    const allFeatureNames = [...new Set([...Object.keys(freeCounts), ...Object.keys(premiumCounts)])];
    const featureUsage = allFeatureNames.map(name => ({
      name,
      free: freeCounts[name] || 0,
      premium: premiumCounts[name] || 0,
    }));

    // Build final result object
    const result = {
      userCount,
      totalRevenue,
      totalCreditsSold,
      recentUsers,
      featureUsage,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error("Error in get-admin-dashboard-data function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})