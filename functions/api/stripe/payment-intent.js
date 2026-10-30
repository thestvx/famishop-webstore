export async function onRequestPost(context) {
  const { request, env } = context;
  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    return json({ error: "Stripe is not configured (STRIPE_SECRET_KEY)" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const amount = Math.round(Number(body?.amount) || 0);
  const currency = String(body?.currency || "eur").toLowerCase();
  if (amount < 50) return json({ error: "Amount too small" }, 400);

  const params = new URLSearchParams();
  params.append("amount", String(amount));
  params.append("currency", currency);
  params.append("automatic_payment_methods[enabled]", "true");
  if (body?.metadata && typeof body.metadata === "object") {
    for (const [k, v] of Object.entries(body.metadata)) {
      params.append(`metadata[${k}]`, String(v));
    }
  }

  try {
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      return json({ error: data?.error?.message || "Stripe error" }, 502);
    }
    return json({ clientSecret: data.client_secret, paymentIntentId: data.id });
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
