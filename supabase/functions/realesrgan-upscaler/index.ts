import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Using a different public Real-ESRGAN model hosted on Hugging Face Spaces for better reliability
const HF_API_URL = "https://multimodalart-realesrgan.hf.space/run/predict";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { imageBase64, scaleFactor } = await req.json();
    if (!imageBase64 || !scaleFactor) {
      throw new Error('Missing image data or scale factor.');
    }

    // The Hugging Face Space API expects a specific payload structure
    const payload = {
      fn_index: 0, // The function index on the Gradio app
      data: [
        imageBase64,
        `${scaleFactor}x`
      ],
      session_hash: Math.random().toString(36).substring(7) // A random session hash
    };

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API Error:", errorBody);
      throw new Error('The upscaling service failed to process the image.');
    }

    const result = await response.json();
    
    // The upscaled image is in the first element of the 'data' array
    const upscaledImage = result?.data?.[0];

    if (!upscaledImage) {
      throw new Error('Upscaled image not found in the response from the service.');
    }

    return new Response(JSON.stringify({ upscaledImage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in realesrgan-upscaler function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})