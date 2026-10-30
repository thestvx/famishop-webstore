import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

export async function POST(req: Request) {
  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sessionId = String(body?.sessionId || "").trim();
  const orderId = body?.orderId;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || "Stripe error" }, { status: 502 });
    }
    const paid = data.payment_status === "paid";

    if (paid && orderId && isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from("orders")
          .update({ payment_status: "paid", payment_reference: data.id, status: "processing" })
          .eq("id", orderId);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      status: data.status,
      paymentStatus: data.payment_status,
      paid,
      customerEmail: data.customer_details?.email || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Stripe request failed" }, { status: 502 });
  }
}
