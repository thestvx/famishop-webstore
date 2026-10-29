import { NextResponse } from "next/server";

const DEEPL_KEY = process.env.DEEPL_API_KEY || "9643f0dd-e87c-4a25-ab36-053a7b022063:fx";

function deeplEndpoint(key: string) {
  return key.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

export async function POST(req: Request) {
  try {
    const { text, source, target } = await req.json();
    if (!text || !target) {
      return NextResponse.json({ error: "Missing text or target" }, { status: 400 });
    }
    const targetLang = String(target).toUpperCase();
    const body: any = { text: [text], target_lang: targetLang };
    if (source && source !== "auto") body.source_lang = String(source).toUpperCase();

    const res = await fetch(deeplEndpoint(DEEPL_KEY), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "DeepL request failed");
    }
    const data = await res.json();
    const translated = data?.translations?.[0]?.text || "";
    return NextResponse.json({ translated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Translation failed" }, { status: 500 });
  }
}