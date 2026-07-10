"use client";

import { use, useEffect, useRef, useState } from "react";

const FREE_SLIDES = 3;

export default function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const slideCountRef = useRef(0);

  useEffect(() => {
      async function loadPresentation() {
        try {
          const res = await fetch(`/api/presentation-shop/${id}`);
          if (!res.ok) return;
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          doc.querySelectorAll("style").forEach(el => {
            document.head.appendChild(document.adoptNode(el));
          });
          doc.querySelectorAll("link[rel='stylesheet']").forEach(el => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = (el as HTMLLinkElement).href;
            document.head.appendChild(link);
          });
          if (containerRef.current) {
            containerRef.current.innerHTML = doc.body.innerHTML;
          }
          doc.querySelectorAll("script").forEach(oldScript => {
            const newScript = document.createElement("script");
            if (oldScript.src) {
              newScript.src = oldScript.src;
              newScript.async = false;
            } else {
              newScript.textContent = oldScript.textContent;
            }
            document.body.appendChild(newScript);
          });
          setTimeout(() => {
            setupPaywallInterceptor();
          }, 500);
        } catch (err) {
          console.error("Ошибка загрузки:", err);
        }
      }

      async function checkAccess() {
        const res = await fetch(`/api/check-access-shop?presentationId=${id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.hasAccess) {
            slideCountRef.current = -999;
          }
        }
      }

      loadPresentation();
      checkAccess();
    }, [id]);

  function setupPaywallInterceptor() {
    // Перехватываем кнопку nextBtn
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        slideCountRef.current++;
        if (slideCountRef.current >= FREE_SLIDES) {
          e.stopImmediatePropagation();
          e.preventDefault();
          setShowPaywall(true);
          return;
        }
      }, true);
    }

    // Перехватываем клавиатуру
    document.addEventListener("keydown", (e) => {
      if (showPaywall) return;
      if ((e.key === "ArrowRight" || e.key === " ") && slideCountRef.current >= FREE_SLIDES) {
        e.stopImmediatePropagation();
        e.preventDefault();
        setShowPaywall(true);
        return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        slideCountRef.current++;
        if (slideCountRef.current >= FREE_SLIDES) {
          e.stopImmediatePropagation();
          e.preventDefault();
          setShowPaywall(true);
        }
      }
    }, true);
  }

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
        await fetch("/api/grant-access-shop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: json.token, presentationId: id }),
        });
        setShowPaywall(false);
        slideCountRef.current = -999;
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

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#020610", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Paywall overlay */}
      {showPaywall && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(2, 6, 16, 0.97)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 99999,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>
          <div style={{
            background: "#1e2029",
            border: "1px solid #2a2d3a",
            borderRadius: 20, padding: 48,
            maxWidth: 400, width: "90%",
            textAlign: "center",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}>
            <div style={{ width: 56, height: 56, background: "#12131a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>Доступ закрыт</h2>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: 32, lineHeight: 1.6 }}>
              Первые {FREE_SLIDES} слайда доступны бесплатно.<br />Введи код чтобы открыть всю презентацию.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                maxLength={20}
                style={{
                  width: "100%", background: "#0b0f19",
                  border: "1px solid #3f3f46", borderRadius: 10,
                  padding: 14, color: "#fff", fontSize: "1.1rem",
                  textAlign: "center", letterSpacing: "0.15em",
                  fontFamily: "monospace", marginBottom: 12,
                  outline: "none", boxSizing: "border-box",
                }}
              />
              {status === "error" && (
                <p style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: 12 }}>{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading" || !code.trim()}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: 14, fontSize: "1rem", fontWeight: 600,
                  cursor: "pointer", marginBottom: 16,
                  opacity: status === "loading" ? 0.6 : 1,
                }}
              >
                {status === "loading" ? "Проверяем..." : "Открыть презентацию"}
              </button>
            </form>
            <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>
              Нет кода?{" "}
              <a href="https://t.me/darya_shim" target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280", textDecoration: "underline" }}>Telegram</a>
              {" · "}
              <a href="https://vk.com/alientutor_for_tutors" target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280", textDecoration: "underline" }}>ВКонтакте</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}