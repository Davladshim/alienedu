"use client";

import { useState, useEffect } from "react";
import { daysWord, daysLeftFrom } from "@/lib/adminFormat";

type Presentation = {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  grade: number;
  price: number;
  content_path: string;
  preview_image: string | null;
  is_active: boolean;
  created_at: string;
  content_description: string | null;
};

type Code = {
  id: number;
  code: string;
  status: string;
  first_used_at: string | null;
  valid_days: number;
  created_at: string;
  presentation_title: string | null;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--t-bg)",
  border: "1px solid var(--t-border)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "var(--t-text)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  color: "var(--t-text-secondary)",
  marginBottom: "4px",
};

const cardStyle: React.CSSProperties = {
  background: "var(--t-card)",
  border: "1px solid var(--t-border)",
  borderRadius: "16px",
  padding: "1.5rem",
};

const btnGhostStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--t-border)",
  color: "var(--t-text-secondary)",
  borderRadius: "8px",
  padding: "6px 14px",
  fontSize: "13px",
  cursor: "pointer",
};

const btnDangerStyle: React.CSSProperties = {
  background: "rgba(var(--t-danger-rgb),0.12)",
  color: "var(--t-danger-soft)",
  border: "1px solid rgba(var(--t-danger-rgb),0.3)",
  borderRadius: "6px",
  padding: "5px 12px",
  fontSize: "12px",
  cursor: "pointer",
};

function primaryBtnStyle(disabled: boolean, gradient = "linear-gradient(135deg, var(--t-accent), var(--t-accent2))"): React.CSSProperties {
  return {
    background: disabled ? "var(--t-border)" : gradient,
    color: disabled ? "var(--t-text-muted)" : "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function buildPresentationCodeMessage(code: string, presentationTitle: string, validDays: number): string {
  return [
    `Вы получили код доступа к презентации «${presentationTitle}» на ${validDays} ${daysWord(validDays)}.`,
    `Код: ${code}`,
    ``,
    `Никому его не передавайте — он одноразовый.`,
    `Отсчёт срока начнётся с момента активации: введите код на странице презентации в разделе «Магазин».`,
  ].join("\n");
}

function buildSubscriptionCodeMessage(code: string, validDays: number): string {
  return [
    `Вы получили код подписки на весь магазин презентаций на ${validDays} ${daysWord(validDays)}.`,
    `Код: ${code}`,
    ``,
    `Никому его не передавайте — он одноразовый.`,
    `Отсчёт срока начнётся с момента активации: введите код в разделе «Магазин».`,
  ].join("\n");
}

export default function ShopAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"presentations" | "add" | "codes" | "edit">("presentations");
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [selectedPresId, setSelectedPresId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", subject: "", grade: "", price: "", htmlCode: "",
  });

  const [codeForm, setCodeForm] = useState({ presentationId: "", count: "1", validDays: "10" });
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [subForm, setSubForm] = useState({ count: "1", validDays: "30" });
  const [newSubCodes, setNewSubCodes] = useState<string[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function copyCode(code: string, message: string) {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
    } catch {}
  }

  useEffect(() => {
    fetch("/api/admin-presentations-shop")
      .then((r) => { if (r.ok) { setIsLoggedIn(true); loadPresentations(); } })
      .catch(() => {});
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin-login-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsLoggedIn(true);
      loadPresentations();
    } else {
      setLoginError("Неверный пароль");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin-login-shop", { method: "DELETE" });
    setIsLoggedIn(false);
    setPassword("");
  }

  async function loadPresentations() {
    const res = await fetch("/api/admin-presentations-shop");
    if (res.ok) setPresentations(await res.json());
  }

  async function loadCodes(presentationId?: number) {
    const url = presentationId
      ? `/api/admin-codes-shop?presentationId=${presentationId}`
      : "/api/admin-codes-shop";
    const res = await fetch(url);
    if (res.ok) setCodes(await res.json());
  }

  async function handleAddPresentation(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin-presentations-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        subject: form.subject,
        grade: Number(form.grade),
        price: Number(form.price),
        htmlCode: form.htmlCode,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setMessage("✅ Презентация добавлена!");
      setForm({ title: "", description: "", subject: "", grade: "", price: "", htmlCode: "" });
      loadPresentations();
      setTab("presentations");
    } else {
      setMessage(`❌ ${json.error}`);
    }
    setLoading(false);
  }

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNewCodes([]);
    const res = await fetch("/api/admin-codes-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presentationId: Number(codeForm.presentationId),
        count: Number(codeForm.count),
        validDays: Number(codeForm.validDays),
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setNewCodes(json.codes);
      loadCodes(Number(codeForm.presentationId));
    }
    setLoading(false);
  }

  async function handleGenerateSubCodes(e: React.FormEvent) {
    e.preventDefault();
    setSubLoading(true);
    setNewSubCodes([]);
    const res = await fetch("/api/admin-codes-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presentationId: null,
        count: Number(subForm.count),
        validDays: Number(subForm.validDays),
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setNewSubCodes(json.codes);
      loadCodes(selectedPresId ?? undefined);
    }
    setSubLoading(false);
  }

  async function handleRevokeCode(codeId: number) {
    await fetch("/api/admin-codes-shop", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codeId }),
    });
    loadCodes(selectedPresId ?? undefined);
  }

  async function handleDeletePresentation(id: number) {
    if (!confirm('Удалить презентацию? Все коды доступа к ней тоже будут удалены.')) return
    const res = await fetch('/api/admin-presentations-shop', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) loadPresentations()
  }

  if (!isLoggedIn) {
    return (
      <div style={{ position: "fixed", inset: 0, overflow: "auto", display: "flex", background: "var(--t-bg)", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ ...cardStyle, width: "100%", maxWidth: "380px", margin: "auto", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🛍️</div>
          <h1 style={{ color: "var(--t-text)", fontSize: "20px", fontWeight: 600, margin: "0 0 4px" }}>Магазин</h1>
          <div style={{ color: "var(--t-text-muted)", fontSize: "13px", marginBottom: "1.5rem" }}>Панель управления</div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              style={{ ...inputStyle, marginBottom: "12px" }}
              autoFocus
            />
            {loginError && <div style={{ color: "var(--t-danger)", fontSize: "13px", marginBottom: "12px" }}>{loginError}</div>}
            <button type="submit" style={{ width: "100%", ...primaryBtnStyle(false) }}>
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--t-bg)", fontFamily: "system-ui, sans-serif", color: "var(--t-text)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "900px", padding: "2rem" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>🛍️ Магазин — админка</h1>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <a href="/shop" target="_blank" rel="noopener noreferrer" style={{ color: "var(--t-text-muted)", fontSize: "13px", textDecoration: "none" }}>← магазин</a>
            <button onClick={handleLogout} style={btnGhostStyle}>Выйти</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          {([
            ["presentations", "Презентации"],
            ["add", "+ Добавить"],
            ["codes", "Коды доступа"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); if (key === "presentations") loadPresentations(); if (key === "codes") loadCodes(); }}
              style={{
                padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
                border: tab === key ? "1px solid var(--t-accent)" : "1px solid var(--t-border)",
                background: tab === key ? "rgba(var(--t-accent-rgb),0.15)" : "var(--t-card)",
                color: tab === key ? "var(--t-accent)" : "var(--t-text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "presentations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {presentations.length === 0 && <div style={{ color: "var(--t-text-faint)", fontSize: "13px" }}>Презентаций пока нет</div>}
            {presentations.map((p) => (
              <div key={p.id} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>{p.title}</div>
                    <div style={{ color: "var(--t-text-muted)", fontSize: "13px" }}>
                      {p.subject} · {p.grade} класс · {p.price} ₽
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <a href={`/shop/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ ...btnGhostStyle, textDecoration: "none" }}>
                      Открыть →
                    </a>
                    <button style={btnGhostStyle} onClick={() => { setEditingPresentation(p); setTab("edit"); }}>
                      Редактировать
                    </button>
                    <button style={btnGhostStyle} onClick={() => { setCodeForm({ ...codeForm, presentationId: String(p.id) }); setSelectedPresId(p.id); setTab("codes"); loadCodes(p.id); }}>
                      Коды
                    </button>
                    <button style={btnDangerStyle} onClick={() => handleDeletePresentation(p.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "add" && (
          <div style={cardStyle}>
            <form onSubmit={handleAddPresentation}>
              <label style={labelStyle}>Название *</label>
              <input style={{ ...inputStyle, marginBottom: "12px" }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Алгебра 6 класс — повторение" required />

              <label style={labelStyle}>Описание</label>
              <input style={{ ...inputStyle, marginBottom: "12px" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Краткое описание для карточки в магазине" />

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Предмет *</label>
                  <select style={{ ...inputStyle, marginBottom: "12px", cursor: "pointer" }} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                    <option value="">Выбери предмет</option>
                    <option>Математика</option>
                    <option>Алгебра</option>
                    <option>Геометрия</option>
                    <option>Вероятность и статистика</option>
                    <option>Физика</option>
                    <option>Химия</option>
                    <option>Биология</option>
                    <option>Информатика</option>
                    <option>Русский язык</option>
                    <option>Литература</option>
                    <option>Английский язык</option>
                    <option>История</option>
                    <option>Обществознание</option>
                    <option>География</option>
                    <option>Черчение</option>
                    <option>Астрономия</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Класс *</label>
                  <select style={{ ...inputStyle, marginBottom: "12px", cursor: "pointer" }} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required>
                    <option value="">Выбери класс</option>
                    {[5,6,7,8,9,10,11].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Цена (₽) *</label>
                  <input style={{ ...inputStyle, marginBottom: "12px" }} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="299" required />
                </div>
              </div>

              <label style={labelStyle}>HTML код презентации *</label>
              <textarea
                style={{ ...inputStyle, height: "300px", fontFamily: "monospace", fontSize: "13px", resize: "vertical", marginBottom: "12px" }}
                value={form.htmlCode}
                onChange={(e) => setForm({ ...form, htmlCode: e.target.value })}
                placeholder="Вставь сюда весь HTML код презентации..."
                required
              />

              {message && (
                <p style={{ marginBottom: "12px", color: message.startsWith("✅") ? "var(--t-success)" : "var(--t-danger)", fontSize: "13px" }}>
                  {message}
                </p>
              )}

              <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
                {loading ? "Загружаем..." : "Добавить презентацию"}
              </button>
            </form>
          </div>
        )}

        {tab === "codes" && (
          <div>
            <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px" }}>Сгенерировать коды на презентацию</div>
              <p style={{ color: "var(--t-text-muted)", fontSize: "12px", marginBottom: "14px" }}>
                Код открывает доступ к одной выбранной презентации на указанный срок.
              </p>
              <form onSubmit={handleGenerateCodes} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div style={{ flex: 2, minWidth: "200px" }}>
                  <label style={labelStyle}>Презентация *</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={codeForm.presentationId} onChange={(e) => setCodeForm({ ...codeForm, presentationId: e.target.value })} required>
                    <option value="">Выбери презентацию</option>
                    {presentations.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <label style={labelStyle}>Количество кодов</label>
                  <input style={inputStyle} type="number" min="1" max="50" value={codeForm.count} onChange={(e) => setCodeForm({ ...codeForm, count: e.target.value })} />
                </div>
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <label style={labelStyle}>Срок действия (дней)</label>
                  <input style={inputStyle} type="number" min="1" value={codeForm.validDays} onChange={(e) => setCodeForm({ ...codeForm, validDays: e.target.value })} />
                </div>
                <div style={{ alignSelf: "flex-end" }}>
                  <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
                    {loading ? "Генерируем..." : "Сгенерировать"}
                  </button>
                </div>
              </form>
              {newCodes.length > 0 && (
                <div style={{ background: "var(--t-bg)", border: "1px solid var(--t-accent)", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ color: "var(--t-success)", fontSize: "12px", marginBottom: "8px" }}>✓ Новые коды:</div>
                  {newCodes.map((c) => {
                    const presTitle = presentations.find((p) => p.id === Number(codeForm.presentationId))?.title || "";
                    const message = buildPresentationCodeMessage(c, presTitle, Number(codeForm.validDays));
                    return (
                      <div key={c} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <div style={{ fontFamily: "monospace", fontSize: "15px", letterSpacing: "1px" }}>{c}</div>
                        <button
                          onClick={() => copyCode(c, message)}
                          style={{
                            background: copiedCode === c ? "rgba(var(--t-success-rgb),0.15)" : "rgba(var(--t-accent-rgb),0.15)",
                            border: `1px solid ${copiedCode === c ? "var(--t-success)" : "var(--t-accent)"}`,
                            color: copiedCode === c ? "var(--t-success)" : "var(--t-accent)",
                            borderRadius: "6px", padding: "3px 10px", fontSize: "12px", cursor: "pointer", fontWeight: 600,
                          }}
                        >
                          {copiedCode === c ? "✓ Скопировано" : "📋 Скопировать"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ ...cardStyle, marginBottom: "1.5rem", border: "1px solid var(--t-sub-border)" }}>
              <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px", color: "var(--t-warning)" }}>⭐ Подписка на весь магазин</div>
              <p style={{ color: "var(--t-sub-text)", fontSize: "12px", marginBottom: "14px" }}>
                Один такой код открывает сразу все презентации магазина на указанный срок.
              </p>
              <form onSubmit={handleGenerateSubCodes} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <label style={labelStyle}>Количество кодов</label>
                  <input style={inputStyle} type="number" min="1" max="50" value={subForm.count} onChange={(e) => setSubForm({ ...subForm, count: e.target.value })} />
                </div>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <label style={labelStyle}>Срок действия (дней)</label>
                  <input style={inputStyle} type="number" min="1" value={subForm.validDays} onChange={(e) => setSubForm({ ...subForm, validDays: e.target.value })} />
                </div>
                <div style={{ alignSelf: "flex-end" }}>
                  <button
                    type="submit"
                    disabled={subLoading}
                    style={primaryBtnStyle(subLoading, "linear-gradient(135deg, var(--t-sub-gradient-start), var(--t-sub-gradient-end))")}
                  >
                    {subLoading ? "Генерируем..." : "Сгенерировать подписку"}
                  </button>
                </div>
              </form>
              {newSubCodes.length > 0 && (
                <div style={{ background: "var(--t-bg)", border: "1px solid var(--t-sub-gradient-start)", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ color: "var(--t-warning)", fontSize: "12px", marginBottom: "8px" }}>⭐ Новые коды подписки:</div>
                  {newSubCodes.map((c) => {
                    const message = buildSubscriptionCodeMessage(c, Number(subForm.validDays));
                    return (
                      <div key={c} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <div style={{ fontFamily: "monospace", fontSize: "15px", letterSpacing: "1px" }}>{c}</div>
                        <button
                          onClick={() => copyCode(c, message)}
                          style={{
                            background: copiedCode === c ? "rgba(var(--t-success-rgb),0.15)" : "rgba(var(--t-warning-rgb),0.15)",
                            border: `1px solid ${copiedCode === c ? "var(--t-success)" : "var(--t-sub-gradient-start)"}`,
                            color: copiedCode === c ? "var(--t-success)" : "var(--t-warning)",
                            borderRadius: "6px", padding: "3px 10px", fontSize: "12px", cursor: "pointer", fontWeight: 600,
                          }}
                        >
                          {copiedCode === c ? "✓ Скопировано" : "📋 Скопировать"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ color: "var(--t-text-muted)", fontSize: "12px" }}>История кодов</div>
                <select
                  style={{ ...inputStyle, width: "auto", minWidth: "220px" }}
                  value={selectedPresId ?? ""}
                  onChange={(e) => { const val = e.target.value ? Number(e.target.value) : null; setSelectedPresId(val); loadCodes(val ?? undefined); }}
                >
                  <option value="">Все презентации</option>
                  {presentations.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              {codes.length === 0 ? (
                <div style={{ color: "var(--t-text-faint)", fontSize: "13px" }}>Кодов пока нет</div>
              ) : (
                <div style={{ overflowX: "auto", maxHeight: "360px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", whiteSpace: "nowrap" }}>
                    <thead>
                      <tr>
                        {["Код", "Презентация", "Дата активации", "Срок", "Осталось", "Статус"].map((h) => (
                          <th key={h} style={{
                            position: "sticky", top: 0, background: "var(--t-card)", textAlign: "left",
                            color: "var(--t-text-muted)", fontWeight: 500, fontSize: "11px", textTransform: "uppercase",
                            padding: "6px 10px", borderBottom: "1px solid var(--t-border)",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c) => {
                        const isSub = c.presentation_title === null;
                        const daysLeft = c.first_used_at ? daysLeftFrom(c.first_used_at, c.valid_days) : null;
                        const statusColor = c.status !== "active" ? "var(--t-text-muted)" : c.first_used_at ? "var(--t-success)" : "var(--t-info)";
                        const statusLabel = c.status !== "active" ? "отозван" : c.first_used_at ? "активирован" : "не использован";
                        return (
                          <tr key={c.id} style={{ borderBottom: "1px solid var(--t-border)" }}>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>{c.code}</td>
                            <td style={{ padding: "8px 10px", color: isSub ? "var(--t-warning)" : "var(--t-text-secondary)" }}>
                              {isSub ? "⭐ Весь магазин" : c.presentation_title}
                            </td>
                            <td style={{ padding: "8px 10px", color: "var(--t-text-secondary)" }}>
                              {c.first_used_at ? new Date(c.first_used_at).toLocaleDateString("ru-RU") : "—"}
                            </td>
                            <td style={{ padding: "8px 10px", color: "var(--t-text-secondary)" }}>{c.valid_days} дн.</td>
                            <td style={{ padding: "8px 10px", color: "var(--t-text-secondary)" }}>
                              {daysLeft === null ? "—" : daysLeft > 0 ? `${daysLeft} ${daysWord(daysLeft)}` : "истёк"}
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <span style={{ color: statusColor }}>{statusLabel}</span>
                              {c.status === "active" && (
                                <button
                                  onClick={() => handleRevokeCode(c.id)}
                                  style={{ marginLeft: "10px", background: "none", border: "none", color: "var(--t-text-muted)", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
                                >
                                  отозвать
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "edit" && editingPresentation && (
          <EditPresentation
            presentation={editingPresentation}
            onSave={async (updated) => {
              const res = await fetch("/api/admin-presentations-shop", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
              });
              if (res.ok) {
                loadPresentations();
                setTab("presentations");
              }
            }}
            onCancel={() => setTab("presentations")}
          />
        )}
      </div>
    </div>
  );
}

type EditPresentationUpdate = {
  id: number;
  title: string;
  description: string;
  subject: string;
  grade: number;
  price: number;
  is_active: boolean;
  preview_image: string;
  content_description: string;
};

function EditPresentation({ presentation, onSave, onCancel }: {
  presentation: Presentation;
  onSave: (updated: EditPresentationUpdate) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    id: presentation.id,
    title: presentation.title,
    description: presentation.description ?? "",
    subject: presentation.subject,
    grade: String(presentation.grade),
    price: String(presentation.price),
    is_active: presentation.is_active,
    preview_image: presentation.preview_image ?? "",
    content_description: presentation.content_description ?? "",
  });

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "16px" }}>Редактировать презентацию</div>

      <label style={labelStyle}>Название</label>
      <input style={{ ...inputStyle, marginBottom: "12px" }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

      <label style={labelStyle}>Описание</label>
      <input style={{ ...inputStyle, marginBottom: "12px" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

      <label style={labelStyle}>Содержание (каждый пункт с новой строки)</label>
      <textarea
        style={{ ...inputStyle, height: "120px", fontSize: "13px", resize: "vertical", marginBottom: "12px" }}
        value={form.content_description ?? ""}
        onChange={(e) => setForm({ ...form, content_description: e.target.value })}
        placeholder={"1. Понятие дроби\n2. Основное свойство дроби\n3. Сокращение дробей"}
      />

      <label style={labelStyle}>Имя файла превью (например: preview-1.jpg)</label>
      <input style={{ ...inputStyle, marginBottom: "4px" }} value={form.preview_image ?? ""} onChange={(e) => setForm({ ...form, preview_image: e.target.value })} placeholder="preview_image" />
      <div style={{ color: "var(--t-text-faint)", fontSize: "12px", marginBottom: "12px" }}>Загрузи файл в Supabase Storage → бакет previews, потом укажи имя здесь</div>

      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Предмет</label>
          <select style={{ ...inputStyle, marginBottom: "12px", cursor: "pointer" }} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
            <option>Математика</option>
            <option>Физика</option>
            <option>Химия</option>
            <option>Информатика</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Класс</label>
          <select style={{ ...inputStyle, marginBottom: "12px", cursor: "pointer" }} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
            {[5,6,7,8,9,10,11].map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Цена (₽)</label>
          <input style={{ ...inputStyle, marginBottom: "12px" }} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "14px", color: "var(--t-text-secondary)" }}>
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Показывать в магазине
      </label>

      <div style={{ display: "flex", gap: "12px" }}>
        <button style={primaryBtnStyle(false)} onClick={() => onSave({ ...form, grade: Number(form.grade), price: Number(form.price) })}>
          Сохранить
        </button>
        <button style={btnGhostStyle} onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
