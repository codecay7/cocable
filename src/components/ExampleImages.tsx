import React from 'react';
import { Card } from '@/components/ui/card';

interface ExampleImagesProps {
  onSelect: (url: string) => void;
}

const exampleUrls = [
  'https://images.pexels.com/photos/3772510/pexels-photo-3772510.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1',
  'https://images.pexels.com/photos/1050244/pexels-photo-1050244.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1',
  'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1',
  'https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1',
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