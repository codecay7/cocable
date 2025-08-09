import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Download } from 'lucide-react';
import { showError } from '@/utils/toast';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { gsap } from 'gsap';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { MarkingCanvas } from '@/components/MarkingCanvas';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const ObjectRemover = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const cardRef = useRef(null);
  const { session } = useSession();

  useEffect(() => {
    gsap.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!session) {
      showError("Please log in to use this feature.");
      return;
    }

    setIsCheckingUsage(true);
    try {
      const { error: functionError } = await supabase.functions.invoke('check-free-usage', {
        body: { feature: 'free_object_remover' }
      });
      if (functionError) {
        showError(functionError.message);
        return;
      }
      setOriginalImage(file);
      setOriginalImageUrl(URL.createObjectURL(file));
      setProcessedImage(null);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsCheckingUsage(false);
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
          <CardDescription>Erase unwanted objects, people, or text from your photos in seconds.</CardDescription>
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

          {session && !originalImage && <ImageUploader onFileSelect={handleFileSelect} disabled={isCheckingUsage} />}

          {originalImageUrl && !processedImage && (
            <MarkingCanvas imageSrc={originalImageUrl} onComplete={handleComplete} />
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