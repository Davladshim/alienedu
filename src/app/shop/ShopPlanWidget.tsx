"use client";

import { useEffect, useState } from "react";

function daysWord(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}

// Баннер тарифа наверху магазина — по оформлению и логике "свечения" при
// скором истечении повторяет PlanWidget с платформы (src/components/PlanWidget.tsx)
export default function ShopPlanWidget() {
  const [active, setActive] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function loadStatus() {
    fetch("/api/shop-subscription-status")
      .then((r) => r.json())
      .then((data) => {
        setActive(!!data.active);
        setDaysLeft(data.daysLeft ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function redeem() {
    if (!code.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/verify-code-shop-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setActive(true);
      setDaysLeft(data.daysLeft ?? null);
      setCode("");
      setMsg({ text: "Полный доступ активирован", ok: true });
    } else {
      setMsg({ text: data.error || "Ошибка", ok: false });
    }
  }

  if (!loaded) return null;

  // Скоро истекает — подсвечиваем свечением, чтобы напомнить о продлении
  const expiringSoon = active && daysLeft !== null && daysLeft <= 5;

  return (
    <div
      style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
        background: "var(--t-card)", border: "1px solid var(--t-border)", borderRadius: 14,
        padding: "16px 20px", marginBottom: 28,
      }}
    >
      {expiringSoon && (
        <style>{`
          @keyframes shop-plan-widget-glow {
            0%, 100% { text-shadow: 0 0 0 rgba(var(--t-warning-rgb), 0); }
            50% { text-shadow: 0 0 8px rgba(var(--t-warning-rgb), 0.9); }
          }
        `}</style>
      )}

      <div>
        <div style={{ fontSize: "0.7rem", color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          Тариф
        </div>
        <div style={
          expiringSoon
            ? { color: "var(--t-warning)", fontWeight: 700, fontSize: "0.95rem", animation: "shop-plan-widget-glow 1.6s ease-in-out infinite" }
            : { color: "var(--t-text)", fontWeight: 600, fontSize: "0.95rem" }
        }>
          {active ? "Полный доступ" : "Бесплатный"}
          {active && daysLeft !== null && ` (осталось ${daysLeft} ${daysWord(daysLeft)})`}
        </div>
        <div style={{ color: "var(--t-text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
          {active ? "Открыты все презентации целиком" : "Первые 3 слайда каждой презентации — бесплатно"}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && redeem()}
            placeholder="Код доступа"
            style={{
              width: 150, background: "var(--t-bg)", border: "1px solid var(--t-border)", borderRadius: 8,
              padding: "8px 12px", color: "var(--t-text)", fontSize: "0.85rem", outline: "none",
              fontFamily: "monospace", letterSpacing: "0.05em", boxSizing: "border-box",
            }}
          />
          <button
            onClick={redeem}
            disabled={busy || !code.trim()}
            style={{
              background: busy || !code.trim() ? "var(--t-border)" : "linear-gradient(135deg, var(--t-accent), var(--t-accent2))",
              color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px",
              fontSize: "0.85rem", fontWeight: 600, cursor: busy || !code.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "Проверяем..." : "Активировать"}
          </button>
        </div>
        {msg && (
          <div style={{ fontSize: "0.8rem", marginTop: 6, textAlign: "right", color: msg.ok ? "var(--t-success)" : "var(--t-danger-soft)" }}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
