import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

let segmenter: bodySegmentation.BodySegmenter | null = null;

self.onmessage = async (e: MessageEvent<{ file: File, id: string, quality: 'general' | 'landscape' }>) => {
  const { file, id, quality } = e.data;

  try {
    if (!segmenter || (segmenter as any).modelType !== quality) {
      self.postMessage({ type: 'log', message: `Loading model (quality: ${quality})...` });
      const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
      segmenter = await bodySegmentation.createSegmenter(model, { runtime: 'tfjs', modelType: quality });
      self.postMessage({ type: 'log', message: 'Model loaded.' });
    }

    const imageBitmap = await createImageBitmap(file);

    self.postMessage({ type: 'progress', id, progress: 50 });

    const segmentation = await segmenter.segmentPeople(imageBitmap);

    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get OffscreenCanvas context');

    ctx.drawImage(imageBitmap, 0, 0);

    const foreground = { r: 0, g: 0, b: 0, a: 255 };
    const background = { r: 0, g: 0, b: 0, a: 0 };
    const binaryMask = await bodySegmentation.toBinaryMask(segmentation, foreground, background);

    const maskCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Could not get mask canvas context');
    maskCtx.putImageData(binaryMask, 0, 0);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0);

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const resultUrl = URL.createObjectURL(blob);

    self.postMessage({ type: 'done', id, result: resultUrl });

  } catch (error: any) {
    self.postMessage({ type: 'error', id, error: error.message || 'An unknown error occurred in the worker.' });
  }
};