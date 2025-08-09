import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface ComparisonSliderProps {
  original: string;
  modified: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ original, modified }) => {
  return (
    <div 
      className="rounded-md overflow-hidden border max-w-2xl mx-auto"
      style={{
        background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' size='16 16' fill-opacity='.1'%3e%3cpath d='M0 0h16v16H0zM16 16h16v16H16z'/%3e%3c/svg%3e")`
      }}
    >
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={original} alt="Original Image" />}
        itemTwo={<ReactCompareSliderImage src={modified} alt="Result" />}
        className="max-h-[500px]"
      />
    </div>
  );
};