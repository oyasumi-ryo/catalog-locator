"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState } from "react";

export default function Home() {
  const [store, setStore] = useState("")
  const [item, setItem] = useState("")
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState("ここにAIの回答が表示されます");

  const handleClick = async () => {
    setIsSearching(true);
    setResult("検索中...");

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store, item }),
    });

    const data = await res.text();
    setResult(data);
    setIsSearching(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-8">
      <h1 className="text-4xl font-bold text-gray-800">カタログ識別アプリ</h1>

      <div className="w-full max-w-md p-4 bg-gray-50 rounded-2xl shadow-md">
        <div className="flex flex-col gap-3 text-gray-800">
          <input
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="買う場所を入力（例：100円均一）"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="買いたいものを入力（例：ハサミ）"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button 
            className="w-full p-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            onClick={handleClick}
          >
            検索
          </button>
        </div>
      </div>
      <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-sm text-center text-gray-600">
        {result}
      </div>

    </main>
  );
}
