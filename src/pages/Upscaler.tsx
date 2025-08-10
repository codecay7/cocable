import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Loader2, Download, Sparkles, Info } from 'lucide-react';
import { showError } from '@/utils/toast';
import { toast } from 'sonner';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { gsap } from 'gsap';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExampleImages } from '@/components/ExampleImages';
import { generateFileHash, base64ToBlob, fileToBase64, resizeImage } from '@/utils/image';

const Upscaler = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(2);
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
        if (!error && data) setCredits(data.credits);
      };
      fetchCredits();
    }
  }, [user]);

  const handleFileSelect = (file: File) => {
    setOriginalImage(file);
    setUpscaledImage(null);
    setError(null);
  };

  const handleExampleSelect = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = url.split('/').pop() || 'example.svg';
      const file = new File([blob], fileName, { type: blob.type });
      handleFileSelect(file);
    } catch (error) {
      showError("Could not load the example image.");
      console.error("Failed to fetch example image:", error);
    }
  };

  const handleUpscale = async () => {
    if (!originalImage) return;
    if (!session || !user) {
      showError("Please log in to process images.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const loadingToastId = toast.loading("Preparing your image...");

    try {
      // Pre-scaling logic
      let imageToProcess = originalImage;
      const MAX_DIMENSION = 2048;
      const img = new Image();
      const objectUrl = URL.createObjectURL(originalImage);
      img.src = objectUrl;
      await new Promise(resolve => { img.onload = resolve });
      URL.revokeObjectURL(objectUrl);

      if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        toast.info("Image is very large. Pre-scaling for compatibility...", { id: loadingToastId });
        imageToProcess = await resizeImage(originalImage, MAX_DIMENSION);
      }

      // 1. Generate hash for caching
      toast.info("Generating unique image signature...", { id: loadingToastId });
      const hash = await generateFileHash(imageToProcess);
      const cachePath = `${hash}_${scaleFactor}x.png`;

      // 2. Check for cached result
      toast.info("Checking for a cached version...", { id: loadingToastId });
      const { data: cachedData, error: cacheError } = await supabase.storage
        .from('upscaler_cache')
        .download(cachePath);

      if (cacheError && cacheError.message !== 'The resource was not found') {
        console.warn("Cache check failed with an unexpected error. This might be a permissions issue with the storage bucket.", cacheError);
      }

      if (cachedData) {
        toast.success("Found a cached result! ✨", { id: loadingToastId });
        setUpscaledImage(URL.createObjectURL(cachedData));
        setIsLoading(false);
        return;
      }

      // 3. If not cached, proceed with processing
      toast.info("No cache found. Checking usage credits...", { id: loadingToastId });
      const { data: usageData, error: functionError } = await supabase.functions.invoke('process-feature-use', {
        body: { feature: `realesrgan_upscaler_${scaleFactor}x` }
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

      if (usageData.status === 'paid_use_logged') {
        toast.success("1 credit used.", { id: loadingToastId });
        setCredits(c => (c !== null ? c - 1 : null));
      } else if (usageData.status === 'free_use_logged') {
        toast.info(`Free use! You have ${usageData.remaining_free} free uses left today.`, { id: loadingToastId });
      }
      
      // 4. Call the upscaler function
      toast.info("Sending to the AI upscaler... This may take a moment.", { id: loadingToastId });
      const imageBase64 = await fileToBase64(imageToProcess);
      const { data: upscaleData, error: upscaleError } = await supabase.functions.invoke('realesrgan-upscaler', {
        body: { imageBase64, scaleFactor }
      });

      if (upscaleError) throw upscaleError;

      const upscaledBase64 = upscaleData.upscaledImage;
      setUpscaledImage(upscaledBase64);

      // 5. Upload the new result to the cache
      toast.info("Saving result to cache for next time...", { id: loadingToastId });
      const blobToCache = await base64ToBlob(upscaledBase64);
      const { error: uploadError } = await supabase.storage
        .from('upscaler_cache')
        .upload(cachePath, blobToCache, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: true,
        });
      
      if (uploadError) {
        console.error("Failed to cache the result:", uploadError.message);
        toast.warning("Could not save to cache. Future uses of this image may use credits.", { id: loadingToastId });
      } else {
        toast.success("Upscaling complete! Result is cached.", { id: loadingToastId });
      }

    } catch (e: any) {
      if (e.message !== "Usage check failed") {
        toast.dismiss(loadingToastId);
        setError("Sorry, we couldn't process this image. The external service may be busy or the image format is not supported. Please try again in a moment.");
        console.error("Upscaling failed:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!upscaledImage) {
      showError("No upscaled image to download.");
      return;
    }
    const link = document.createElement('a');
    link.href = upscaledImage;
    link.download = `clearcut-realesrgan-upscaled-${scaleFactor}x.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setUpscaledImage(null);
    setError(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card ref={cardRef} className="max-w-4xl mx-auto bg-card/50 backdrop-blur-xl border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2"><Sparkles className="text-primary" /> Real-ESRGAN Image Upscaler</CardTitle>
          <CardDescription>
            Powered by a state-of-the-art AI model for incredible detail. Includes 3 free daily uses, then 1 credit per image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!upscaledImage && (
            <div className="space-y-4">
              <ImageUploader onFileSelect={handleFileSelect} />
              <ExampleImages onSelect={handleExampleSelect} />
              {originalImage && (
                <div className="text-center p-4 border rounded-lg space-y-4">
                  <img src={URL.createObjectURL(originalImage)} alt="Preview" className="max-h-60 mx-auto rounded-md" />
                  <p className="text-sm text-muted-foreground mt-2">{originalImage.name}</p>
                  <div className="flex justify-center items-center gap-6 flex-wrap">
                    <RadioGroup defaultValue="2" onValueChange={(value) => setScaleFactor(parseInt(value))} className="flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="r1" />
                        <Label htmlFor="r1">2x Upscale</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="4" id="r2" />
                        <Label htmlFor="r2">4x Upscale</Label>
                      </div>
                    </RadioGroup>
                  </div>
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
              <Button onClick={handleUpscale} disabled={!originalImage || isLoading} className="w-full" size="lg">
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Upscaling with Real-ESRGAN...</>) : ('Upscale Image')}
              </Button>
            </div>
          )}

          {upscaledImage && originalImage && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-semibold">Upscaling Complete!</h3>
                <ComparisonSlider
                  original={<ReactCompareSliderImage src={URL.createObjectURL(originalImage)} alt="Original Image" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  modified={<ReactCompareSliderImage src={upscaledImage} alt="Upscaled Image" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t">
                <Button onClick={handleDownload} size="lg" className="flex-1">
                  <Download className="mr-2 h-4 w-4" /> Download Upscaled Image
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">Process Another</Button>
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Upscaler;