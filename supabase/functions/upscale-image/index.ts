import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const HF_API_KEY = Deno.env.get("HF_API_KEY")
const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-x4-upscaler"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'imageUrl is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Fetch the image data from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();

    const response = await fetch(API_URL, {
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      method: "POST",
      body: imageBlob,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API error:", errorBody);
      throw new Error(`Hugging Face API request failed: ${response.statusText}`);
    }

    const resultBlob = await response.blob();
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const filePath = `upscaled/${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, resultBlob, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file to Supabase storage:', uploadError);
      throw uploadError;
    }
    
    const { data: urlData } = supabaseAdmin.storage.from('images').getPublicUrl(uploadData.path);

    return new Response(JSON.stringify({ url: urlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})