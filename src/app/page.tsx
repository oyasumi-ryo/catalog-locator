"use client";

import { useState } from "react";

export default function Home() {
  const [store, setStore] = useState("");
  const [item, setItem] = useState("");
  const [section, setSection] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [reason, setReason] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (!store || !item) {
      setError("入力内容を確認してください。");
      return;
    }

    setError("");
    setIsSearching(true);
    setSection("");
    setReason("");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, item }),
      });

      if (!res.ok) throw new Error("サーバーエラー");

      const data = await res.json();
      setSection(data.section);
      setConfidence(data.confidence);
      setReason(data.reason);
      setStore("");
      setItem("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setIsSearching(false);
    }
  };

  // 🟩 信頼度に応じて色を変える関数
  const getConfidenceColor = (value: number) => {
    if (value < 0.4) return "linear-gradient(to right, #f87171, #facc15)"; // 赤〜黄
    if (value < 0.7) return "linear-gradient(to right, #facc15, #4ade80)"; // 黄〜緑
    return "linear-gradient(to right, #4ade80, #3b82f6)"; // 緑〜青
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
      <h1 className="text-4xl font-bold text-gray-700 mb-8 drop-shadow-sm">
        カタログ識別アプリ
      </h1>

      {/* 入力カード */}
      <div className="w-full max-w-md p-6 rounded-3xl shadow-inner bg-gray-100 border border-gray-200
                      flex flex-col gap-4
                      [box-shadow:8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
        <select
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="p-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-blue-400
                     [box-shadow:inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff]"
        >
          <option value="">買う場所を選択</option>
          <option value="100円ショップ">100円ショップ</option>
          <option value="ドラッグストア">ドラッグストア</option>
          <option value="ホームセンター">ホームセンター</option>
          <option value="スーパー">スーパー</option>
          <option value="コンビニ">コンビニ</option>
          <option value="文房具店">文房具店</option>
        </select>

        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="買いたいものを入力（例：ハサミ）"
          className="p-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-blue-400
                     [box-shadow:inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff]"
        />

        <button
          onClick={handleClick}
          disabled={isSearching}
          className="p-3 rounded-xl text-white font-semibold transition-all
                     bg-gradient-to-br from-blue-400 to-blue-600
                     hover:from-blue-500 hover:to-blue-700 active:scale-95
                     [box-shadow:4px_4px_10px_#d1d9e6,-4px_-4px_10px_#ffffff]"
        >
          {isSearching ? "検索中..." : "検索"}
        </button>

        {error && <p className="text-red-500 text-sm text-center mt-1">{error}</p>}
      </div>

      {/* 結果カード */}
      {section && (
        <div className="w-full max-w-md mt-8 p-6 rounded-3xl bg-gray-100 text-gray-700
                        [box-shadow:8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
          <p className="text-lg font-semibold mb-2">
            🔍 売り場候補: <span className="text-blue-600 font-bold">{section}</span>
          </p>

          {/* 🧭 信頼度バー */}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-2 mb-2
                          [box-shadow:inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${confidence * 100}%`,
                background: getConfidenceColor(confidence),
              }}
            />
          </div>

          <p className="text-sm text-gray-600 mb-1">
            信頼度: {(confidence * 100).toFixed(1)}%
          </p>
          <p className="text-sm">{reason}</p>
        </div>
      )}
    </main>
  );
}
