// Supabase Edge Function: forward DB change events to Next.js revalidation endpoint
// Deploy with: supabase functions deploy revalidate --no-verify-jwt
// Env vars to set in Supabase: NEXT_REVALIDATE_URL (e.g. https://your-site.com/api/revalidate), REVALIDATE_SECRET
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const NEXT_REVALIDATE_URL = Deno.env.get("NEXT_REVALIDATE_URL");
const REVALIDATE_SECRET = Deno.env.get("REVALIDATE_SECRET");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!NEXT_REVALIDATE_URL || !REVALIDATE_SECRET) {
    console.error("Missing NEXT_REVALIDATE_URL or REVALIDATE_SECRET");
    return new Response("Server not configured", { status: 500 });
  }

  const payload = await req.json().catch(() => null) as {
    record?: { id?: string | null };
    old_record?: { id?: string | null };
    carId?: string;
    locales?: string[];
  } | null;

  const carId = payload?.carId ?? payload?.record?.id ?? payload?.old_record?.id ?? null;
  const locales = payload?.locales;

  try {
    const res = await fetch(`${NEXT_REVALIDATE_URL}?secret=${encodeURIComponent(REVALIDATE_SECRET)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carId, locales }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Revalidate call failed", res.status, text);
      return new Response("Failed to revalidate", { status: 500 });
    }

    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calling revalidate endpoint", error);
    return new Response("Error", { status: 500 });
  }
});
