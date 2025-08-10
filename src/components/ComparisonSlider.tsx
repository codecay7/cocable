import React from 'react';
import { ReactCompareSlider } from 'react-compare-slider';

interface ComparisonSliderProps {
  original: React.ReactNode;
  modified: React.ReactNode;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ original, modified }) => {
  return (
    <div 
      className="rounded-md overflow-hidden border"
      style={{
        background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' size='16 16' fill-opacity='.1'%3e%3cpath d='M0 0h16v16H0zM16 16h16v16H16z'/%3e%3c/svg%3e")`
      }}
    >
      <ReactCompareSlider
        itemOne={original}
        itemTwo={modified}
        className="max-h-[500px]"
      />
    </div>
  );
};