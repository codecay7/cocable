import React from 'react';
import { Card } from '@/components/ui/card';

interface ExampleImagesProps {
  onSelect: (url: string) => void;
}

const exampleUrls = [
  'https://picsum.photos/seed/woman/800/800',
  'https://picsum.photos/seed/product/800/800',
  'https://picsum.photos/seed/dog/800/800',
  'https://picsum.photos/seed/car/800/800',
];

export const ExampleImages: React.FC<ExampleImagesProps> = ({ onSelect }) => {
  return (
    <div className="space-y-4 pt-4">
      <p className="text-center text-sm text-muted-foreground">
        No image? Try one of these examples:
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {exampleUrls.map((url, index) => (
          <Card
            key={index}
            onClick={() => onSelect(url)}
            className="cursor-pointer overflow-hidden transition-transform hover:scale-105 hover:shadow-md"
          >
            <img src={url} alt={`Example ${index + 1}`} className="aspect-square w-full h-full object-cover" />
          </Card>
        ))}
      </div>
    </div>
  );
};