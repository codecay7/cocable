import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

export const Upscaler = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOriginalImage(URL.createObjectURL(file));
      setUpscaledImage(null); // Reset upscaled image on new file selection
    }
  };

  const handleUpscale = async () => {
    if (!selectedFile) {
      showError("Please select an image file first.");
      return;
    }

    setIsLoading(true);
    setUpscaledImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("realesrgan-upscaler", {
        body: selectedFile,
      });

      if (error) {
        throw error;
      }
      
      if (data instanceof Blob) {
        const imageUrl = URL.createObjectURL(data);
        setUpscaledImage(imageUrl);
        showSuccess("Image upscaled successfully!");
      } else {
        throw new Error("Unexpected response format from the server.");
      }

    } catch (err: any) {
        console.error("Upscaling failed:", err);
        const errorMessage = err.message || "An unknown error occurred during upscaling.";
        showError(`Upscaling failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">AI Image Upscaler</CardTitle>
          <CardDescription>Enhance your images with our Real-ESRGAN based upscaler.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="picture">Select Image</Label>
              <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
            </div>

            <Button onClick={handleUpscale} disabled={isLoading || !selectedFile}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upscaling...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upscale Image
                </>
              )}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Original Image</h3>
                <div className="aspect-square border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                  {originalImage ? (
                    <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
                  ) : (
                    <p className="text-muted-foreground">No image selected</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Upscaled Image</h3>
                <div className="aspect-square border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                  {isLoading ? (
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : upscaledImage ? (
                    <img src={upscaledImage} alt="Upscaled" className="w-full h-full object-contain" />
                  ) : (
                    <p className="text-muted-foreground">Result will appear here</p>
                  )}
                </div>
              </div>
            </div>
             {upscaledImage && !isLoading && (
                <a href={upscaledImage} download="upscaled-image.png">
                    <Button>Download Upscaled Image</Button>
                </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};