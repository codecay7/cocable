import React from 'react';
import { useSession } from '@/hooks/useSession';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, CreditCard, Wand2, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { FeatureUsageChart } from '@/components/admin/FeatureUsageChart';
import { RecentUsersTable } from '@/components/admin/RecentUsersTable';
import { showError } from '@/utils/toast';

const ADMIN_EMAIL = 'kumardiwakar497@gmail.com';

const fetchAdminData = async () => {
    const { count: userCount, error: userError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    if (userError) throw new Error(`Failed to fetch users: ${userError.message}`);

    const { data: transactions, error: transactionError } = await supabase.from('transactions').select('amount_paid, credits_purchased');
    if (transactionError) throw new Error(`Failed to fetch transactions: ${transactionError.message}`);

    const { data: freeUsage, error: freeUsageError } = await supabase.from('free_usage_log').select('feature_name');
    if (freeUsageError) throw new Error(`Failed to fetch free usage: ${freeUsageError.message}`);

    const { data: premiumUsage, error: premiumUsageError } = await supabase.from('premium_usage_log').select('feature_name');
    if (premiumUsageError) throw new Error(`Failed to fetch premium usage: ${premiumUsageError.message}`);

    const { data: recentUsers, error: recentUsersError } = await supabase.from('profiles').select('id, created_at, first_name, last_name, avatar_url').order('created_at', { ascending: false }).limit(5);
    if (recentUsersError) throw new Error(`Failed to fetch recent users: ${recentUsersError.message}`);

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

    return {
        userCount,
        totalRevenue,
        totalCreditsSold,
        totalFeaturesUsed: freeUsage.length + premiumUsage.length,
        chartData,
        recentUsers
    };
};

const Admin = () => {
    const { user, loading: sessionLoading } = useSession();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['adminData'],
        queryFn: fetchAdminData,
        enabled: !sessionLoading && user?.email === ADMIN_EMAIL,
    });

    if (sessionLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (user?.email !== ADMIN_EMAIL) {
        return <Navigate to="/" replace />;
    }

    if (isError) {
        showError(error.message);
        return <div className="text-center text-destructive p-8">Failed to load admin data. Check RLS policies and console for errors.</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Total Revenue" value={`₹${data?.totalRevenue.toFixed(2) ?? '0.00'}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
                <StatCard title="Total Users" value={data?.userCount ?? 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
                <StatCard title="Total Credits Sold" value={data?.totalCreditsSold ?? 0} icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
                <StatCard title="Total Features Used" value={data?.totalFeaturesUsed ?? 0} icon={<Wand2 className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
            </div>
            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <FeatureUsageChart data={data?.chartData ?? []} isLoading={isLoading} />
                </div>
                <div className="lg:col-span-2">
                    <RecentUsersTable users={data?.recentUsers ?? []} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

export default Admin;