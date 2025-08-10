import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The Hugging Face model we'll use for upscaling
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/nightmareai/real-esrgan";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Retrieve the Hugging Face API key from environment variables
    const hfApiKey = Deno.env.get("HF_API_KEY");
    if (!hfApiKey) {
      console.error("HF_API_KEY is not set in environment variables.");
      return new Response(JSON.stringify({ error: "Server configuration error: Missing API key." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the image data from the request body
    const imageBlob = await req.blob();
    if (!imageBlob || imageBlob.size === 0) {
        return new Response(JSON.stringify({ error: "No image data received." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Make the API call to Hugging Face
    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfApiKey}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBlob,
    });

    // Check if the Hugging Face API returned an error
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Hugging Face API error: ${response.status} ${response.statusText}`, errorBody);
      return new Response(JSON.stringify({ error: `Failed to upscale image. API Error: ${errorBody}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If successful, stream the upscaled image back to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "image/png",
      },
    });

  } catch (error) {
    console.error("An unexpected error occurred:", error.message);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});