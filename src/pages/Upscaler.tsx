import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Loader2, Download, Sparkles, CreditCard } from 'lucide-react';
import { showError } from '@/utils/toast';
import { toast } from 'sonner';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { gsap } from 'gsap';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { usePurchaseModal } from '@/contexts/PurchaseModalContext';

const Upscaler = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(2);
  const [faceCorrect, setFaceCorrect] = useState<boolean>(false);
  const [credits, setCredits] = useState<number | null>(null);
  const cardRef = useRef(null);
  const { session, user } = useSession();
  const { openModal } = usePurchaseModal();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
    }, cardRef);
    return () => ctx.revert();
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

  const handleFileSelect = (file: File) => {
    setOriginalImage(file);
    setUpscaledImage(null);
    setError(null);
  };

  const handleUpscale = async () => {
    if (!originalImage) return;

    const isPremium = faceCorrect;

    if (!session) {
      showError("Please log in to process images.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isPremium) {
        if (credits === null || credits < 1) {
          throw new Error("Insufficient credits");
        }
        const { error: functionError } = await supabase.functions.invoke('deduct-credit', {
          body: { feature: 'face_correction' }
        });
        if (functionError) throw functionError;
        setCredits(c => (c !== null ? c - 1 : null));
        toast.success("1 credit used for Face Correction.", {
          action: (
            <Button onClick={openModal} variant="secondary" size="sm">
              Get More Credits
            </Button>
          ),
        });
      } else {
        const { error: functionError } = await supabase.functions.invoke('check-free-usage', {
          body: { feature: 'free_upscale' }
        });
        if (functionError) throw functionError;
      }
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const imageElement = new Image();
      imageElement.src = URL.createObjectURL(originalImage);
      await imageElement.decode();

      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width * scaleFactor;
      canvas.height = imageElement.height * scaleFactor;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (faceCorrect) {
        ctx.filter = 'contrast(1.1) brightness(1.05)';
      }
      
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      
      setUpscaledImage(canvas.toDataURL('image/png'));
    } catch (e: any) {
      if (e.message.includes('Daily premium feature limit reached')) {
        showError("You've reached your daily limit of 3 premium features.");
      } else if (e.message.includes('Insufficient credits')) {
        showError("You don't have enough credits for this premium feature.");
        openModal();
      } else if (e.message.includes('daily limit')) {
        showError(e.message);
      } else {
        setError("Sorry, we couldn't process this image.");
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
    link.download = `clearcut-upscaled-${scaleFactor}x.png`;
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
          <CardTitle className="text-2xl font-bold">AI Image Upscaler</CardTitle>
          <CardDescription>Increase image resolution by 2x or 4x without losing quality.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!upscaledImage && (
            <div className="space-y-4">
              <ImageUploader onFileSelect={handleFileSelect} />
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
                    <div className="flex items-center space-x-2">
                      <Switch id="face-correct" checked={faceCorrect} onCheckedChange={setFaceCorrect} />
                      <Label htmlFor="face-correct" className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-yellow-400" /> Face Correction</span>
                        <Badge variant="secondary" className="text-yellow-500 border-yellow-500/50">Premium</Badge>
                      </Label>
                    </div>
                  </div>
                   {session && faceCorrect && (
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>{credits ?? '...'} credits remaining. This will use 1 credit.</span>
                    </div>
                  )}
                  {!session && (
                    <Button asChild variant="link">
                      <Link to="/login">Log in to process images</Link>
                    </Button>
                  )}
                </div>
              )}
              <Button onClick={handleUpscale} disabled={!originalImage || isLoading} className="w-full" size="lg">
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Upscaling with AI...</>) : ('Upscale Image')}
              </Button>
            </div>
          )}

          {upscaledImage && originalImage && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-semibold">Upscaling Complete!</h3>
                <ComparisonSlider
                  original={<ReactCompareSliderImage src={URL.createObjectURL(originalImage)} alt="Original Image" />}
                  modified={<ReactCompareSliderImage src={upscaledImage} alt="Upscaled Image" />}
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