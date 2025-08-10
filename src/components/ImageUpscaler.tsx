import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';

export const ImageUpscaler = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setOriginalImage(URL.createObjectURL(file));
      setUpscaledImage(null);
    }
  };

  const handleUpscale = async () => {
    if (!selectedFile) {
      showError('Please select an image first.');
      return;
    }

    setIsLoading(true);
    const toastId = showLoading('Upscaling your image...');

    try {
      // 1. Upload original image to Supabase Storage
      const filePath = `original/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error(`Storage Error: ${uploadError.message}`);
      }

      // 2. Get public URL of the uploaded image
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // 3. Call the edge function
      const { data, error: functionError } = await supabase.functions.invoke('upscale-image', {
        body: { imageUrl },
      });

      if (functionError) {
        throw new Error(`Function Error: ${functionError.message}`);
      }
      
      if (data.error) {
        throw new Error(`Upscale Error: ${data.error}`);
      }

      setUpscaledImage(data.url);
      dismissToast(toastId);
      showSuccess('Image upscaled successfully!');
    } catch (error) {
      console.error(error);
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Image Upscaler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-md">
              <label htmlFor="file-upload" className="cursor-pointer w-full">
                <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                  <Upload className="w-5 h-5 mr-2" />
                  <span>{selectedFile ? selectedFile.name : 'Click to upload an image'}</span>
                </div>
              </label>
              <Input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            <Button onClick={handleUpscale} disabled={!selectedFile || isLoading}>
              {isLoading ? 'Upscaling...' : 'Upscale Image'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-2">Original Image</h3>
              <div className="w-full h-64 bg-gray-100 rounded-md flex items-center justify-center">
                {originalImage ? (
                  <img src={originalImage} alt="Original" className="max-w-full max-h-full object-contain rounded-md" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-2">Upscaled Image</h3>
              <div className="w-full h-64 bg-gray-100 rounded-md flex items-center justify-center">
                {isLoading ? (
                  <div className="animate-pulse">
                    <Sparkles className="w-16 h-16 text-primary" />
                  </div>
                ) : upscaledImage ? (
                  <img src={upscaledImage} alt="Upscaled" className="max-w-full max-h-full object-contain rounded-md" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                )}
              </div>
              {upscaledImage && !isLoading && (
                <Button asChild variant="outline" className="mt-4">
                  <a href={upscaledImage} download target="_blank" rel="noopener noreferrer">
                    Download Upscaled Image
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};