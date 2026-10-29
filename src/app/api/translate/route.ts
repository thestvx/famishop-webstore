import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, source, target } = await req.json();
    if (!text || !target) {
      return NextResponse.json({ error: "Missing text or target" }, { status: 400 });
    }
    const sl = source || "auto";
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Translation request failed");
    const data = await res.json();
    const translated = (data?.[0] || []).map((part: any) => part?.[0] || "").join("");
    return NextResponse.json({ translated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Translation failed" }, { status: 500 });
  }
}