import { NextResponse } from "next/server";

const KEY = process.env.EXCHANGE_RATE_API_KEY || "f309933485e263b0337b76ad";

export async function GET() {
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${KEY}/latest/EUR`);
    if (!res.ok) throw new Error("Exchange rate request failed");
    const data = await res.json();
    const rates = data?.conversion_rates || {};
    return NextResponse.json({
      USD: rates.USD || 1.08,
      EUR: 1,
      DZD: rates.DZD || 145,
    });
  } catch (e: any) {
    return NextResponse.json({ USD: 1.08, EUR: 1, DZD: 145, error: e?.message }, { status: 200 });
  }
}