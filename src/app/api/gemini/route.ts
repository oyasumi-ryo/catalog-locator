// --- 型定義と型ガード（上に置いてOK） ---
type GeminiAnswer = {
  section: string;
  confidence: number; // 0..1
  reason: string;
};

function isGeminiAnswer(x: unknown): x is GeminiAnswer {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.section === "string" &&
    typeof o.confidence === "number" &&
    typeof o.reason === "string"
  );
}

// Googleのレスポンスから text を安全に取り出す（any不使用）
function extractTextFromGoogleResponse(u: unknown): string | undefined {
  if (typeof u !== "object" || u === null) return undefined;
  const o = u as Record<string, unknown>;

  const candidates = o["candidates"];
  if (!Array.isArray(candidates) || candidates.length === 0) return undefined;

  const first = candidates[0];
  if (typeof first !== "object" || first === null) return undefined;
  const f = first as Record<string, unknown>;

  const content = f["content"];
  if (typeof content !== "object" || content === null) return undefined;
  const c = content as Record<string, unknown>;

  const parts = c["parts"];
  if (!Array.isArray(parts) || parts.length === 0) return undefined;

  const p0 = parts[0];
  if (typeof p0 !== "object" || p0 === null) return undefined;
  const p = p0 as Record<string, unknown>;

  const text = p["text"];
  return typeof text === "string" ? text : undefined;
}

// --- 本体 ---
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
  "confidence": 0.0,
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
      return Response.json(
        { error: `Gemini error ${res.status}`, detail: errText },
        { status: 502 }
      );
    }

    const dataUnknown: unknown = await res.json();
    const textFromApi = extractTextFromGoogleResponse(dataUnknown) ?? "";

    // JSONだけ抽出
    const match = textFromApi.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json(
        { section: "不明", confidence: 0, reason: "JSON抽出に失敗" },
        { status: 200 }
      );
    }

    // パース
    let parsedUnknown: unknown;
    try {
      parsedUnknown = JSON.parse(match[0]);
    } catch {
      return Response.json(
        { section: "不明", confidence: 0, reason: "JSONパースに失敗" },
        { status: 200 }
      );
    }

    // 型確認
    if (!isGeminiAnswer(parsedUnknown)) {
      return Response.json(
        { section: "不明", confidence: 0, reason: "型不一致" },
        { status: 200 }
      );
    }

    const ans = parsedUnknown; // ここから型が GeminiAnswer に確定
    return Response.json({
      section: ans.section.trim(),
      confidence: Math.max(0, Math.min(1, ans.confidence)),
      reason: ans.reason.trim(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: "Bad request", detail: msg }, { status: 400 });
  }
}
