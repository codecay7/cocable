import React from 'react';
import { useSession } from '@/hooks/useSession';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, CreditCard, Wand2, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { FeatureUsageChart } from '@/components/admin/FeatureUsageChart';
import { RecentUsersTable } from '@/components/admin/RecentUsersTable';
import { toast } from 'sonner';

const ADMIN_EMAIL = 'kumardiwakar497@gmail.com';

const Admin = () => {
    const { user, loading: sessionLoading } = useSession();
    const isAdmin = !sessionLoading && user?.email === ADMIN_EMAIL;

    const { data: userCount, isLoading: isUserCountLoading } = useQuery({
        queryKey: ['adminUserCount'],
        queryFn: async () => {
            const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            if (error) throw new Error(`Users: ${error.message}`);
            return count;
        },
        enabled: isAdmin,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const { data: transactions, isLoading: areTransactionsLoading } = useQuery({
        queryKey: ['adminTransactions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('transactions').select('amount_paid, credits_purchased');
            if (error) throw new Error(`Transactions: ${error.message}`);
            return data;
        },
        enabled: isAdmin,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const { data: usageLogs, isLoading: areUsageLogsLoading } = useQuery({
        queryKey: ['adminUsageLogs'],
        queryFn: async () => {
            const { data: free, error: freeError } = await supabase.from('free_usage_log').select('feature_name');
            if (freeError) throw new Error(`Free Usage: ${freeError.message}`);
            const { data: premium, error: premiumError } = await supabase.from('premium_usage_log').select('feature_name');
            if (premiumError) throw new Error(`Premium Usage: ${premiumError.message}`);
            return { free, premium };
        },
        enabled: isAdmin,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const { data: recentUsers, isLoading: areRecentUsersLoading } = useQuery({
        queryKey: ['adminRecentUsers'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('id, created_at, first_name, last_name, avatar_url').order('created_at', { ascending: false }).limit(5);
            if (error) throw new Error(`Recent Users: ${error.message}`);
            return data;
        },
        enabled: isAdmin,
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Process data safely
    const totalRevenue = transactions?.reduce((acc, tx) => acc + tx.amount_paid, 0) / 100 ?? 0;
    const totalCreditsSold = transactions?.reduce((acc, tx) => acc + tx.credits_purchased, 0) ?? 0;
    const totalFeaturesUsed = (usageLogs?.free?.length ?? 0) + (usageLogs?.premium?.length ?? 0);

    const chartData = React.useMemo(() => {
        if (!usageLogs) return [];
        const freeCounts = usageLogs.free.reduce((acc, i) => ({ ...acc, [i.feature_name]: (acc[i.feature_name] || 0) + 1 }), {} as Record<string, number>);
        const premiumCounts = usageLogs.premium.reduce((acc, i) => ({ ...acc, [i.feature_name]: (acc[i.feature_name] || 0) + 1 }), {} as Record<string, number>);
        const features = [...new Set([...Object.keys(freeCounts), ...Object.keys(premiumCounts)])];
        return features.map(f => ({
            name: f.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, l => l.toUpperCase()),
            free: freeCounts[f] || 0,
            premium: premiumCounts[f] || 0,
        }));
    }, [usageLogs]);

    if (sessionLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} isLoading={areTransactionsLoading} />
                <StatCard title="Total Users" value={userCount ?? 'N/A'} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={isUserCountLoading} />
                <StatCard title="Total Credits Sold" value={totalCreditsSold} icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} isLoading={areTransactionsLoading} />
                <StatCard title="Total Features Used" value={totalFeaturesUsed} icon={<Wand2 className="h-4 w-4 text-muted-foreground" />} isLoading={areUsageLogsLoading} />
            </div>
            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <FeatureUsageChart data={chartData} isLoading={areUsageLogsLoading} />
                </div>
                <div className="lg:col-span-2">
                    <RecentUsersTable users={recentUsers ?? []} isLoading={areRecentUsersLoading} />
                </div>
            </div>
        </div>
    );
};

export default Admin;