import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Loader2, Share2, Wand2, Eye } from 'lucide-react';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { showError } from '@/utils/toast';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { gsap } from 'gsap';
import { EditPanel } from '@/components/EditPanel';
import { CanvasEditor } from '@/components/CanvasEditor';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ClearCut = () => {
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

  useEffect(() => {
    if (navigator.share) setIsShareSupported(true);
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
    }, cardRef);
    return () => ctx.revert();
  }, []);

  const handleFileSelect = (file: File) => {
    setOriginalImage(file);
    setProcessedImage(null);
    setError(null);
    setBackground('transparent');
    setIsShadowEnabled(false);
    setIsRefining(false);
    setShowCompare(false);
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;
    setIsLoading(true);
    setError(null);
    try {
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
      setProcessedImage(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error("Background removal failed:", e);
      setError("Sorry, we couldn't process this image. It might be an unsupported format or too complex for the AI.");
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
    link.download = 'clearcut-result.png';
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
        const file = new File([blob], 'clearcut-result.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Image edited with ClearCut AI' });
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
        className="w-full h-full flex items-center justify-center rounded-md overflow-hidden border"
        style={{ background }}
      >
        <img
          src={processedImage}
          alt="Result"
          className="max-w-full max-h-full"
          style={{
            filter: isShadowEnabled ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))' : 'none',
            transition: 'filter 0.3s ease-in-out',
            maxHeight: '500px'
          }}
        />
      </div>
    );

    if (showCompare) {
      return (
        <ComparisonSlider
          original={<ReactCompareSliderImage src={URL.createObjectURL(originalImage)} alt="Original Image" />}
          modified={
            <div className="w-full h-full" style={{ background }}>
              <ReactCompareSliderImage
                src={processedImage}
                alt="Result"
                style={{
                  filter: isShadowEnabled ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))' : 'none',
                }}
              />
            </div>
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
          <CardTitle className="text-2xl font-bold text-center">ClearCut AI Background Remover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!processedImage && (
            <div className="space-y-4">
              <ImageUploader onFileSelect={handleFileSelect} />
              {originalImage && (
                <div className="text-center p-4 border rounded-lg space-y-4">
                  <img src={URL.createObjectURL(originalImage)} alt="Preview" className="max-h-60 mx-auto rounded-md" />
                  <p className="text-sm text-muted-foreground mt-2">{originalImage.name}</p>
                  <div className="flex items-center justify-center space-x-2">
                    <Label htmlFor="quality-switch">Standard</Label>
                    <Switch
                      id="quality-switch"
                      checked={quality === 'landscape'}
                      onCheckedChange={(checked) => setQuality(checked ? 'landscape' : 'general')}
                    />
                    <Label htmlFor="quality-switch" className="font-semibold text-primary">High Quality</Label>
                  </div>
                </div>
              )}
              <Button onClick={handleRemoveBackground} disabled={!originalImage || isLoading} className="w-full" size="lg">
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
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => setIsRefining(true)} variant="secondary">
                      <Wand2 className="mr-2 h-4 w-4" /> Refine Manually
                    </Button>
                    <Button onClick={() => setShowCompare(s => !s)} variant="outline">
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
                  <Button onClick={handleDownload} size="lg" className="flex-1">Download Image</Button>
                  {isShareSupported && (
                    <Button onClick={handleShare} size="lg" variant="secondary" className="flex-1">
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  )}
                  <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">Process Another</Button>
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

export default ClearCut;