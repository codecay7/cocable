import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Loader2, Download, Palette } from 'lucide-react';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { gsap } from 'gsap';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExampleBWImages } from '@/components/ExampleBWImages';
import { saveCreation } from '@/utils/creations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fileToBase64 } from '@/utils/image';

const fetchCredits = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code === 'PGRST116') return 0;
  if (error) throw new Error(error.message);
  return data.credits;
};

const Colorizer = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    gsap.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
  }, []);

  const handleFileSelect = (file: File) => {
    setOriginalImage(file);
    setProcessedImage(null);
    setError(null);
  };

  const handleExampleSelect = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = url.split('/').pop() || 'example.jpg';
      const file = new File([blob], fileName, { type: blob.type });
      handleFileSelect(file);
    } catch (error) {
      showError("Could not load the example image.");
    }
  };

  const handleColorize = async () => {
    if (!originalImage) return;
    if (!session || !user) {
      showError("Please log in to colorize images.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const processToast = showLoading("Checking usage...");

    try {
      const { data, error: functionError } = await supabase.functions.invoke('process-feature-use', {
        body: { feature: 'ai_colorizer' }
      });

      if (functionError) {
        dismissToast(processToast);
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
      
      dismissToast(processToast);
      const colorizeToast = showLoading("AI is colorizing your image...");

      const imageBase64 = await fileToBase64(originalImage);
      const { data: colorizeData, error: colorizeError } = await supabase.functions.invoke('colorize-image', {
        body: { imageBase64 }
      });

      dismissToast(colorizeToast);

      if (colorizeError) throw colorizeError;

      setProcessedImage(colorizeData.colorizedImage);
      showSuccess("Image colorized successfully!");

      saveCreation(user.id, 'ai_colorizer', originalImage, colorizeData.colorizedImage).catch(err => {
        console.error("Failed to save creation in background", err);
      });

    } catch (e: any) {
      if (e.message !== "Usage check failed") {
        setError(e.message || "Sorry, we couldn't colorize this image.");
        showError(e.message || "Sorry, we couldn't colorize this image.");
        console.error("Colorization failed:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    const originalName = originalImage?.name.split('.').slice(0, -1).join('.') || 'colorized';
    link.download = `${originalName}-colorized.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card ref={cardRef} className="max-w-4xl mx-auto bg-card/50 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">AI Image Colorizer</CardTitle>
          <CardDescription className="text-center">
            Bring your black and white photos to life with realistic colors.
            <br />
            Includes 3 free daily uses, then 1 credit per image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!processedImage && (
            <div className="space-y-4">
              <ImageUploader onFileSelect={handleFileSelect} />
              <ExampleBWImages onSelect={handleExampleSelect} />
              {originalImage && (
                <div className="text-center p-4 border rounded-lg space-y-4">
                  <div className="w-full min-h-[40vh] flex items-center justify-center">
                    <img src={URL.createObjectURL(originalImage)} alt="Preview" className="max-h-[40vh] max-w-full mx-auto rounded-md object-contain" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{originalImage.name}</p>
                  {session && (
                    <Alert>
                      <AlertDescription>
                        You have <strong>{credits ?? '...'}</strong> credits remaining.
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
              <Button onClick={handleColorize} disabled={!originalImage || isLoading} className="w-full h-12" size="lg">
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>) : (<><Palette className="mr-2 h-4 w-4" /> Colorize Image</>)}
              </Button>
            </div>
          )}

          {processedImage && originalImage && (
            <div className="space-y-6">
              <ComparisonSlider
                original={<ReactCompareSliderImage src={URL.createObjectURL(originalImage)} alt="Original Black and White Image" />}
                modified={<ReactCompareSliderImage src={processedImage} alt="Colorized Image" />}
              />
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t">
                <Button onClick={handleDownload} size="lg" className="flex-1 h-12">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg" className="flex-1 h-12">
                  Colorize Another
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Colorizer;