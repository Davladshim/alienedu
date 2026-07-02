"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";

type SlideData = { title: string; text: string };
type ShapeData = {
  top: string; left: string;
  bg: string; radius: string;
  clip: string; transform: string;
  shadow: string;
};
type PresentationData = {
  id: number;
  title: string;
  subject: string;
  grade: number;
  price: number;
  slides: SlideData[];
  shapes: ShapeData[];
};

const FREE_SLIDES = 3;

export default function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [data, setData] = useState<PresentationData | null | "loading">("loading");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Проверяем admin доступ
    const urlParams = new URLSearchParams(window.location.search);
    const adminSecret = urlParams.get("admin");

    fetch(`/api/presentation-meta-shop/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setData(null); return; }
        setData(json);
      })
      .catch(() => setData(null));

    if (adminSecret) {
      setToken(`admin_${adminSecret}`);
      setIsUnlocked(true);
      setShowFull(true);
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/verify-code-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), presentationId: id }),
      });
      const json = await res.json();
      if (res.ok && json.token) {
        setToken(json.token);
        setIsUnlocked(true);
        setShowPaywall(false);
        setShowFull(true);
      } else {
        setStatus("error");
        setErrorMsg(json.error || "Неверный код");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Ошибка соединения");
    } finally {
      setStatus("idle");
    }
  }

  function goNext() {
    if (!data || data === "loading") return;
    const totalSlides = (data as PresentationData).slides.length;
    if (currentSlide >= FREE_SLIDES - 1 && !isUnlocked) {
      setShowPaywall(true);
      return;
    }
    if (currentSlide < totalSlides - 1) setCurrentSlide(currentSlide + 1);
  }

  function goPrev() {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  }

  // Загрузка
  if (data === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6b7280", fontSize: "1rem" }}>Загрузка...</div>
      </div>
    );
  }

  // Не найдено
  if (data === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: 16 }}>Презентация не найдена</p>
          <Link href="/shop" style={{ color: "#60a5fa", textDecoration: "none" }}>← вернуться в магазин</Link>
        </div>
      </div>
    );
  }

  const presentation = data as PresentationData;
  const totalSlides = presentation.slides.length;
  const slide = presentation.slides[currentSlide];
  const shape = presentation.shapes[currentSlide] ?? presentation.shapes[0];

  // Полная презентация через iframe
  if (showFull) {
    const src = token.startsWith("admin_")
      ? `/api/presentation-shop/${id}?admin=${token.replace("admin_", "")}`
      : `/api/presentation-shop/${id}?token=${token}`;

    return (
      <div style={{ width: "100vw", height: "100vh", background: "#0b0f19", overflow: "hidden" }}>
        <iframe
          src={src}
          style={{ width: "100%", height: "100%", border: "none" }}
          title={presentation.title}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: "100vw", height: "100vh", background: "#0b0f19", overflow: "hidden", position: "relative", fontFamily: "'Segoe UI', Roboto, sans-serif" }}
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).id === "code-input") return;
        if (e.key === "ArrowRight") goNext();
        if (e.key === "ArrowLeft") goPrev();
      }}
    >
      {/* Морфинг-фигура */}
      <div style={{
        position: "absolute",
        width: 220, height: 220,
        top: shape.top, left: shape.left,
        backgroundColor: shape.bg,
        borderRadius: shape.radius,
        clipPath: shape.clip === "none" ? undefined : shape.clip,
        transform: shape.transform,
        boxShadow: shape.shadow,
        zIndex: 1,
        pointerEvents: "none",
        transition: "top 1.2s cubic-bezier(0.77,0,0.175,1), left 1.2s cubic-bezier(0.77,0,0.175,1), background-color 1.2s ease, border-radius 1.2s ease, clip-path 1.2s cubic-bezier(0.77,0,0.175,1), transform 1.2s cubic-bezier(0.77,0,0.175,1), box-shadow 1.2s ease",
      }} />

      {/* Слайд */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
        <div style={{ textAlign: "center", padding: "0 80px" }}>
          <div style={{ fontSize: "0.75rem", color: "#52525b", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>
            {String(currentSlide + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 700, letterSpacing: "-2px", color: "#fff", marginBottom: 16 }}>
            {slide.title}
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#a1a1aa", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            {slide.text}
          </p>
        </div>
      </div>

      {/* Ссылка назад */}
      <Link href="/shop" style={{ position: "absolute", top: 24, left: 24, color: "#4b5563", fontSize: "0.82rem", textDecoration: "none", zIndex: 10 }}>
        ← в магазин
      </Link>

      {/* Стрелки */}
      {currentSlide > 0 && (
        <button onClick={goPrev} style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 48, height: 48, borderRadius: "50%", border: "1px solid #1e2029", background: "#12131a", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      )}

      <button onClick={goNext} style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 48, height: 48, borderRadius: "50%", border: "1px solid #1e2029", background: "#12131a", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentSlide === totalSlides - 1 && isUnlocked ? 0.3 : 1 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Счётчик */}
      <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: i === currentSlide ? "#fff" : (i >= FREE_SLIDES && !isUnlocked ? "#1e2029" : "#3f3f46"),
            transform: i === currentSlide ? "scale(1.3)" : "scale(1)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Paywall */}
      {showPaywall && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,15,25,0.97)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1e2029", border: "1px solid #2a2d3a", borderRadius: 20, padding: 48, maxWidth: 400, width: "90%", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "#12131a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8, color: "#fff" }}>Доступ закрыт</h2>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: 32, lineHeight: 1.6 }}>
              Первые 3 слайда доступны бесплатно.<br />Введи код чтобы открыть всю презентацию.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                id="code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                maxLength={20}
                style={{ width: "100%", background: "#0b0f19", border: "1px solid #3f3f46", borderRadius: 10, padding: 14, color: "#fff", fontSize: "1.1rem", textAlign: "center", letterSpacing: "0.15em", fontFamily: "monospace", marginBottom: 12, outline: "none", boxSizing: "border-box" }}
              />
              {status === "error" && (
                <p style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: 12 }}>{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading" || !code.trim()}
                style={{ width: "100%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: "1rem", fontWeight: 600, cursor: "pointer", marginBottom: 16, opacity: status === "loading" ? 0.6 : 1 }}
              >
                {status === "loading" ? "Проверяем..." : "Открыть презентацию"}
              </button>
            </form>
            <button onClick={() => setShowPaywall(false)} style={{ background: "none", border: "none", color: "#4b5563", fontSize: "0.85rem", cursor: "pointer" }}>
              ← вернуться к слайдам
            </button>
            <div style={{ marginTop: 12, fontSize: "0.8rem", color: "#4b5563" }}>
              Нет кода?{" "}
              <a href="https://t.me/darya_shim" target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280", textDecoration: "underline" }}>Написать в Telegram</a>
              {" · "}
              <a href="https://vk.com/darya_shim" target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280", textDecoration: "underline" }}>ВКонтакте</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}