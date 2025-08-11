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
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
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
    const totalRevenue = (adminData?.totalRevenue ?? 0) / 100;
    const totalCreditsSold = adminData?.totalCreditsSold ?? 0;
    const recentUsers = adminData?.recentUsers ?? [];
    
    const chartData = React.useMemo(() => {
        if (!adminData?.featureUsage) return [];
        return adminData.featureUsage.map((f: any) => ({
            name: f.name.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, (l: string) => l.toUpperCase()),
            free: f.free,
            premium: f.premium,
        }));
    }, [adminData?.featureUsage]);

    const totalFeaturesUsed = React.useMemo(() => {
        if (!adminData?.featureUsage) return 0;
        return adminData.featureUsage.reduce((acc: number, f: any) => acc + f.free + f.premium, 0);
    }, [adminData?.featureUsage]);

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