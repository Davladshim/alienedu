"use client";

import { useEffect, useState } from "react";
import { daysWord, daysLeftFrom } from "@/lib/adminFormat";

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

  async function handleLogout() {
    await fetch("/api/stereo-admin-login", { method: "DELETE" });
    setIsLoggedIn(false);
    setPassword("");
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

  if (!isLoggedIn) {
    return (
      <div style={{ position: "fixed", inset: 0, overflow: "auto", display: "flex", background: "var(--t-bg)", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ ...cardStyle, width: "100%", maxWidth: "380px", margin: "auto", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔷</div>
          <h1 style={{ color: "var(--t-text)", fontSize: "20px", fontWeight: 600, margin: "0 0 4px" }}>StereoSpace</h1>
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
            <button
              type="submit"
              style={{
                width: "100%", background: "var(--t-accent)", color: "#fff", border: "none", borderRadius: "8px",
                padding: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
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
    <div style={{ minHeight: "100vh", background: "var(--t-bg)", fontFamily: "system-ui, sans-serif", color: "var(--t-text)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "900px", padding: "2rem" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>🔷 StereoSpace — админка</h1>
          <button
            onClick={handleLogout}
            style={{ background: "none", border: "1px solid var(--t-border)", color: "var(--t-text-secondary)", borderRadius: "8px", padding: "6px 14px", fontSize: "13px", cursor: "pointer" }}
          >
            Выйти
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          <button
            onClick={() => setTab("tasks")}
            style={{
              padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
              border: tab === "tasks" ? "1px solid var(--t-accent)" : "1px solid var(--t-border)",
              background: tab === "tasks" ? "rgba(var(--t-accent-rgb),0.15)" : "var(--t-card)",
              color: tab === "tasks" ? "var(--t-accent)" : "var(--t-text-muted)",
            }}
          >
            Задачи
          </button>
          <button
            onClick={() => { setTab("codes"); loadCodes(); }}
            style={{
              padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
              border: tab === "codes" ? "1px solid var(--t-accent)" : "1px solid var(--t-border)",
              background: tab === "codes" ? "rgba(var(--t-accent-rgb),0.15)" : "var(--t-card)",
              color: tab === "codes" ? "var(--t-accent)" : "var(--t-text-muted)",
            }}
          >
            Коды доступа
          </button>
        </div>

        {tab === "codes" && (
          <div>
            <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px" }}>Сгенерировать коды подписки</div>
              <p style={{ color: "var(--t-text-muted)", fontSize: "12px", marginBottom: "14px" }}>
                Один код открывает весь банк задач StereoSpace на указанное число дней.
              </p>
              <form onSubmit={handleGenerateCodes} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <label style={labelStyle}>Количество кодов</label>
                  <input style={inputStyle} type="number" min="1" max="50" value={codeCount} onChange={(e) => setCodeCount(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <label style={labelStyle}>Срок действия (дней)</label>
                  <input style={inputStyle} type="number" min="1" value={codeValidDays} onChange={(e) => setCodeValidDays(e.target.value)} />
                </div>
                <div style={{ alignSelf: "flex-end" }}>
                  <button
                    type="submit"
                    disabled={codesLoading}
                    style={{
                      background: codesLoading ? "var(--t-border)" : "linear-gradient(135deg, var(--t-accent), var(--t-accent2))",
                      color: codesLoading ? "var(--t-text-muted)" : "#fff",
                      border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 600,
                      cursor: codesLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {codesLoading ? "Генерируем..." : "Сгенерировать"}
                  </button>
                </div>
              </form>

              {newCodes.length > 0 && (
                <div style={{
                  background: "var(--t-bg)", border: "1px solid var(--t-accent)", borderRadius: "10px",
                  padding: "14px 16px",
                }}>
                  <div style={{ color: "var(--t-success)", fontSize: "12px", marginBottom: "8px" }}>✓ Новые коды:</div>
                  {newCodes.map((c) => (
                    <div key={c} style={{ fontFamily: "monospace", fontSize: "15px", letterSpacing: "1px", marginBottom: "4px" }}>{c}</div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={{ color: "var(--t-text-muted)", fontSize: "12px", marginBottom: "8px" }}>История кодов</div>
              {codes.length === 0 ? (
                <div style={{ color: "var(--t-text-faint)", fontSize: "13px" }}>Кодов ещё не было</div>
              ) : (
                <div style={{ overflowX: "auto", maxHeight: "360px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", whiteSpace: "nowrap" }}>
                    <thead>
                      <tr>
                        {["Код", "Дата активации", "Срок", "Осталось", "Статус"].map((h) => (
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
                        const daysLeft = c.first_used_at ? daysLeftFrom(c.first_used_at, c.valid_days) : null;
                        const statusColor = c.status !== "active" ? "var(--t-text-muted)" : c.first_used_at ? "var(--t-success)" : "var(--t-info)";
                        const statusLabel = c.status !== "active" ? "отозван" : c.first_used_at ? "активирован" : "не использован";
                        return (
                          <tr key={c.id} style={{ borderBottom: "1px solid var(--t-border)" }}>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>{c.code}</td>
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

        {tab === "tasks" && (
          <div style={cardStyle}>
            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Название задачи *</label>
              <input style={{ ...inputStyle, marginBottom: "12px" }} value={title} onChange={(e) => setTitle(e.target.value)} />

              <label style={labelStyle}>Условие *</label>
              <textarea style={{ ...inputStyle, minHeight: "80px", marginBottom: "12px" }} value={condition} onChange={(e) => setCondition(e.target.value)} />

              <label style={labelStyle}>Решение *</label>
              <textarea style={{ ...inputStyle, minHeight: "100px", marginBottom: "12px" }} value={solution} onChange={(e) => setSolution(e.target.value)} />

              <label style={labelStyle}>Краткий ответ</label>
              <input style={{ ...inputStyle, marginBottom: "12px" }} value={answer} onChange={(e) => setAnswer(e.target.value)} />

              <label style={labelStyle}>3D модель *</label>
              <input
                style={{ ...inputStyle, marginBottom: "12px" }}
                placeholder="Поиск модели по названию..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
              />
              <select style={{ ...inputStyle, marginBottom: "12px", cursor: "pointer" }} value={modelId} onChange={(e) => setModelId(e.target.value)} size={6}>
                <option value="">— выберите модель —</option>
                {models
                  .filter((m) => m.label.toLowerCase().includes(modelSearch.toLowerCase()))
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
              </select>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Тема</label>
                  <input style={{ ...inputStyle, marginBottom: "12px" }} value={topic} onChange={(e) => setTopic(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Класс</label>
                  <input style={{ ...inputStyle, marginBottom: "12px" }} type="number" value={grade} onChange={(e) => setGrade(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Сложность (1-3)</label>
                  <input style={{ ...inputStyle, marginBottom: "12px" }} type="number" min="1" max="3" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Учебник</label>
                  <input style={{ ...inputStyle, marginBottom: "12px" }} value={textbook} onChange={(e) => setTextbook(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Авторы</label>
                  <input style={{ ...inputStyle, marginBottom: "12px" }} value={authors} onChange={(e) => setAuthors(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Год</label>
                  <input style={{ ...inputStyle, marginBottom: "12px" }} type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "14px", color: "var(--t-text-secondary)" }}>
                <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                Бесплатная задача (доступна без кода)
              </label>

              {message && (
                <p style={{ marginBottom: "12px", color: message.includes("добавлена") ? "var(--t-success)" : "var(--t-danger)", fontSize: "13px" }}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 20px", borderRadius: "8px", border: "none",
                  background: saving ? "var(--t-border)" : "linear-gradient(135deg, var(--t-accent), var(--t-accent2))",
                  color: saving ? "var(--t-text-muted)" : "#fff", fontSize: "14px", fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Сохраняем..." : "Добавить задачу"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
