import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Stripe } from "https://esm.sh/stripe@16.2.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2024-06-20',
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// This is the number of credits to grant for a successful purchase.
// It should match the product you created in Stripe.
const CREDITS_TO_ADD = 50;

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    if (!userId) {
      console.error("Webhook received checkout.session.completed event without a client_reference_id (user ID).");
      return new Response("User ID not found in session.", { status: 400 });
    }

    try {
      const { error } = await supabaseAdmin.rpc('add_credits', {
        user_id_param: userId,
        credits_to_add: CREDITS_TO_ADD
      });
      if (error) throw error;
    } catch (err) {
      console.error("Failed to add credits for user:", userId, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});