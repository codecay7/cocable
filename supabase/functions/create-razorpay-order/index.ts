import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Immediately handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS preflight.");
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    console.log("Function invoked, preparing success response.");
    // For any other request, return a simple success JSON object
    const body = JSON.stringify({ message: "Success from simplified debug function" });
    return new Response(body, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    // Catch any unexpected errors during response creation
    console.error("Error in simplified function:", e.message);
    const errorBody = JSON.stringify({ error: e.message });
    return new Response(errorBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})