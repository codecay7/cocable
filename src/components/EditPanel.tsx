import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from './ColorPicker';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Paintbrush, Sparkles, ImageIcon } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface EditPanelProps {
  onBgChange: (bg: string) => void;
  selectedBg: string;
  onShadowChange: (enabled: boolean) => void;
  isShadowEnabled: boolean;
}

const PRESET_GRADIENTS = [
  'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(to top, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(-225deg, #2CD8D5 0%, #C5C1FF 56%, #FFBAC3 100%)',
];

export const EditPanel: React.FC<EditPanelProps> = ({
  onBgChange,
  selectedBg,
  onShadowChange,
  isShadowEnabled,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onBgChange(`url(${dataUrl})`);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Tabs defaultValue="background" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="background"><Paintbrush className="w-4 h-4 mr-2" />Color</TabsTrigger>
        <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2" />Image</TabsTrigger>
        <TabsTrigger value="effects"><Sparkles className="w-4 h-4 mr-2" />Effects</TabsTrigger>
      </TabsList>
      <TabsContent value="background" className="mt-4">
        <div className="space-y-6">
          <ColorPicker onColorChange={onBgChange} selectedColor={selectedBg} />
          <div>
            <Label className="font-medium text-center block mb-4">Or choose a gradient</Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {PRESET_GRADIENTS.map((gradient) => (
                <button
                  key={gradient}
                  type="button"
                  className={`w-full h-12 md:h-16 rounded-md border-2 transition-transform transform hover:scale-105 ${selectedBg === gradient ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                  style={{ background: gradient }}
                  onClick={() => onBgChange(gradient)}
                  aria-label={`Select gradient`}
                />
              ))}
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="image" className="mt-4">
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <Label htmlFor="bg-upload" className="font-medium text-center block">Upload a Custom Background</Label>
          <Input
            id="bg-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          <p className="text-xs text-muted-foreground text-center">Or use a quick preset for your product.</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => onBgChange('#FFFFFF')} variant="outline">White Background</Button>
            <Button onClick={() => onBgChange('#000000')} variant="outline">Black Background</Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="effects" className="mt-4">
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <Label htmlFor="shadow-switch" className="font-medium text-base">
              Add Drop Shadow
            </Label>
            <Switch
              id="shadow-switch"
              checked={isShadowEnabled}
              onCheckedChange={onShadowChange}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Adds a subtle shadow to your subject to make it pop.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
};