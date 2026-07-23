"use client";

import { useEffect, useState } from "react";

interface Model {
  id: number;
  label: string;
}

export default function StereoAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState("");
  const [solution, setSolution] = useState("");
  const [answer, setAnswer] = useState("");
  const [modelId, setModelId] = useState("");
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117" }}>
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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        StereoSpace — добавить задачу
      </h1>

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
        <select style={inputStyle} value={modelId} onChange={(e) => setModelId(e.target.value)}>
          <option value="">— выберите модель —</option>
          {models.map((m) => (
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
    </div>
  );
}