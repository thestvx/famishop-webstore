import { NextResponse } from "next/server";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

export async function POST(req: Request) {
  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured (STRIPE_SECRET_KEY)" }, { status: 500 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = Math.round(Number(body?.amount) || 0);
  const currency = String(body?.currency || "eur").toLowerCase();
  if (amount < 50) {
    return NextResponse.json({ error: "Amount too small" }, { status: 400 });
  }

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
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Stripe error" },
        { status: 502 }
      );
    }
    return NextResponse.json({
      clientSecret: data.client_secret,
      paymentIntentId: data.id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Stripe request failed" }, { status: 502 });
  }
}
