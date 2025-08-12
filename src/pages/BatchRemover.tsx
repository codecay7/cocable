import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiImageUploader } from '@/components/MultiImageUploader';
import { FileQueueItem } from '@/components/FileQueueItem';
import { Loader2, Download, Play, Trash2, CreditCard } from 'lucide-react';
import { showError, showLoading, dismissToast } from '@/utils/toast';
import { gsap } from 'gsap';
import JSZip from 'jszip';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { saveCreation } from '@/utils/creations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { resizeImage } from '@/utils/image';

export interface QueueFile {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  result?: string;
  error?: string;
}

const MAX_WORKERS = navigator.hardwareConcurrency || 4;

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

const BatchRemover = () => {
  const [queue, setQueue] = useState<QueueFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState<'general' | 'landscape'>('general');
  const cardRef = useRef(null);
  const workersRef = useRef<Worker[]>([]);
  const fileQueueRef = useRef<QueueFile[]>([]);
  const { session, user } = useSession();
  const { openModal } = usePurchaseModal();
  const queryClient = useQueryClient();

  const { data: credits } = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: () => fetchCredits(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    gsap.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
    
    workersRef.current = Array.from({ length: MAX_WORKERS }, () => {
      const worker = new Worker(new URL('../workers/segmentation.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => handleWorkerMessage(e.data);
      return worker;
    });

    return () => {
      workersRef.current.forEach(worker => worker.terminate());
    };
  }, []);

  const handleWorkerMessage = (data: any) => {
    const { type, id, progress, result, error } = data;
    switch (type) {
      case 'progress':
        setQueue(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
        break;
      case 'done':
        setQueue(prev => {
          const originalFile = prev.find(f => f.id === id)?.file;
          if (user && originalFile && result) {
            saveCreation(user.id, `batch_remover_${quality}`, originalFile, result).catch(err => {
              console.error("Failed to save creation in background", err);
            });
          }
          return prev.map(f => f.id === id ? { ...f, status: 'done', progress: 100, result } : f);
        });
        processNextFileInQueue();
        break;
      case 'error':
        setQueue(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error } : f));
        processNextFileInQueue();
        break;
    }
  };

  const processNextFileInQueue = () => {
    if (fileQueueRef.current.length > 0) {
      const fileToProcess = fileQueueRef.current.shift();
      if (fileToProcess) {
        const worker = workersRef.current.find(w => !(w as any).busy);
        if (worker) {
          (worker as any).busy = true;
          setQueue(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing', progress: 10 } : f));
          worker.postMessage({ id: fileToProcess.id, file: fileToProcess.file, quality });
          worker.onmessage = (e) => {
            (worker as any).busy = false;
            handleWorkerMessage(e.data);
          };
        } else {
          fileQueueRef.current.unshift(fileToProcess);
        }
      }
    } else {
      const allDone = queue.every(f => f.status === 'done' || f.status === 'error');
      if(allDone) setIsProcessing(false);
    }
  };

  const handleFilesSelect = async (files: File[]) => {
    if (!session) {
      showError("Please log in to use the batch processing feature.");
      return;
    }

    const toastId = showLoading(`Preparing ${files.length} image(s)...`);
    try {
      const resizePromises = files.map(file => resizeImage(file, 1920));
      const resizedFiles = await Promise.all(resizePromises);

      const newQueueFiles: QueueFile[] = resizedFiles.map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        status: 'queued',
        progress: 0,
      }));
      setQueue(prev => [...prev, ...newQueueFiles]);
      dismissToast(toastId);
    } catch (error) {
      dismissToast(toastId);
      showError("There was an error preparing some images. Please check the file types and try again.");
      console.error("Batch image resizing failed:", error);
    }
  };

  const handleProcessBatch = async () => {
    const filesToProcess = queue.filter(f => f.status === 'queued');
    if (filesToProcess.length === 0) {
      showError("No new files in the queue to process.");
      return;
    }

    const creditsNeeded = Math.ceil(filesToProcess.length / 2);

    if (credits === null || credits < creditsNeeded) {
      showError(`You need ${creditsNeeded} credits for this batch, but you only have ${credits ?? 0}.`);
      openModal();
      return;
    }

    setIsProcessing(true);
    try {
      const { error: functionError } = await supabase.functions.invoke('deduct-credits-for-batch', {
        body: { creditsToDeduct: creditsNeeded, feature: 'batch_background_removal', imageCount: filesToProcess.length }
      });

      if (functionError) {
        if (functionError.message.includes('Insufficient credits')) {
          showError("You don't have enough credits for this batch.");
          openModal();
        } else {
          throw functionError;
        }
        setIsProcessing(false);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['credits', user?.id] });
      toast.success(`${creditsNeeded} credit(s) used for processing ${filesToProcess.length} images.`);

      fileQueueRef.current = [...filesToProcess];
      for (let i = 0; i < Math.min(MAX_WORKERS, fileQueueRef.current.length); i++) {
        processNextFileInQueue();
      }

    } catch (error: any) {
      showError(`An error occurred: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const doneFiles = queue.filter(f => f.status === 'done' && f.result);

    if (doneFiles.length === 0) {
      showError("No processed images to download.");
      return;
    }

    for (const file of doneFiles) {
      const response = await fetch(file.result!);
      const blob = await response.blob();
      const originalName = file.file.name.split('.').slice(0, -1).join('.');
      zip.file(`${originalName}-processed.png`, blob);
    }

    zip.generateAsync({ type: 'blob' }).then(content => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'clearcut-batch-results.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleClearQueue = () => {
    setQueue([]);
    setIsProcessing(false);
    fileQueueRef.current = [];
  };

  const totalFiles = queue.length;
  const doneCount = queue.filter(f => f.status === 'done').length;
  const isQueueEmpty = totalFiles === 0;
  const filesToProcessCount = queue.filter(f => f.status === 'queued').length;
  const creditsNeeded = Math.ceil(filesToProcessCount / 2);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card ref={cardRef} className="max-w-4xl mx-auto bg-card/50 backdrop-blur-xl border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Batch Background Remover</CardTitle>
          <CardDescription>A premium feature to process dozens of images at once. Costs 1 credit per 2 images.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <div className="text-center space-y-4 p-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">You need to be logged in to use the Batch Remover.</p>
              <Button asChild><Link to="/login">Login or Sign Up</Link></Button>
            </div>
          ) : (
            <>
              <MultiImageUploader onFilesSelect={handleFilesSelect} disabled={isProcessing} />
              
              {!isQueueEmpty && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                    <RadioGroup defaultValue="general" onValueChange={(value: 'general' | 'landscape') => setQuality(value)} className="flex items-center justify-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="general" id="q-general" />
                        <Label htmlFor="q-general">Standard (For People)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="landscape" id="q-landscape" />
                        <Label htmlFor="q-landscape">High Quality (For Objects)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="text-center sm:text-left">
                      <p className="font-semibold">{totalFiles} files in queue, {doneCount} processed.</p>
                      {filesToProcessCount > 0 && (
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          <p className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> This batch will cost <span className="font-bold text-primary">{creditsNeeded}</span> credit(s).</p>
                          <p>You have <span className="font-bold text-primary">{credits ?? '...'}</span> credits remaining.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleProcessBatch} disabled={isProcessing || filesToProcessCount === 0}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : 'Start Batch'}
                      </Button>
                      <Button onClick={handleClearQueue} variant="destructive" disabled={isProcessing}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto p-2">
                    {queue.map(file => (<FileQueueItem key={file.id} {...file} />))}
                  </div>

                  <Button onClick={handleDownloadAll} disabled={isProcessing || doneCount === 0} size="lg" className="w-full">
                    <Download className="mr-2 h-4 w-4" /> Download All as ZIP ({doneCount})
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchRemover;