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

    // 1. Authenticate the user and check if they are an admin
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user || user.email !== ADMIN_EMAIL) {
      throw new Error('Unauthorized: Not an admin');
    }

    // 2. Fetch all data using the admin client (bypasses RLS)
    const { count: userCount, error: userError } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    if (userError) throw new Error(`Failed to fetch users: ${userError.message}`);

    const { data: transactions, error: transactionError } = await supabaseAdmin.from('transactions').select('amount_paid, credits_purchased');
    if (transactionError) throw new Error(`Failed to fetch transactions: ${transactionError.message}`);

    const { data: freeUsage, error: freeUsageError } = await supabaseAdmin.from('free_usage_log').select('feature_name');
    if (freeUsageError) throw new Error(`Failed to fetch free usage: ${freeUsageError.message}`);

    const { data: premiumUsage, error: premiumUsageError } = await supabaseAdmin.from('premium_usage_log').select('feature_name');
    if (premiumUsageError) throw new Error(`Failed to fetch premium usage: ${premiumUsageError.message}`);

    const { data: recentUsers, error: recentUsersError } = await supabaseAdmin.from('profiles').select('id, created_at, first_name, last_name, avatar_url').order('created_at', { ascending: false }).limit(5);
    if (recentUsersError) throw new Error(`Failed to fetch recent users: ${recentUsersError.message}`);

    // 3. Process the data
    const totalRevenue = transactions.reduce((acc, tx) => acc + tx.amount_paid, 0) / 100;
    const totalCreditsSold = transactions.reduce((acc, tx) => acc + tx.credits_purchased, 0);

    const freeFeatureCounts = freeUsage.reduce((acc, item) => {
        acc[item.feature_name] = (acc[item.feature_name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const premiumFeatureCounts = premiumUsage.reduce((acc, item) => {
        acc[item.feature_name] = (acc[item.feature_name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const uniqueFeatures = [...new Set([...Object.keys(freeFeatureCounts), ...Object.keys(premiumFeatureCounts)])];
    const chartData = uniqueFeatures.map(feature => ({
        name: feature.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
        free: freeFeatureCounts[feature] || 0,
        premium: premiumFeatureCounts[feature] || 0,
    }));

    const responsePayload = {
        userCount,
        totalRevenue,
        totalCreditsSold,
        totalFeaturesUsed: freeUsage.length + premiumUsage.length,
        chartData,
        recentUsers
    };

    // 4. Return the data
    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})