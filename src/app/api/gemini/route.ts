export async function POST(req: Request) {
  try {
    const { store, item } = await req.json();

    const prompt = `
あなたは買い物フロア案内の専門家です。
店舗タイプ: 「${store}」
買いたいもの: 「${item}」
次のJSONだけを厳密に返してください。前置きや説明は不要です。

{
  "section": "売り場名を一語（例: 文房具コーナー）",
  "confidence": 0.0,  // 0〜1 の数値
  "reason": "短い根拠を1文"
}
    `.trim();

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY as string,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Gemini error ${res.status}`, detail: errText }), { status: 502 });
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // モデルが余計なテキストを返した場合に備えて、JSON部分だけを抽出
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ section: "不明", confidence: 0, reason: "JSON抽出に失敗" }, { status: 200 });
    }

    let obj: any;
    try {
      obj = JSON.parse(match[0]);
    } catch {
      return Response.json({ section: "不明", confidence: 0, reason: "JSONパースに失敗" }, { status: 200 });
    }

    // フィールドの型を軽く正規化
    return Response.json({
      section: typeof obj.section === "string" ? obj.section.trim() : "不明",
      confidence: typeof obj.confidence === "number" ? Math.max(0, Math.min(1, obj.confidence)) : 0,
      reason: typeof obj.reason === "string" ? obj.reason.trim() : "",
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Bad request", detail: e?.message }), { status: 400 });
  }
}
