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
    const { data, error } = await supabase.functions.invoke('get-admin-data');
    if (error) {
        const errorMessage = (error as any).context?.error_message || error.message;
        throw new Error(errorMessage);
    }
    return data;
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
        return <div className="text-center text-destructive p-8">Failed to load admin data: {error.message}. This might be due to the edge function not being deployed or a server-side error.</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Total Revenue" value={`₹${data?.totalRevenue?.toFixed(2) ?? '0.00'}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
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