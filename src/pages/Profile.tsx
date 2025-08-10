import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2, CreditCard } from 'lucide-react';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RedeemCoupon } from '@/components/RedeemCoupon';
import { Badge } from '@/components/ui/badge';
import { TransactionHistory } from '@/components/TransactionHistory';
import { AvatarUploader } from '@/components/AvatarUploader';
import { Separator } from '@/components/ui/separator';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

const fetchProfile = async (userId: string): Promise<ProfileData> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const fetchCredits = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code === 'PGRST116') {
    return 0;
  }
  if (error) throw new Error(error.message);
  return data.credits;
};

const Profile = () => {
  const { session, user, loading: sessionLoading } = useSession();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const { openModal } = usePurchaseModal();

  const isRazorpayConfigured = !!import.meta.env.VITE_RAZORPAY_KEY_ID;

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const { data: credits, isLoading: isCreditsLoading } = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: () => fetchCredits(user!.id),
    enabled: !!user,
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsUpdating(true);
    let newAvatarUrl = profile.avatar_url;

    if (newAvatarFile) {
      const filePath = `${user.id}/${Date.now()}-${newAvatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newAvatarFile, { upsert: true });

      if (uploadError) {
        showError('Failed to upload new avatar.');
        setIsUpdating(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      newAvatarUrl = urlData.publicUrl;

      await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl }
      });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        first_name: formData.first_name,
        last_name: formData.last_name,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      showError('Failed to update profile.');
    } else {
      showSuccess('Profile updated successfully!');
      setNewAvatarFile(null);
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    }
    setIsUpdating(false);
  };

  if (sessionLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const isLoading = isProfileLoading || isCreditsLoading;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Account Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your account details and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <AvatarUploader
                  src={newAvatarFile ? URL.createObjectURL(newAvatarFile) : profile?.avatar_url}
                  fallback={formData?.first_name?.[0] || user?.email?.[0] || 'U'}
                  onFileSelect={setNewAvatarFile}
                />
                
                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData?.first_name || ''} onChange={(e) => setFormData(p => ({...p, first_name: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData?.last_name || ''} onChange={(e) => setFormData(p => ({...p, last_name: e.target.value}))} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Usage & Credits</CardTitle>
              <CardDescription>Monitor your usage and remaining credits.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-6 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Credits Remaining</p>
                  <div className="text-4xl font-bold">
                    {isCreditsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : credits}
                  </div>
                </div>
                <Button onClick={openModal} disabled={!isRazorpayConfigured}>
                  Buy Credits
                </Button>
              </div>
              {!isRazorpayConfigured && (
                <div className="mt-4">
                  <Badge variant="destructive">
                    Payments Not Configured
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Please add VITE_RAZORPAY_KEY_ID to your .env file and Rebuild.</p>
                </div>
              )}
            </CardContent>
            <RedeemCoupon />
          </Card>

          <TransactionHistory />
        </div>
      </div>
    </div>
  );
};

export default Profile;