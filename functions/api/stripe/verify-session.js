export async function onRequestPost(context) {
  const { request, env } = context;
  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) return json({ error: "Stripe is not configured" }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const sessionId = String(body?.sessionId || "").trim();
  const orderId = body?.orderId;
  if (!sessionId) return json({ error: "Missing sessionId" }, 400);

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data?.error?.message || "Stripe error" }, 502);

    const paid = data.payment_status === "paid";
    if (paid && orderId) {
      const supabaseUrl =
        env.NEXT_PUBLIC_SUPABASE_URL ||
        env.SUPABASE_URL ||
        "https://lahorqznlrzdlupveoja.supabase.co";
      const supabaseKey =
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        env.SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaG9ycXpubHJ6ZGx1cHZlb2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjQzNjgsImV4cCI6MjEwODcwMDM2OH0.5qGE1B8hQUxW113xKEI6oW9NoIraAkmacMFbb1kCRws";
      try {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ payment_status: "paid", payment_reference: data.id, status: "processing" }),
        });
      } catch {
        // ignore
      }
    }

    return json({
      status: data.status,
      paymentStatus: data.payment_status,
      paid,
      customerEmail: data.customer_details?.email || null,
    });
  } catch (e) {
    return json({ error: e?.message || "Stripe request failed" }, 502);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
