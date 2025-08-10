import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { encode } from "https://deno.land/std@0.192.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper to convert base64 to Blob
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  if (parts.length !== 2) {
    throw new Error("Invalid base64 string");
  }
  const contentType = parts[0].split(':')[1];
  const byteCharacters = atob(parts[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

// Using a more stable, official Inference API endpoint for inpainting
const HF_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-inpainting";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const HF_API_KEY = Deno.env.get("HF_API_KEY");
    if (!HF_API_KEY) {
      console.error("Missing Hugging Face API key in environment variables.");
      throw new Error("The inpainting service is not configured on the server. Please contact support and provide the error code: [MISSING_HF_KEY]");
    }

    const { imageBase64, maskBase64 } = await req.json();
    if (!imageBase64 || !maskBase64) {
      throw new Error('Missing image or mask data.');
    }

    const imageBlob = base64ToBlob(imageBase64);
    const maskBlob = base64ToBlob(maskBase64);

    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('mask_image', maskBlob, 'mask.png');
    formData.append('prompt', 'high quality photo, 4k, detailed, sharp focus');

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API Error:", errorBody);
      throw new Error(`The inpainting service failed to process the image. It may be busy or the model is loading. Status: ${response.status}`);
    }

    const responseContentType = response.headers.get('content-type') || 'image/png';
    const inpaintedImageBuffer = await response.arrayBuffer();
    const inpaintedImageBase64 = `data:${responseContentType};base64,${encode(inpaintedImageBuffer)}`;

    return new Response(JSON.stringify({ inpaintedImage: inpaintedImageBase64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in inpaint-image function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})