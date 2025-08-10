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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

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
    if (!session) {
      showError("Please log in to process images.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, check usage and deduct credits
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
        toast.success("1 credit used.");
        setCredits(c => (c !== null ? c - 1 : null));
      } else if (usageData.status === 'free_use_logged') {
        toast.info(`Free use! You have ${usageData.remaining_free} free uses left today.`);
      }
      
      // If usage check is successful, proceed with upscaling
      const imageBase64 = await fileToBase64(originalImage);
      const { data: upscaleData, error: upscaleError } = await supabase.functions.invoke('realesrgan-upscaler', {
        body: { imageBase64, scaleFactor }
      });

      if (upscaleError) throw upscaleError;

      setUpscaledImage(upscaleData.upscaledImage);

    } catch (e: any) {
      if (e.message !== "Usage check failed") {
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