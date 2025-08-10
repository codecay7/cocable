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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get API Key from environment variables
    const HF_API_KEY = Deno.env.get("HF_API_KEY");
    if (!HF_API_KEY) {
      console.error("Missing Hugging Face API key in environment variables.");
      throw new Error("The upscaling service is not configured on the server. Please contact support and provide the error code: [MISSING_HF_KEY]");
    }

    // 2. Get image data from request
    const { imageBase64, scaleFactor } = await req.json();
    if (!imageBase64 || !scaleFactor) {
      throw new Error('Missing image data or scale factor.');
    }

    // 3. Select model based on scale factor
    let modelUrl = "";
    if (scaleFactor === 2) {
        modelUrl = "https://api-inference.huggingface.co/models/caidas/swin2SR-classical-sr-x2-64";
    } else if (scaleFactor === 4) {
        modelUrl = "https://api-inference.huggingface.co/models/caidas/swin2SR-classical-sr-x4-64";
    } else {
        throw new Error(`Unsupported scale factor: ${scaleFactor}. Only 2x and 4x are supported.`);
    }

    // 4. Convert base64 to Blob for sending
    const imageBlob = base64ToBlob(imageBase64);

    // 5. Call Hugging Face Inference API
    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': imageBlob.type
      },
      body: imageBlob,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API Error:", errorBody);
      throw new Error(`The AI upscaling service failed. It might be temporarily unavailable. Status: ${response.status}`);
    }

    // 6. Convert response blob back to base64 for the client
    const responseContentType = response.headers.get('content-type') || 'image/png';
    const upscaledImageBuffer = await response.arrayBuffer();
    const upscaledImageBase64 = `data:${responseContentType};base64,${encode(upscaledImageBuffer)}`;

    return new Response(JSON.stringify({ upscaledImage: upscaledImageBase64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in AI upscaler function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})