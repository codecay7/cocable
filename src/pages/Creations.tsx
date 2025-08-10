import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, ImageOff, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Creation {
  id: string;
  created_at: string;
  feature: string;
  original_storage_path: string;
  processed_storage_path: string;
}

const fetchCreations = async (userId: string): Promise<Creation[]> => {
  const { data, error } = await supabase
    .from('creations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const deleteCreation = async (creationId: string, paths: string[]) => {
  const { error: storageError } = await supabase.storage.from('creations').remove(paths);
  if (storageError) {
    console.error("Failed to delete files from storage:", storageError);
    toast.error("Could not delete files from storage, but removing record.");
  }

  const { error: dbError } = await supabase.from('creations').delete().eq('id', creationId);
  if (dbError) throw new Error(dbError.message);
};

const CreationCard = ({ creation }: { creation: Creation }) => {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data: processedUrl } = useQuery({
    queryKey: ['imageUrl', creation.processed_storage_path],
    queryFn: () => supabase.storage.from('creations').getPublicUrl(creation.processed_storage_path).data.publicUrl,
    enabled: !!creation.processed_storage_path,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCreation(creation.id, [creation.original_storage_path, creation.processed_storage_path]),
    onSuccess: () => {
      toast.success("Creation deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['creations', user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to delete creation: ${error.message}`);
    },
  });

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `clearcut-${creation.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardContent className="p-0 aspect-square bg-muted/50 flex items-center justify-center">
        {processedUrl ? (
          <img src={processedUrl} alt={`Creation from ${creation.feature}`} className="w-full h-full object-contain" />
        ) : (
          <Loader2 className="w-8 h-8 animate-spin" />
        )}
      </CardContent>
      <CardFooter className="p-3 flex flex-col items-start gap-2">
        <div className="flex justify-between w-full items-center">
          <Badge variant="secondary">{creation.feature.replace(/_/g, ' ')}</Badge>
          <p className="text-xs text-muted-foreground">{new Date(creation.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2 w-full">
          <Button onClick={handleDownload} size="sm" className="flex-1" disabled={!processedUrl}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the creation and its associated files.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

const Creations = () => {
  const { session, user, loading: sessionLoading } = useSession();

  const { data: creations, isLoading, isError } = useQuery({
    queryKey: ['creations', user?.id],
    queryFn: () => fetchCreations(user!.id),
    enabled: !!user,
  });

  if (sessionLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Creations</h1>
      {isLoading && <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      {isError && <p className="text-destructive text-center">Could not load your creations.</p>}
      {!isLoading && !isError && (
        creations && creations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creations.map(creation => (
              <CreationCard key={creation.id} creation={creation} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <ImageOff className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Creations Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Use one of our tools to start creating images.</p>
          </div>
        )
      )}
    </div>
  );
};

export default Creations;