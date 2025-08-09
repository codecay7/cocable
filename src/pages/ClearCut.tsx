import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { Loader2 } from 'lucide-react';

const ClearCut = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setOriginalImage(file);
    setProcessedImage(null);
    setError(null);
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;

    setIsLoading(true);
    setError(null);

    // Simulate API call for background removal
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, you would upload the image and get back the result.
    // For this simulation, we'll just show the original image as the "processed" one.
    const reader = new FileReader();
    reader.onloadend = () => {
      setProcessedImage(reader.result as string);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to process image.');
      setIsLoading(false);
    }
    reader.readAsDataURL(originalImage);
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'clearcut-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">ClearCut AI Background Remover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!processedImage && (
            <div className="space-y-4">
              <ImageUploader onFileSelect={handleFileSelect} />
              {originalImage && (
                <div className="text-center p-4 border rounded-lg">
                  <img src={URL.createObjectURL(originalImage)} alt="Preview" className="max-h-60 mx-auto rounded-md" />
                  <p className="text-sm text-muted-foreground mt-2">{originalImage.name}</p>
                </div>
              )}
              <Button
                onClick={handleRemoveBackground}
                disabled={!originalImage || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Remove Background'
                )}
              </Button>
            </div>
          )}

          {processedImage && (
            <div className="space-y-4 text-center">
              <h3 className="text-xl font-semibold">Your Image is Ready!</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <h4 className="font-medium mb-2">Original</h4>
                  <img src={URL.createObjectURL(originalImage!)} alt="Original" className="max-h-80 mx-auto rounded-md border" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Background Removed</h4>
                  <img src={processedImage} alt="Background Removed" className="max-h-80 mx-auto rounded-md border bg-[url('data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2032%2032%27%20size=%2716%2016%27%20fill-opacity=%27.1%27%3e%3cpath%20d=%27M0%200h16v16H0zM16%2016h16v16H16z%27/%3e%3c/svg%3e')]" />
                </div>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <Button onClick={handleDownload} size="lg">Download Image</Button>
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