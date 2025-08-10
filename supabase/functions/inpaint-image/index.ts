import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Using PowerPaint for high-quality inpainting
const HF_API_URL = "https://sanster-powerpaint-v1-inpainting.hf.space/run/predict";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { imageBase64, maskBase64 } = await req.json();
    if (!imageBase64 || !maskBase64) {
      throw new Error('Missing image or mask data.');
    }

    const payload = {
      fn_index: 0,
      data: [
        {
          "image": imageBase64,
          "mask": maskBase64
        },
        "object removal", // A generic prompt for removal
        "",
        "",
        50,
        7.5,
        1
      ],
      session_hash: Math.random().toString(36).substring(7)
    };

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API Error:", errorBody);
      throw new Error('The inpainting service failed to process the image.');
    }

    const result = await response.json();
    
    const inpaintedImage = result?.data?.[0];

    if (!inpaintedImage) {
      throw new Error('Inpainted image not found in the response from the service.');
    }

    return new Response(JSON.stringify({ inpaintedImage }), {
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