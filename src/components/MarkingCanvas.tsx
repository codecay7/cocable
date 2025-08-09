import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface MarkingCanvasProps {
  imageSrc: string;
  brushSize: number;
  onDrawEnd: (maskCanvas: HTMLCanvasElement) => void;
}

export interface MarkingCanvasRef {
  clear: () => void;
}

export const MarkingCanvas = forwardRef<MarkingCanvasRef, MarkingCanvasProps>(
  ({ imageSrc, brushSize, onDrawEnd }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = imageSrc;
      image.onload = () => {
        const container = containerRef.current;
        const imageCanvas = imageCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        if (!container || !imageCanvas || !drawingCanvas) return;

        const containerWidth = container.offsetWidth;
        const scale = containerWidth > 0 ? containerWidth / image.width : 1;
        const width = containerWidth > 0 ? containerWidth : image.width;
        const height = image.height * scale;

        imageCanvas.width = drawingCanvas.width = width;
        imageCanvas.height = drawingCanvas.height = height;

        const ctx = imageCanvas.getContext('2d');
        ctx?.drawImage(image, 0, 0, width, height);
      };
    }, [imageSrc]);

    useImperativeHandle(ref, () => ({
      clear() {
        const canvas = drawingCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onDrawEnd(canvas);
        }
      },
    }));

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      setIsDrawing(true);
      const { x, y } = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // red-500
      const { x, y } = getCoords(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      const canvas = drawingCanvasRef.current;
      if (canvas) {
        onDrawEnd(canvas);
      }
    };

    return (
      <div ref={containerRef} className="relative w-full" style={{ cursor: 'crosshair' }}>
        <canvas ref={imageCanvasRef} className="w-full h-auto rounded-md bg-muted/20" />
        <canvas
          ref={drawingCanvasRef}
          className="absolute top-0 left-0 w-full h-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    );
  }
);