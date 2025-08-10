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

const HF_API_URL = "https://api-inference.huggingface.co/models/piddnad/ddcolor";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const HF_API_KEY = Deno.env.get("HF_API_KEY");
    if (!HF_API_KEY) {
      console.error("Missing Hugging Face API key in environment variables.");
      throw new Error("The colorizer service is not configured on the server. Error code: [MISSING_HF_KEY]");
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      throw new Error('Missing image data.');
    }

    const imageBlob = base64ToBlob(imageBase64);

    const response = await fetch(HF_API_URL, {
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
      throw new Error(`The AI colorizer service failed. It might be busy. Status: ${response.status}`);
    }

    const responseContentType = response.headers.get('content-type') || 'image/png';
    const colorizedImageBuffer = await response.arrayBuffer();
    const colorizedImageBase64 = `data:${responseContentType};base64,${encode(colorizedImageBuffer)}`;

    return new Response(JSON.stringify({ colorizedImage: colorizedImageBase64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in AI colorizer function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})