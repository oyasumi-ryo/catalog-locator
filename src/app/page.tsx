"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [store, setStore] = useState("");
  const [item, setItem] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [section, setSection] = useState("ここにAIの回答が表示されます");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const getConfidenceColor = (v: number) => {
    if (v < 0.4) return "bg-red-500";
    if (v < 0.7) return "bg-yellow-500";
    return "bg-green-500";
  };

  const storeInputRef = useRef<HTMLInputElement>(null);

  const handleClick = async () => {
    if (!store || !item) {
      setError("「買う場所」と「買いたいもの」を両方入力してね");
      return;
    }

    setError("");
    setIsSearching(true);
    setSection("検索中...");
    setConfidence(null);
    setReason("");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, item }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "APIエラー");
      }

      const data = await res.json(); // JSONで受け取る
      setSection(data.section || "不明");
      setConfidence(data.confidence ?? 0);
      setReason(data.reason || "");
      setStore("");
      setItem("");
      storeInputRef.current?.focus();
    } catch (e: any) {
      setError(e.message ?? "通信に失敗しました");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-8">
      <h1 className="text-4xl font-bold text-gray-800">カタログ識別アプリ</h1>

      {/* 入力カード */}
      <div className="w-full max-w-md p-5 bg-white rounded-2xl shadow-lg
                      [box-shadow:8px_8px_24px_#e5e7eb,_-8px_-8px_24px_#ffffff]">
        <div className="flex flex-col gap-3 text-gray-800">
          <input
            ref={storeInputRef}       
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="買う場所（例：100円均一）"
            className="w-full p-3 rounded-xl outline-none bg-gray-50 border border-gray-200
                       focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="買いたいもの（例：ハサミ）"
            className="w-full p-3 rounded-xl outline-none bg-gray-50 border border-gray-200
                       focus:ring-2 focus:ring-blue-300"
          />

          <button
            onClick={handleClick}
            disabled={isSearching}
            className={`w-full p-3 rounded-xl font-semibold transition-all
              ${isSearching
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 active:scale-[0.99]"} 
              text-white flex items-center justify-center gap-2`}
          >
            {isSearching && (
              <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            )}
            {isSearching ? "検索中..." : "検索"}
          </button>

          {error && (
            <p className="text-sm text-red-500 pt-1">{error}</p>
          )}
        </div>
      </div>

      {/* 結果カード */}
      <div className="w-full max-w-md p-5 bg-white rounded-2xl text-center
                      [box-shadow:8px_8px_24px_#e5e7eb,_-8px_-8px_24px_#ffffff]">
        <p className="text-sm text-gray-400 mb-1">AI推定</p>
        <div className="text-2xl font-bold text-gray-800 mb-2">{section}</div>

        {confidence !== null && (
          <div className="w-full mb-3">
            {/* ラベル行（%表示） */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">信頼度</span>
              <span className="text-xs font-medium text-gray-600">
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* ゲージ本体 */}
            <div
              className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(confidence * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="AI推定の信頼度"
            >
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getConfidenceColor(confidence)}`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        )}

        {reason && <p className="text-gray-500 text-sm">{reason}</p>}
      </div>
    </main>
  );
}
