export async function POST(req: Request) {
  const body = await req.json();
  const { store, item } = body;

  const prompt = `ユーザーが買いたいものは「${item}」、買う場所は「${store}」です。
  売っていそうなコーナー名を一語で答えてください（例：文房具コーナー）。`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ← ここがポイント：APIキーはこのヘッダ or ?key=... のクエリで渡す
        "x-goog-api-key": process.env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "回答なし";
  return new Response(text, { status: 200 });
}
