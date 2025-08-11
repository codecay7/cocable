import React from 'react';
import { useSession } from '@/hooks/useSession';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, CreditCard, Wand2, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { FeatureUsageChart } from '@/components/admin/FeatureUsageChart';
import { RecentUsersTable } from '@/components/admin/RecentUsersTable';

const ADMIN_EMAIL = 'kumardiwakar497@gmail.com';

const fetchAdminData = async () => {
    const { data, error } = await supabase.functions.invoke('get-admin-dashboard-data');
    if (error) throw new Error(error.message);
    return data;
};

const Admin = () => {
    const { user, loading: sessionLoading } = useSession();
    const isAdmin = !sessionLoading && user?.email === ADMIN_EMAIL;

    const { data: adminData, isLoading, isError, error } = useQuery({
        queryKey: ['adminDashboardData'],
        queryFn: fetchAdminData,
        enabled: isAdmin,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    // Process data safely
    const userCount = adminData?.userCount ?? 0;
    const transactions = adminData?.transactions ?? [];
    const usageLogs = adminData?.usageLogs ?? { free: [], premium: [] };
    const recentUsers = adminData?.recentUsers ?? [];

    const totalRevenue = transactions.reduce((acc, tx) => acc + tx.amount_paid, 0) / 100;
    const totalCreditsSold = transactions.reduce((acc, tx) => acc + tx.credits_purchased, 0);
    const totalFeaturesUsed = (usageLogs.free.length) + (usageLogs.premium.length);

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

    if (isError) {
        return <div className="container mx-auto p-4 md:p-8 text-destructive">Error loading dashboard: {error.message}</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
                <StatCard title="Total Users" value={userCount} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
                <StatCard title="Total Credits Sold" value={totalCreditsSold} icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
                <StatCard title="Total Features Used" value={totalFeaturesUsed} icon={<Wand2 className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
            </div>
            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <FeatureUsageChart data={chartData} isLoading={isLoading} />
                </div>
                <div className="lg:col-span-2">
                    <RecentUsersTable users={recentUsers} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

export default Admin;