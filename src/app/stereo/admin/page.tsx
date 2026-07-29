"use client";

import { useEffect, useState } from "react";

interface Model {
  id: number;
  label: string;
}

interface StereoCode {
  id: number;
  code: string;
  status: string;
  first_used_at: string | null;
  valid_days: number;
  created_at: string;
}

export default function StereoAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"tasks" | "codes">("tasks");
  const [models, setModels] = useState<Model[]>([]);
  const [codes, setCodes] = useState<StereoCode[]>([]);
  const [codeCount, setCodeCount] = useState("1");
  const [codeValidDays, setCodeValidDays] = useState("30");
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState("");
  const [solution, setSolution] = useState("");
  const [answer, setAnswer] = useState("");
  const [modelId, setModelId] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [difficulty, setDifficulty] = useState("1");
  const [isFree, setIsFree] = useState(false);
  const [textbook, setTextbook] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/stereo-models-list")
      .then((res) => {
        if (res.ok) {
          setIsLoggedIn(true);
          return res.json();
        }
        return { models: [] };
      })
      .then((data) => setModels(data.models || []));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/stereo-admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsLoggedIn(true);
      const modelsRes = await fetch("/api/stereo-models-list");
      const data = await modelsRes.json();
      setModels(data.models || []);
    } else {
      setLoginError("Неверный пароль");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/stereo-admin-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          condition,
          solution,
          answer,
          model_id: modelId ? Number(modelId) : null,
          topic,
          grade: grade ? Number(grade) : null,
          difficulty: Number(difficulty),
          is_free: isFree,
          textbook,
          authors,
          year: year ? Number(year) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Ошибка");
        setSaving(false);
        return;
      }

      setMessage("Задача добавлена!");
      setTitle("");
      setCondition("");
      setSolution("");
      setAnswer("");
      setModelId("");
      setTopic("");
      setGrade("");
      setDifficulty("1");
      setIsFree(false);
      setTextbook("");
      setAuthors("");
      setYear("");
      setSaving(false);
    } catch {
      setMessage("Не удалось подключиться к серверу");
      setSaving(false);
    }
  }

  async function loadCodes() {
    setCodesLoading(true);
    const res = await fetch("/api/stereo-admin-codes");
    if (res.ok) setCodes(await res.json());
    setCodesLoading(false);
  }

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    setCodesLoading(true);
    setNewCodes([]);
    const res = await fetch("/api/stereo-admin-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: Number(codeCount), validDays: Number(codeValidDays) }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewCodes(data.codes);
      loadCodes();
    }
    setCodesLoading(false);
  }

  async function handleRevokeCode(codeId: number) {
    await fetch("/api/stereo-admin-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codeId }),
    });
    loadCodes();
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#1f2937",
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 4,
  };

  if (!isLoggedIn) {
    return (
      <div style={{ position: "fixed", inset: 0, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117" }}>
        <div style={{ background: "#1e2029", border: "1px solid #2a2d3a", borderRadius: 16, padding: 48, width: 360, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💎</div>
          <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 4, color: "#fff" }}>
            StereoSpace
          </div>
          <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 32 }}>
            Панель управления
          </div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              style={{
                width: "100%",
                background: "#12131a",
                border: "1px solid #2a2d3a",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
              }}
              autoFocus
            />
            {loginError && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{loginError}</p>}
            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  const badgeStyle = (status: string) => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: "0.72rem",
    background: status === "active" ? "rgba(16,185,129,0.15)" : status === "expired" ? "rgba(239,68,68,0.15)" : "rgba(107,114,128,0.15)",
    color: status === "active" ? "#10b981" : status === "expired" ? "#ef4444" : "#6b7280",
  } as React.CSSProperties);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        StereoSpace — админка
      </h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab("tasks")}
          style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem",
            border: tab === "tasks" ? "1px solid #3b82f6" : "1px solid #1e2029",
            background: tab === "tasks" ? "rgba(59,130,246,0.15)" : "#1e2029",
            color: tab === "tasks" ? "#60a5fa" : "#6b7280",
          }}
        >
          Задачи
        </button>
        <button
          onClick={() => { setTab("codes"); loadCodes(); }}
          style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem",
            border: tab === "codes" ? "1px solid #3b82f6" : "1px solid #1e2029",
            background: tab === "codes" ? "rgba(59,130,246,0.15)" : "#1e2029",
            color: tab === "codes" ? "#60a5fa" : "#6b7280",
          }}
        >
          Коды доступа
        </button>
      </div>

      {tab === "codes" && (
        <div>
          <div style={{ background: "#1e2029", border: "1px solid #2a2d3a", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Сгенерировать коды подписки</div>
            <p style={{ color: "#6b7280", fontSize: "0.82rem", marginBottom: 16 }}>
              Один код открывает весь банк задач StereoSpace на указанное число дней.
            </p>
            <form onSubmit={handleGenerateCodes} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <label style={labelStyle}>Количество кодов</label>
                <input style={{ ...inputStyle, width: 140, marginBottom: 0 }} type="number" min="1" max="50" value={codeCount} onChange={(e) => setCodeCount(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Срок действия (дней)</label>
                <input style={{ ...inputStyle, width: 140, marginBottom: 0 }} type="number" min="1" value={codeValidDays} onChange={(e) => setCodeValidDays(e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={codesLoading}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff",
                  fontSize: "0.9rem", fontWeight: 600, cursor: codesLoading ? "not-allowed" : "pointer",
                }}
              >
                {codesLoading ? "Генерируем..." : "Сгенерировать"}
              </button>
            </form>
            {newCodes.length > 0 && (
              <div style={{ marginTop: 16, background: "#12131a", borderRadius: 8, padding: 16 }}>
                <div style={{ color: "#10b981", fontSize: "0.85rem", marginBottom: 8 }}>✅ Новые коды:</div>
                {newCodes.map((c) => (
                  <div key={c} style={{ fontFamily: "monospace", fontSize: "1rem", color: "#fff", marginBottom: 4 }}>{c}</div>
                ))}
              </div>
            )}
          </div>

          {codes.length === 0 && <p style={{ color: "#6b7280" }}>Кодов пока нет</p>}
          {codes.map((c) => (
            <div key={c.id} style={{ background: "#1e2029", border: "1px solid #2a2d3a", borderRadius: 12, padding: 20, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: "1rem", color: "#fff", marginRight: 12 }}>{c.code}</span>
                <span style={badgeStyle(c.status)}>{c.status}</span>
                <div style={{ color: "#6b7280", fontSize: "0.78rem", marginTop: 4 }}>
                  {c.valid_days} дн.
                  {c.first_used_at && ` · использован ${new Date(c.first_used_at).toLocaleDateString("ru")}`}
                </div>
              </div>
              {c.status === "active" && (
                <button
                  style={{ background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: "0.78rem", cursor: "pointer" }}
                  onClick={() => handleRevokeCode(c.id)}
                >
                  Отозвать
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "tasks" && (
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Название задачи *</label>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />

        <label style={labelStyle}>Условие *</label>
        <textarea style={{ ...inputStyle, minHeight: 80 }} value={condition} onChange={(e) => setCondition(e.target.value)} />

        <label style={labelStyle}>Решение *</label>
        <textarea style={{ ...inputStyle, minHeight: 100 }} value={solution} onChange={(e) => setSolution(e.target.value)} />

        <label style={labelStyle}>Краткий ответ</label>
        <input style={inputStyle} value={answer} onChange={(e) => setAnswer(e.target.value)} />

        <label style={labelStyle}>3D модель *</label>
        <input
          style={inputStyle}
          placeholder="Поиск модели по названию..."
          value={modelSearch}
          onChange={(e) => setModelSearch(e.target.value)}
        />
        <select style={inputStyle} value={modelId} onChange={(e) => setModelId(e.target.value)} size={6}>
          <option value="">— выберите модель —</option>
          {models
            .filter((m) => m.label.toLowerCase().includes(modelSearch.toLowerCase()))
            .map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
        </select>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Тема</label>
            <input style={inputStyle} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Класс</label>
            <input style={inputStyle} type="number" value={grade} onChange={(e) => setGrade(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Сложность (1-3)</label>
            <input style={inputStyle} type="number" min="1" max="3" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Учебник</label>
            <input style={inputStyle} value={textbook} onChange={(e) => setTextbook(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Авторы</label>
            <input style={inputStyle} value={authors} onChange={(e) => setAuthors(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Год</label>
            <input style={inputStyle} type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 14 }}>
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
          Бесплатная задача (доступна без кода)
        </label>

        {message && (
          <p style={{ marginBottom: 12, color: message.includes("добавлена") ? "#4ade80" : "#f87171" }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Сохраняем..." : "Добавить задачу"}
        </button>
      </form>
      )}
    </div>
  );
}