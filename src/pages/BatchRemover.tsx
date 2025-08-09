import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiImageUploader } from '@/components/MultiImageUploader';
import { FileQueueItem } from '@/components/FileQueueItem';
import { Loader2, Download, Play, Trash2, CreditCard } from 'lucide-react';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { showError } from '@/utils/toast';
import { gsap } from 'gsap';
import JSZip from 'jszip';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';
import { toast } from 'sonner';

export interface QueueFile {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  result?: string;
  error?: string;
}

const BatchRemover = () => {
  const [queue, setQueue] = useState<QueueFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const cardRef = useRef(null);
  const { session, user } = useSession();
  const { openModal } = usePurchaseModal();

  useEffect(() => {
    gsap.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
  }, []);

  useEffect(() => {
    if (user) {
      const fetchCredits = async () => {
        const { data, error } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .single();
        if (!error && data) {
          setCredits(data.credits);
        }
      };
      fetchCredits();
    }
  }, [user]);

  const handleFilesSelect = (files: File[]) => {
    if (!session) {
      showError("Please log in to use the batch processing feature.");
      return;
    }
    const newQueueFiles: QueueFile[] = files.map(file => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      status: 'queued',
      progress: 0,
    }));
    setQueue(prev => [...prev, ...newQueueFiles]);
  };

  const updateFileProgress = (id: string, progress: number) => {
    setQueue(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
  };

  const processFile = async (queueFile: QueueFile) => {
    setQueue(prev => prev.map(f => f.id === queueFile.id ? { ...f, status: 'processing' } : f));
    
    let progressInterval: NodeJS.Timeout;
    try {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 95) {
          updateFileProgress(queueFile.id, progress);
        }
      }, 100);

      const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
      const segmenter = await bodySegmentation.createSegmenter(model, { runtime: 'tfjs', modelType: 'general' });
      const imageElement = new Image();
      imageElement.src = URL.createObjectURL(queueFile.file);
      await imageElement.decode();
      const segmentation = await segmenter.segmentPeople(imageElement);
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(imageElement, 0, 0);
      const foreground = { r: 0, g: 0, b: 0, a: 255 };
      const background = { r: 0, g: 0, b: 0, a: 0 };
      const binaryMask = await bodySegmentation.toBinaryMask(segmentation, foreground, background);
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = imageElement.width;
      maskCanvas.height = imageElement.height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error('Could not get mask canvas context');
      maskCtx.putImageData(binaryMask, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);
      
      clearInterval(progressInterval);
      setQueue(prev => prev.map(f => f.id === queueFile.id ? { ...f, status: 'done', progress: 100, result: canvas.toDataURL('image/png') } : f));
    } catch (e: any) {
      console.error("Batch processing failed for a file:", e);
      clearInterval(progressInterval!);
      setQueue(prev => prev.map(f => f.id === queueFile.id ? { ...f, status: 'error', error: 'Processing failed' } : f));
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
        body: { 
          creditsToDeduct: creditsNeeded,
          feature: 'batch_background_removal',
          imageCount: filesToProcess.length
        }
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

      setCredits(c => (c !== null ? c - creditsNeeded : null));
      toast.success(`${creditsNeeded} credit(s) used for processing ${filesToProcess.length} images.`);

      for (const file of filesToProcess) {
        await processFile(file);
      }
    } catch (error: any) {
      showError(`An error occurred: ${error.message}`);
    } finally {
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
              <Button asChild>
                <Link to="/login">Login or Sign Up</Link>
              </Button>
            </div>
          ) : (
            <>
              <MultiImageUploader onFilesSelect={handleFilesSelect} disabled={isProcessing} />
              
              {!isQueueEmpty && (
                <div className="space-y-4">
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
                    {queue.map(file => (
                      <FileQueueItem key={file.id} {...file} />
                    ))}
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