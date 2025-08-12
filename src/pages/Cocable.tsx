import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Loader2, Share2, Wand2, Eye, Info } from 'lucide-react';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { showError, showLoading, dismissToast } from '@/utils/toast';
import { toast } from 'sonner';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { gsap } from 'gsap';
import { EditPanel } from '@/components/EditPanel';
import { CanvasEditor } from '@/components/CanvasEditor';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { Label } from '@/components/ui/label';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExampleImages } from '@/components/ExampleImages';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { saveCreation } from '@/utils/creations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { resizeImage } from '@/utils/image';

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

const Cocable = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [background, setBackground] = useState<string>('transparent');
  const [isShadowEnabled, setIsShadowEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [quality, setQuality] = useState<'general' | 'landscape'>('general');
  const [isRefining, setIsRefining] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const cardRef = useRef(null);
  const { session, user } = useSession();
  const { openModal } = usePurchaseModal();
  const queryClient = useQueryClient();

  const { data: credits } = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: () => fetchCredits(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (navigator.share) setIsShareSupported(true);
    gsap.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
  }, []);

  const handleFileSelect = async (file: File) => {
    const toastId = showLoading("Preparing image...");
    try {
      // Resize image to a max dimension of 1920px for performance
      const resizedFile = await resizeImage(file, 1920);
      
      setOriginalImage(resizedFile);
      setProcessedImage(null);
      setError(null);
      setBackground('transparent');
      setIsShadowEnabled(false);
      setIsRefining(false);
      setShowCompare(false);
      dismissToast(toastId);
    } catch (error) {
      dismissToast(toastId);
      showError("Could not process this image file. Please try another one.");
      console.error("Image resizing failed:", error);
    }
  };

  const handleExampleSelect = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = url.split('/').pop() || 'example.svg';
      const file = new File([blob], fileName, { type: blob.type });
      await handleFileSelect(file);
    } catch (error) {
      showError("Could not load the example image.");
      console.error("Failed to fetch example image:", error);
    }
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;
    if (!session || !user) {
      showError("Please log in to process images.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('process-feature-use', {
        body: { feature: `clearcut_${quality}` }
      });

      if (functionError) {
        if (functionError.message.includes('Insufficient credits')) {
          showError("Your daily free uses are over. You need credits to continue.");
          openModal();
        } else {
          showError(functionError.message || "An error occurred checking your usage.");
        }
        throw new Error("Usage check failed");
      }

      if (data.status === 'paid_use_logged') {
        toast.success("1 credit used.");
        await queryClient.invalidateQueries({ queryKey: ['credits', user.id] });
      } else if (data.status === 'free_use_logged') {
        toast.info(`Free use! You have ${data.remaining_free} free uses left today.`);
      }

      const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
      const segmenter = await bodySegmentation.createSegmenter(model, { runtime: 'tfjs', modelType: quality });
      const imageElement = new Image();
      imageElement.src = URL.createObjectURL(originalImage);
      await imageElement.decode();
      const segmentation = await segmenter.segmentPeople(imageElement);
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(imageElement, 0, 0);
      const foreground = { r: 0, g: 0, b: 0, a: 255 };
      const backgroundMask = { r: 0, g: 0, b: 0, a: 0 };
      const binaryMask = await bodySegmentation.toBinaryMask(segmentation, foreground, backgroundMask);
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = imageElement.width;
      maskCanvas.height = imageElement.height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error('Could not get mask canvas context');
      maskCtx.putImageData(binaryMask, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);
      const processedDataUrl = canvas.toDataURL('image/png');
      setProcessedImage(processedDataUrl);

      saveCreation(user.id, 'background_remover', originalImage, processedDataUrl).catch(err => {
        console.error("Failed to save creation in background", err);
      });

    } catch (e: any) {
      if (e.message !== "Usage check failed") {
        setError("Sorry, we couldn't process this image. It might be an unsupported format or too complex for the AI.");
        console.error("Background removal failed:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateFinalCanvas = useCallback(async () => {
    if (!processedImage) return null;
    return new Promise<HTMLCanvasElement | null>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
  
        const PADDING = isShadowEnabled ? 30 : 0;
        canvas.width = image.width + PADDING * 2;
        canvas.height = image.height + PADDING * 2;
  
        if (background !== 'transparent' && !background.includes('gradient')) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
  
        if (isShadowEnabled) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 10;
        }
  
        ctx.drawImage(image, PADDING, PADDING);
        resolve(canvas);
      };
      image.onerror = () => resolve(null);
      image.src = processedImage;
    });
  }, [processedImage, background, isShadowEnabled]);

  const handleDownload = async () => {
    const canvas = await generateFinalCanvas();
    if (!canvas) {
      showError("Could not generate image for download.");
      return;
    }
    const imageHref = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageHref;
    link.download = 'cocable-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    const canvas = await generateFinalCanvas();
    if (!canvas) {
      showError("Could not generate image for sharing.");
      return;
    }
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showError("Could not generate image for sharing.");
        return;
      }
      try {
        const file = new File([blob], 'cocable-result.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Image edited with Cocable AI' });
        } else {
          showError("Your browser doesn't support sharing files.");
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          showError('Sharing failed. Please try downloading instead.');
        }
      }
    }, 'image/png');
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setBackground('transparent');
    setIsShadowEnabled(false);
    setIsRefining(false);
    setShowCompare(false);
  };

  const ResultDisplay = () => {
    if (!processedImage || !originalImage) return null;

    const finalImage = (
      <div 
        className="w-full min-h-[40vh] flex items-center justify-center rounded-md overflow-hidden border"
        style={{ background }}
      >
        <img
          src={processedImage}
          alt="Result"
          className="max-w-full max-h-[40vh] object-contain"
          style={{
            filter: isShadowEnabled ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))' : 'none',
            transition: 'filter 0.3s ease-in-out',
          }}
        />
      </div>
    );

    if (showCompare) {
      return (
        <ComparisonSlider
          original={<ReactCompareSliderImage src={URL.createObjectURL(originalImage)} alt="Original Image" />}
          modified={
            <ReactCompareSliderImage
              src={processedImage}
              alt="Result"
              style={{
                filter: isShadowEnabled ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))' : 'none',
              }}
            />
          }
        />
      );
    }
    return finalImage;
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card ref={cardRef} className="max-w-4xl mx-auto bg-card/50 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cocable AI Background Remover</CardTitle>
          <CardDescription className="text-center">
            This tool uses a model optimized for people. For best results with objects or complex scenes, use High Quality mode.
            <br />
            Includes 3 free daily uses, then 1 credit per image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!processedImage && (
            <div className="space-y-4">
              <ImageUploader onFileSelect={handleFileSelect} />
              <ExampleImages onSelect={handleExampleSelect} />
              {originalImage && (
                <div className="text-center p-4 border rounded-lg space-y-4">
                  <div className="w-full min-h-[40vh] flex items-center justify-center">
                    <img src={URL.createObjectURL(originalImage)} alt="Preview" className="max-h-[40vh] max-w-full mx-auto rounded-md object-contain" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{originalImage.name}</p>
                  <RadioGroup defaultValue="general" onValueChange={(value: 'general' | 'landscape') => setQuality(value)} className="flex items-center justify-center space-x-6 pt-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="general" id="q-general" />
                      <Label htmlFor="q-general" className="cursor-pointer">
                        <p className="font-semibold">Standard</p>
                        <p className="text-xs text-muted-foreground">Fastest, best for people</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="landscape" id="q-landscape" />
                      <Label htmlFor="q-landscape" className="cursor-pointer">
                        <p className="font-semibold">High Quality</p>
                        <p className="text-xs text-muted-foreground">Better for objects & scenes</p>
                      </Label>
                    </div>
                  </RadioGroup>
                  {session && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        You get 3 free uses per day across all tools. After that, each use costs 1 credit. Your credits: <strong>{credits ?? '...'}</strong>
                      </AlertDescription>
                    </Alert>
                  )}
                  {!session && (
                    <Button asChild variant="link">
                      <Link to="/login">Log in to process images</Link>
                    </Button>
                  )}
                </div>
              )}
              <Button onClick={handleRemoveBackground} disabled={!originalImage || isLoading} className="w-full h-12" size="lg">
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing with AI...</>) : ('Remove Background')}
              </Button>
            </div>
          )}

          {processedImage && (
            isRefining ? (
              <CanvasEditor 
                imageSrc={processedImage}
                onSave={(dataUrl) => {
                  setProcessedImage(dataUrl);
                  setIsRefining(false);
                }}
                onCancel={() => setIsRefining(false)}
              />
            ) : (
              <div className="space-y-6">
                <div className="space-y-4 text-center">
                  <h3 className="text-xl font-semibold">Your Image is Ready!</h3>
                  <ResultDisplay />
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2 w-full">
                    <Button onClick={() => setIsRefining(true)} variant="secondary" className="w-full sm:w-auto">
                      <Wand2 className="mr-2 h-4 w-4" /> Refine Manually
                    </Button>
                    <Button onClick={() => setShowCompare(s => !s)} variant="outline" className="w-full sm:w-auto">
                      <Eye className="mr-2 h-4 w-4" /> {showCompare ? 'Hide' : 'Show'} Compare
                    </Button>
                  </div>
                </div>
                
                <EditPanel 
                  onBgChange={setBackground}
                  selectedBg={background}
                  onShadowChange={setIsShadowEnabled}
                  isShadowEnabled={isShadowEnabled}
                />

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t">
                  <Button onClick={handleDownload} size="lg" className="flex-1 h-12">Download Image</Button>
                  {isShareSupported && (
                    <Button onClick={handleShare} size="lg" variant="secondary" className="flex-1 h-12">
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  )}
                  <Button onClick={handleReset} variant="outline" size="lg" className="flex-1 h-12">Process Another</Button>
                </div>
              </div>
            )
          )}

          {error && <p className="text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Cocable;