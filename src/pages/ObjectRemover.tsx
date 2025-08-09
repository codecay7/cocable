import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Loader2, Eraser, Download, RotateCcw, Undo, Redo } from 'lucide-react';
import { showError } from '@/utils/toast';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { gsap } from 'gsap';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { MarkingCanvas, MarkingCanvasRef } from '@/components/MarkingCanvas';

const ObjectRemover = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(40);
  const cardRef = useRef(null);
  const markingCanvasRef = useRef<MarkingCanvasRef>(null);

  useEffect(() => {
    gsap.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
  }, []);

  const handleFileSelect = (file: File) => {
    setOriginalImage(file);
    setProcessedImage(null);
    setError(null);
    setMaskCanvas(null);
  };

  const handleRemoveObject = async () => {
    if (!originalImage || !maskCanvas || isMaskEmpty()) {
      showError("Please upload an image and mark the object to remove.");
      return;
    }
    setIsLoading(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing

    try {
      const imageElement = new Image();
      imageElement.src = URL.createObjectURL(originalImage);
      await imageElement.decode();

      const resultCanvas = document.createElement('canvas');
      const resultCtx = resultCanvas.getContext('2d');
      if (!resultCtx) throw new Error('Could not get result canvas context');
      
      const tempMask = document.createElement('canvas');
      const tempMaskCtx = tempMask.getContext('2d');
      if (!tempMaskCtx) throw new Error('Could not get temp mask context');

      resultCanvas.width = tempMask.width = imageElement.width;
      resultCanvas.height = tempMask.height = imageElement.height;

      tempMaskCtx.drawImage(maskCanvas, 0, 0, imageElement.width, imageElement.height);
      const maskData = tempMaskCtx.getImageData(0, 0, imageElement.width, imageElement.height);

      resultCtx.drawImage(imageElement, 0, 0);

      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = imageElement.width;
      blurCanvas.height = imageElement.height;
      const blurCtx = blurCanvas.getContext('2d');
      if (!blurCtx) throw new Error('Could not get blur context');
      blurCtx.filter = 'blur(15px)';
      blurCtx.drawImage(imageElement, 0, 0);

      resultCtx.save();
      resultCtx.beginPath();
      for (let y = 0; y < maskData.height; y++) {
        for (let x = 0; x < maskData.width; x++) {
          const alpha = maskData.data[(y * maskData.width + x) * 4 + 3];
          if (alpha > 0) {
            resultCtx.rect(x, y, 1, 1);
          }
        }
      }
      resultCtx.clip();
      resultCtx.drawImage(blurCanvas, 0, 0);
      resultCtx.restore();

      setProcessedImage(resultCanvas.toDataURL('image/png'));
    } catch (e) {
      console.error("Object removal failed:", e);
      setError("Sorry, we couldn't process this image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'clearcut-object-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setMaskCanvas(null);
  };

  const handleClearMask = () => markingCanvasRef.current?.clear();
  const handleUndo = () => markingCanvasRef.current?.undo();
  const handleRedo = () => markingCanvasRef.current?.redo();

  const isMaskEmpty = () => {
    if (!maskCanvas) return true;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return true;
    const pixelBuffer = new Uint32Array(
      ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card ref={cardRef} className="max-w-4xl mx-auto bg-card/50 backdrop-blur-xl border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AI Object Remover</CardTitle>
          <CardDescription>Erase unwanted objects, people, or text from your images in seconds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!originalImage && <ImageUploader onFileSelect={handleFileSelect} />}

          {originalImage && !processedImage && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <div className="flex items-center gap-4">
                  <Eraser className="w-5 h-5" />
                  <Label htmlFor="brush-size" className="flex-shrink-0">Brush Size</Label>
                  <Slider
                    id="brush-size"
                    min={10}
                    max={100}
                    step={1}
                    value={[brushSize]}
                    onValueChange={(value) => setBrushSize(value[0])}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleUndo} variant="outline" size="sm" disabled={!markingCanvasRef.current?.canUndo}>
                    <Undo className="w-4 h-4 mr-2" /> Undo
                  </Button>
                  <Button onClick={handleRedo} variant="outline" size="sm" disabled={!markingCanvasRef.current?.canRedo}>
                    <Redo className="w-4 h-4 mr-2" /> Redo
                  </Button>
                  <Button onClick={handleClearMask} variant="outline" size="sm" className="ml-auto">
                    <RotateCcw className="w-4 h-4 mr-2" /> Clear Mask
                  </Button>
                </div>
              </div>
              <MarkingCanvas
                ref={markingCanvasRef}
                key={originalImage.name}
                imageSrc={URL.createObjectURL(originalImage)}
                brushSize={brushSize}
                onDrawEnd={setMaskCanvas}
              />
              <Button onClick={handleRemoveObject} disabled={isLoading || isMaskEmpty()} className="w-full" size="lg">
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing Object...</>) : (<><Eraser className="mr-2 h-4 w-4" /> Remove Object</>)}
              </Button>
            </div>
          )}

          {processedImage && originalImage && (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-semibold">Object Removed!</h3>
                <ComparisonSlider
                  original={<ReactCompareSliderImage src={URL.createObjectURL(originalImage)} alt="Original Image" />}
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

          {error && <p className="text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ObjectRemover;