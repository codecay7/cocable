import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarUploaderProps {
  src?: string;
  fallback: string;
  onFileSelect: (file: File) => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ src, fallback, onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-20 w-20">
        <AvatarImage src={src} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div>
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        <Button type="button" variant="outline" onClick={handleButtonClick}>
          Change Picture
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          PNG, JPG, or WEBP. 1:1 ratio recommended.
        </p>
      </div>
    </div>
  );
};