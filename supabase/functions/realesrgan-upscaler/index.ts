import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { encode } from "https://deno.land/std@0.192.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const HF_API_KEY = Deno.env.get("HF_API_KEY");
    if (!HF_API_KEY) {
      console.error("Missing Hugging Face API key in environment variables.");
      throw new Error("The upscaling service is not configured on the server. Please contact support and provide the error code: [MISSING_HF_KEY]");
    }

    const { imageBase64, scaleFactor } = await req.json();
    if (!imageBase64 || !scaleFactor) {
      throw new Error('Missing image data or scale factor.');
    }

    let modelUrl = "";
    if (scaleFactor === 2) {
        modelUrl = "https://api-inference.huggingface.co/models/caidas/swin2SR-classical-sr-x2-64";
    } else if (scaleFactor === 4) {
        modelUrl = "https://api-inference.huggingface.co/models/caidas/swin2SR-classical-sr-x4-64";
    } else {
        throw new Error(`Unsupported scale factor: ${scaleFactor}. Only 2x and 4x are supported.`);
    }

    // Send a JSON payload with the base64 string.
    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: imageBase64
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API Error:", errorBody);
      
      let detailedError = `The AI upscaling service failed with status ${response.status}.`;
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          detailedError += ` Details: ${errorJson.error}`;
        }
        if (errorJson.estimated_time) {
          detailedError += ` The model may be loading, please try again in a minute.`;
        }
      } catch (e) {
        if (errorBody.length < 200) {
          detailedError += ` Details: ${errorBody}`;
        }
      }
      throw new Error(detailedError);
    }

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