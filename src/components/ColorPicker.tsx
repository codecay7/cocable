import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  onColorChange: (color: string) => void;
  selectedColor: string;
}

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#F1C40F'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ onColorChange, selectedColor }) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <Label htmlFor="color-picker" className="font-medium text-center block">Add a Background Color</Label>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${selectedColor.toUpperCase() === color ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
        <Input
          id="color-picker"
          type="color"
          value={selectedColor === 'transparent' ? '#FFFFFF' : selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-12 h-10 p-1 cursor-pointer"
        />
      </div>
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={() => onColorChange('transparent')}>
          Use Transparent Background
        </Button>
      </div>
    </div>
  );
};