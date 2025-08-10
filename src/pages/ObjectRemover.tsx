import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Download, Info } from 'lucide-react';
import { showError } from '@/utils/toast';
import { toast } from 'sonner';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { gsap } from 'gsap';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { MarkingCanvas } from '@/components/MarkingCanvas';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExampleImages } from '@/components/ExampleImages';

const ObjectRemover = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
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
        if (!error && data) setCredits(data.credits);
      };
      fetchCredits();
    }
  }, [user]);

  const handleFileSelect = (file: File) => {
    setOriginalImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setProcessedImage(null);
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

  const startProcessing = async () => {
    if (!originalImage) return false;
    if (!session) {
      showError("Please log in to process images.");
      return false;
    }

    setIsProcessing(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('process-feature-use', {
        body: { feature: 'object_remover' }
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
        setCredits(c => (c !== null ? c - 1 : null));
      } else if (data.status === 'free_use_logged') {
        toast.info(`Free use! You have ${data.remaining_free} free uses left today.`);
      }

      return true;

    } catch (e: any) {
      if (e.message !== "Usage check failed") {
        showError("An error occurred during processing.");
        console.error("Object removal failed:", e);
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = (dataUrl: string) => {
    setProcessedImage(dataUrl);
  };

  const handleDownload = () => {
    if (!processedImage) {
      showError("No processed image to download.");
      return;
    }
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'clearcut-object-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setOriginalImageUrl(null);
    setProcessedImage(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card ref={cardRef} className="max-w-4xl mx-auto bg-card/50 backdrop-blur-xl border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AI Object Remover</CardTitle>
          <CardDescription>
            Includes 3 free daily uses, then 1 credit per image. Erase unwanted objects, people, or text from your photos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session && (
            <div className="text-center space-y-4 p-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">You need to be logged in to use the Object Remover.</p>
              <Button asChild>
                <Link to="/login">Login or Sign Up</Link>
              </Button>
            </div>
          )}

          {session && !originalImage && (
            <>
              <ImageUploader onFileSelect={handleFileSelect} />
              <ExampleImages onSelect={handleExampleSelect} />
            </>
          )}

          {originalImageUrl && !processedImage && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You get 3 free uses per day across all tools. After that, each use costs 1 credit. Your credits: <strong>{credits ?? '...'}</strong>
                </AlertDescription>
              </Alert>
              <MarkingCanvas 
                imageSrc={originalImageUrl} 
                onComplete={handleComplete} 
                onProcessStart={startProcessing}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {originalImageUrl && processedImage && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-semibold">Object Removal Complete!</h3>
                <ComparisonSlider
                  original={<ReactCompareSliderImage src={originalImageUrl} alt="Original Image" />}
                  modified={<ReactCompareSliderImage src={processedImage} alt="Processed Image" />}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t">
                <Button onClick={handleDownload} size="lg" className="flex-1">
                  <Download className="mr-2 h-4 w-4" /> Download Image
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">Process Another</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ObjectRemover;