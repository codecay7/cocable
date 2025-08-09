import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Eraser, Check, X, Undo, Redo, Brush } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface CanvasEditorProps {
  imageSrc: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ imageSrc, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialImageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tool, setTool] = useState<'erase' | 'restore'>('erase');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      initialImageRef.current = image;
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      setHistory([dataUrl]);
      setHistoryIndex(0);
    };
    image.src = imageSrc;
  }, [imageSrc]);

  const pushHistory = (dataUrl: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const restoreFromHistory = (index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !history[index]) return;

    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
    };
    image.src = history[index];
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreFromHistory(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreFromHistory(newIndex);
    }
  };

  const getCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !initialImageRef.current) return;
    const { x, y } = getCoords(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineTo(x, y);
      ctx.stroke(); // This creates the path
      ctx.clip(); // Clip to the path
      ctx.drawImage(initialImageRef.current, 0, 0);
      ctx.restore();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      pushHistory(canvas.toDataURL('image/png'));
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-2 md:p-4 border rounded-lg bg-muted/50 space-y-4">
        <h3 className="text-lg font-semibold text-center">Manual Refinement</h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <TooltipProvider>
            <ToggleGroup type="single" value={tool} onValueChange={(value: 'erase' | 'restore') => value && setTool(value)} aria-label="Editing Tool">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="erase" aria-label="Erase">
                    <Eraser className="w-4 h-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Erase</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="restore" aria-label="Restore">
                    <Brush className="w-4 h-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Restore</p></TooltipContent>
              </Tooltip>
            </ToggleGroup>
            <div className="h-8 w-px bg-border mx-2"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleUndo} disabled={historyIndex <= 0}>
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Undo</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Redo</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-4 px-4">
          <Label htmlFor="brush-size" className="flex-shrink-0">Brush Size</Label>
          <Slider
            id="brush-size"
            min={5}
            max={100}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
          />
        </div>
      </div>
      
      <div className="w-full overflow-auto rounded-md border bg-muted/20" style={{ maxHeight: '50vh', cursor: 'crosshair' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
        />
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={handleSave}><Check className="w-4 h-4 mr-2" />Apply Changes</Button>
        <Button onClick={onCancel} variant="outline"><X className="w-4 h-4 mr-2" />Cancel</Button>
      </div>
    </div>
  );
};