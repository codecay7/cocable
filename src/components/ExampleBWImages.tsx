import React from 'react';
import { Card } from '@/components/ui/card';

interface ExampleImagesProps {
  onSelect: (url: string) => void;
}

const exampleUrls = [
  'https://images.pexels.com/photos/3785424/pexels-photo-3785424.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1&grayscale',
  'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1&grayscale',
  'https://images.pexels.com/photos/2128817/pexels-photo-2128817.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1&grayscale',
  'https://images.pexels.com/photos/157863/person-people-woman-girl-157863.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1&grayscale',
];

export const ExampleBWImages: React.FC<ExampleImagesProps> = ({ onSelect }) => {
  return (
    <div className="space-y-4 pt-4">
      <p className="text-center text-sm text-muted-foreground">
        No image? Try one of these B&W examples:
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