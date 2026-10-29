import { NextResponse } from "next/server";

const KEY = process.env.EXCHANGE_RATE_API_KEY || "f309933485e263b0337b76ad";

export async function GET() {
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${KEY}/latest/EUR`);
    if (!res.ok) throw new Error("Exchange rate request failed");
    const data = await res.json();
    const rate = data?.conversion_rates?.DZD;
    if (!rate) throw new Error("DZD rate not found");
    return NextResponse.json({ rate });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed", rate: 145 }, { status: 200 });
  }
}