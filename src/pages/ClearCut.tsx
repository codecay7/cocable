import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ColorPicker } from '@/components/ColorPicker';
import { Loader2, Share2 } from 'lucide-react';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { showError } from '@/utils/toast';
import { ComparisonSlider } from '@/components/ComparisonSlider';

const ClearCut = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null); // Holds the image with transparent BG
  const [displayImage, setDisplayImage] = useState<string | null>(null); // Holds the image to be displayed/downloaded
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    if (navigator.share) setIsShareSupported(true);
  }, []);

  const applyBackgroundColor = useCallback(async (imageSrc: string, color: string) => {
    if (color === 'transparent') {
      return imageSrc;
    }

    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageSrc;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    return canvas.toDataURL('image/png');
  }, []);

  useEffect(() => {
    if (!processedImage) return;

    const updateDisplayImage = async () => {
      const newDisplayImage = await applyBackgroundColor(processedImage, backgroundColor);
      setDisplayImage(newDisplayImage);
    };

    updateDisplayImage();
  }, [processedImage, backgroundColor, applyBackgroundColor]);

  const handleFileSelect = (file: File) => {
    setOriginalImage(file);
    setProcessedImage(null);
    setDisplayImage(null);
    setError(null);
    setBackgroundColor('transparent');
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;
    setIsLoading(true);
    setError(null);

    try {
      const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
      const segmenter = await bodySegmentation.createSegmenter(model, { runtime: 'tfjs' });
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

  const handleDownload = () => {
    if (!displayImage) return;
    const link = document.createElement('a');
    link.href = displayImage;
    link.download = 'clearcut-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!displayImage) return;
    try {
      const response = await fetch(displayImage);
      const blob = await response.blob();
      const file = new File([blob], 'clearcut-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Image with Background Removed',
          text: 'Check out this image I edited with ClearCut AI!',
        });
      } else {
        showError("Your browser doesn't support sharing files.");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showError('Sharing failed. Please try downloading the image instead.');
      }
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setDisplayImage(null);
    setError(null);
    setBackgroundColor('transparent');
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">ClearCut AI Background Remover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!displayImage && (
            <div className="space-y-4">
              <ImageUploader onFileSelect={handleFileSelect} />
              {originalImage && (
                <div className="text-center p-4 border rounded-lg">
                  <img src={URL.createObjectURL(originalImage)} alt="Preview" className="max-h-60 mx-auto rounded-md" />
                  <p className="text-sm text-muted-foreground mt-2">{originalImage.name}</p>
                </div>
              )}
              <Button onClick={handleRemoveBackground} disabled={!originalImage || isLoading} className="w-full" size="lg">
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing with AI...</>) : ('Remove Background')}
              </Button>
            </div>
          )}

          {displayImage && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-semibold">Your Image is Ready!</h3>
                <ComparisonSlider
                  original={URL.createObjectURL(originalImage!)}
                  modified={displayImage}
                />
              </div>
              
              <ColorPicker onColorChange={setBackgroundColor} selectedColor={backgroundColor} />

              <div className="flex flex-wrap justify-center gap-4 pt-4 border-t">
                <Button onClick={handleDownload} size="lg">Download Image</Button>
                {isShareSupported && (
                  <Button onClick={handleShare} size="lg" variant="secondary">
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" size="lg">Process Another Image</Button>
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClearCut;