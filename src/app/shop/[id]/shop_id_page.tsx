// src/app/shop/[id]/page.tsx
// Страница конкретной презентации — заблюренный контент + форма ввода кода

"use client";

import { useState } from "react";
import Link from "next/link";

// Заглушка данных презентации
const MOCK_PRESENTATIONS: Record<number, { title: string; description: string; price: number }> = {
  1: {
    title: "Алгебра 6 класс — повторение",
    description: "Интерактивная презентация для повторения тем 5-6 класса.",
    price: 299,
  },
  2: {
    title: "Физика 7 класс — силы",
    description: "Виды сил, законы Ньютона, задачи с анимацией.",
    price: 349,
  },
};

export default function PresentationPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const presentation = MOCK_PRESENTATIONS[id];

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  if (!presentation) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <p className="text-lg mb-4">Презентация не найдена</p>
          <Link href="/shop" className="text-sm underline hover:text-white">
            ← вернуться в магазин
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/shop/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), presentationId: id }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setStatus("success");
        setAccessToken(data.token);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Неверный или использованный код");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Ошибка соединения. Попробуй ещё раз.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Шапка */}
      <header className="border-b border-zinc-800 px-6 py-5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/shop" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            ← назад в магазин
          </Link>
          <span className="text-sm text-zinc-500">{presentation.title}</span>
        </div>
      </header>

      {/* Основной контент */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Инфо о презентации */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">{presentation.title}</h1>
          <p className="text-zinc-400">{presentation.description}</p>
        </div>

        {/* Зона презентации */}
        <div className="relative rounded-xl overflow-hidden border border-zinc-800" style={{ minHeight: "500px" }}>

          {/* Заблюренный контент (заглушка — потом будет реальная презентация) */}
          {!accessToken && (
            <div
              className="w-full h-full"
              style={{ minHeight: "500px", filter: "blur(12px)", pointerEvents: "none", userSelect: "none" }}
              aria-hidden="true"
            >
              {/* Заглушка-превью под блюром */}
              <div className="bg-zinc-900 w-full h-full flex items-center justify-center" style={{ minHeight: "500px" }}>
                <div className="text-center space-y-4 p-12">
                  <div className="w-24 h-3 bg-zinc-700 rounded mx-auto" />
                  <div className="w-48 h-5 bg-zinc-600 rounded mx-auto" />
                  <div className="w-36 h-3 bg-zinc-700 rounded mx-auto" />
                  <div className="grid grid-cols-3 gap-3 mt-8">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-16 bg-zinc-800 rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Разблокированный контент */}
          {accessToken && (
            <iframe
              src={`/api/shop/presentation/${id}?token=${accessToken}`}
              className="w-full"
              style={{ minHeight: "500px", height: "80vh", border: "none" }}
              title={presentation.title}
              sandbox="allow-scripts allow-same-origin"
            />
          )}

          {/* Оверлей с формой ввода кода — поверх блюра */}
          {!accessToken && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backdropFilter: "blur(2px)" }}
            >
              <div className="bg-zinc-900/95 border border-zinc-700 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
                {/* Иконка замка */}
                <div className="flex justify-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                </div>

                <h2 className="text-center text-lg font-semibold text-white mb-1">
                  Доступ по коду
                </h2>
                <p className="text-center text-sm text-zinc-400 mb-6">
                  Введи код, который ты получила при покупке
                </p>

                <form onSubmit={handleSubmitCode} className="space-y-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    maxLength={20}
                    disabled={status === "loading"}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-lg tracking-widest font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                    autoFocus
                  />

                  {status === "error" && (
                    <p className="text-sm text-red-400 text-center">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading" || !code.trim()}
                    className="w-full bg-white text-zinc-950 font-semibold rounded-lg px-4 py-3 hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {status === "loading" ? "Проверяем..." : "Открыть презентацию"}
                  </button>
                </form>

                <p className="text-center text-xs text-zinc-600 mt-4">
                  Нет кода?{" "}
                  <a href="mailto:your@email.com" className="text-zinc-400 hover:text-white underline">
                    Написать мне
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Инфо под презентацией */}
        {!accessToken && (
          <div className="mt-4 text-center text-sm text-zinc-500">
            Цена: <span className="text-zinc-300 font-medium">{presentation.price} ₽</span>
            {" · "}
            Доступ на 30 дней с момента первого ввода кода
          </div>
        )}
      </main>
    </div>
  );
}
