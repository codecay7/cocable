import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUploader } from '@/components/ImageUploader';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2, CreditCard } from 'lucide-react';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';

interface ProfileData {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

const Profile = () => {
  const { session, user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const { openModal } = usePurchaseModal();

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setLoading(true);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          showError('Could not fetch your profile.');
          console.error(profileError);
        } else {
          setProfile(profileData);
        }

        const { data: creditsData, error: creditsError } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .single();
        
        if (creditsError) {
          showError('Could not fetch your credits.');
        } else {
          setCredits(creditsData.credits);
        }
        setLoading(false);
      };
      fetchProfile();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    let newAvatarUrl = profile.avatar_url;

    if (newAvatarFile) {
      const filePath = `${user.id}/${newAvatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newAvatarFile, { upsert: true });

      if (uploadError) {
        showError('Failed to upload new avatar.');
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      newAvatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      showError('Failed to update profile.');
    } else {
      showSuccess('Profile updated successfully!');
      setProfile({ ...profile, avatar_url: newAvatarUrl });
      setNewAvatarFile(null);
    }
    setLoading(false);
  };

  if (sessionLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your account details and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={newAvatarFile ? URL.createObjectURL(newAvatarFile) : profile?.avatar_url} />
                  <AvatarFallback>{profile?.first_name?.[0] || user?.email?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <Label>Profile Picture</Label>
                  <ImageUploader onFileSelect={setNewAvatarFile} />
                  <p className="text-xs text-muted-foreground mt-2">Upload a new avatar. It will be updated when you save your profile.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={profile?.first_name || ''} onChange={(e) => setProfile(p => ({...p!, first_name: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={profile?.last_name || ''} onChange={(e) => setProfile(p => ({...p!, last_name: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Usage & Credits</CardTitle>
            <CardDescription>Monitor your usage and remaining credits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{credits ?? <Loader2 className="h-8 w-8 animate-spin" />}</div>
            <p className="text-muted-foreground">credits remaining</p>
            <Button className="mt-4" onClick={openModal}>Buy More Credits</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;