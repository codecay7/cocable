import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Undo, Redo, Trash2, Wand2, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface MarkingCanvasProps {
  imageSrc: string;
  onComplete: (dataUrl: string) => void;
  onProcessStart: () => Promise<boolean>;
  isProcessing: boolean;
}

export const MarkingCanvas: React.FC<MarkingCanvasProps> = ({ imageSrc, onComplete, onProcessStart, isProcessing }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isApplying, setIsApplying] = useState(false);

  const getRelativeCoords = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const initializeCanvases = useCallback(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const imageCanvas = imageCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      const container = containerRef.current;
      if (!imageCanvas || !drawingCanvas || !container) return;

      container.style.aspectRatio = `${image.width} / ${image.height}`;

      const canvasWidth = image.width;
      const canvasHeight = image.height;

      imageCanvas.width = canvasWidth;
      imageCanvas.height = canvasHeight;
      drawingCanvas.width = canvasWidth;
      drawingCanvas.height = canvasHeight;
      
      const imageCtx = imageCanvas.getContext('2d');
      const drawingCtx = drawingCanvas.getContext('2d');
      if (!imageCtx || !drawingCtx) return;

      imageCtx.drawImage(image, 0, 0);
      
      const initialImageData = drawingCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      setHistory([initialImageData]);
      setHistoryIndex(0);
    };
  }, [imageSrc]);

  useEffect(() => {
    initializeCanvases();
    window.addEventListener('resize', initializeCanvases);
    return () => window.removeEventListener('resize', initializeCanvases);
  }, [initializeCanvases]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getRelativeCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getRelativeCoords(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgb(255, 0, 150)'; // Use solid color for a clean mask
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    
    const newImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) ctx.putImageData(history[newIndex], 0, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) ctx.putImageData(history[newIndex], 0, 0);
    }
  };

  const handleClear = () => {
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (ctx && history[0]) {
      ctx.putImageData(history[0], 0, 0);
      const newHistory = history.slice(0, 1);
      setHistory(newHistory);
      setHistoryIndex(0);
    }
  };

  const handleRemoveObjects = async () => {
    const canProcess = await onProcessStart();
    if (!canProcess) return;

    setIsApplying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const imageCanvas = imageCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!imageCanvas || !drawingCanvas) {
      setIsApplying(false);
      return;
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = imageCanvas.width;
    finalCanvas.height = imageCanvas.height;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) {
      setIsApplying(false);
      return;
    }

    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = imageCanvas.width;
    blurCanvas.height = imageCanvas.height;
    const blurCtx = blurCanvas.getContext('2d');
    if (!blurCtx) {
      setIsApplying(false);
      return;
    }
    blurCtx.filter = 'blur(25px)';
    blurCtx.drawImage(imageCanvas, 0, 0);
    blurCtx.filter = 'none';

    finalCtx.drawImage(imageCanvas, 0, 0);
    finalCtx.globalCompositeOperation = 'destination-out';
    finalCtx.drawImage(drawingCanvas, 0, 0);
    finalCtx.globalCompositeOperation = 'destination-over';
    finalCtx.drawImage(blurCanvas, 0, 0);
    finalCtx.globalCompositeOperation = 'source-over';

    onComplete(finalCanvas.toDataURL('image/png'));
    setIsApplying(false);
  };

  const totalProcessing = isProcessing || isApplying;

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
        <h3 className="text-lg font-semibold text-center">Mark Objects to Remove</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Label htmlFor="brush-size" className="flex-shrink-0">Brush Size</Label>
            <Slider id="brush-size" min={10} max={150} step={5} value={[brushSize]} onValueChange={(v) => setBrushSize(v[0])} />
          </div>
          <TooltipProvider>
            <div className="flex gap-2">
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleUndo} disabled={historyIndex <= 0}><Undo className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Undo</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1}><Redo className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Redo</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleClear}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Clear Mask</p></TooltipContent></Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full max-w-full mx-auto overflow-hidden rounded-md border bg-muted/20">
        <canvas ref={imageCanvasRef} className="absolute top-0 left-0 w-full h-full" />
        <canvas
          ref={drawingCanvasRef}
          className="relative z-10 w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <Button onClick={handleRemoveObjects} disabled={totalProcessing} className="w-full" size="lg">
        {totalProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        {isProcessing ? 'Checking usage...' : isApplying ? 'Applying AI Magic...' : 'Remove Marked Objects'}
      </Button>
    </div>
  );
};