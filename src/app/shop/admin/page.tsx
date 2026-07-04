"use client";

import { useState, useEffect } from "react";

type Presentation = {
  id: number;
  title: string;
  subject: string;
  grade: number;
  price: number;
  content_path: string;
  preview_image: string | null;
  is_active: boolean;
  created_at: string;
};

type Code = {
  id: number;
  code: string;
  status: string;
  first_used_at: string | null;
  valid_days: number;
  created_at: string;
  presentation_title: string;
};

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
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null);

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

  async function handleRevokeCode(codeId: number) {
    await fetch("/api/admin-codes-shop", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codeId }),
    });
    loadCodes(selectedPresId ?? undefined);
  }

  const s = {
    page: { minHeight: "100vh", background: "#0f1117", color: "#fff", fontFamily: "'Segoe UI', Roboto, sans-serif" } as React.CSSProperties,
    header: { borderBottom: "1px solid #1e2029", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
    main: { maxWidth: 1000, margin: "0 auto", padding: "32px 24px" } as React.CSSProperties,
    tabs: { display: "flex", gap: 8, marginBottom: 32 } as React.CSSProperties,
    tab: (active: boolean) => ({ padding: "8px 20px", borderRadius: 8, border: active ? "1px solid #3b82f6" : "1px solid #1e2029", background: active ? "rgba(59,130,246,0.15)" : "#1e2029", color: active ? "#60a5fa" : "#6b7280", fontSize: "0.9rem", cursor: "pointer" }) as React.CSSProperties,
    card: { background: "#1e2029", border: "1px solid #2a2d3a", borderRadius: 12, padding: 20, marginBottom: 12 } as React.CSSProperties,
    input: { width: "100%", background: "#12131a", border: "1px solid #2a2d3a", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" } as React.CSSProperties,
    label: { color: "#6b7280", fontSize: "0.8rem", marginBottom: 6, display: "block" } as React.CSSProperties,
    btn: { background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
    btnDanger: { background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: "0.78rem", cursor: "pointer" } as React.CSSProperties,
    btnGhost: { background: "none", border: "1px solid #2a2d3a", color: "#6b7280", borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", cursor: "pointer" } as React.CSSProperties,
    row: { display: "flex", gap: 16 } as React.CSSProperties,
    field: { flex: 1 } as React.CSSProperties,
    badge: (status: string) => ({
      display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: "0.72rem",
      background: status === "active" ? "rgba(16,185,129,0.15)" : status === "expired" ? "rgba(239,68,68,0.15)" : "rgba(107,114,128,0.15)",
      color: status === "active" ? "#10b981" : status === "expired" ? "#ef4444" : "#6b7280",
    }) as React.CSSProperties,
  };

  if (!isLoggedIn) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#1e2029", border: "1px solid #2a2d3a", borderRadius: 16, padding: 48, width: 360, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🪐</div>
          <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 4 }}>
            <span style={{ color: "#fff" }}>Alien</span><span style={{ color: "#60a5fa" }}>Edu</span>
          </div>
          <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 32 }}>Магазин — панель управления</div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              style={s.input}
              autoFocus
            />
            {loginError && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{loginError}</p>}
            <button type="submit" style={s.btn}>Войти</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
          <span style={{ color: "#fff" }}>Alien</span><span style={{ color: "#60a5fa" }}>Edu</span>
          <span style={{ color: "#4b5563", fontWeight: 400, fontSize: "0.9rem", marginLeft: 8 }}>/ магазин / админ</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/shop" target="_blank" style={{ color: "#6b7280", fontSize: "0.85rem", textDecoration: "none" }}>← магазин</a>
          <button onClick={handleLogout} style={s.btnGhost}>Выйти</button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.tabs}>
          <button style={s.tab(tab === "presentations")} onClick={() => { setTab("presentations"); loadPresentations(); }}>
            Презентации
          </button>
          <button style={s.tab(tab === "add")} onClick={() => setTab("add")}>
            + Добавить
          </button>
          <button style={s.tab(tab === "codes")} onClick={() => { setTab("codes"); loadCodes(); }}>
            Коды доступа
          </button>
        </div>

        {tab === "presentations" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 20 }}>Все презентации</h2>
            {presentations.length === 0 && <p style={{ color: "#6b7280" }}>Презентаций пока нет</p>}
            {presentations.map((p) => (
              <div key={p.id} style={s.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>
                      {p.subject} · {p.grade} класс · {p.price} ₽
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={`/shop/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ ...s.btnGhost, textDecoration: "none", fontSize: "0.82rem" }}>
                      Открыть →
                    </a>
                    <button style={s.btnGhost} onClick={() => { setEditingPresentation(p); setTab("edit"); }}>
                      Редактировать
                    </button>
                    <button style={s.btnGhost} onClick={() => { setCodeForm({ ...codeForm, presentationId: String(p.id) }); setSelectedPresId(p.id); setTab("codes"); loadCodes(p.id); }}>
                      Коды
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "add" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 20 }}>Добавить презентацию</h2>
            <form onSubmit={handleAddPresentation} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={s.label}>Название *</label>
                <input style={s.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Алгебра 6 класс — повторение" required />
              </div>
              <div>
                <label style={s.label}>Описание</label>
                <input style={s.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Краткое описание для карточки в магазине" />
              </div>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Предмет *</label>
                  <select style={s.input} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                    <option value="">Выбери предмет</option>
                    <option>Математика</option>
                    <option>Физика</option>
                    <option>Химия</option>
                    <option>Информатика</option>
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Класс *</label>
                  <select style={s.input} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required>
                    <option value="">Выбери класс</option>
                    {[5,6,7,8,9,10,11].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Цена (₽) *</label>
                  <input style={s.input} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="299" required />
                </div>
              </div>
              <div>
                <label style={s.label}>HTML код презентации *</label>
                <textarea
                  style={{ ...s.input, height: 300, fontFamily: "monospace", fontSize: "0.85rem", resize: "vertical" } as React.CSSProperties}
                  value={form.htmlCode}
                  onChange={(e) => setForm({ ...form, htmlCode: e.target.value })}
                  placeholder="Вставь сюда весь HTML код презентации..."
                  required
                />
              </div>
              {message && <p style={{ color: message.startsWith("✅") ? "#10b981" : "#f87171", fontSize: "0.9rem" }}>{message}</p>}
              <button type="submit" style={s.btn} disabled={loading}>
                {loading ? "Загружаем..." : "Добавить презентацию"}
              </button>
            </form>
          </div>
        )}

        {tab === "codes" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 20 }}>Коды доступа</h2>
            <div style={{ ...s.card, marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Сгенерировать новые коды</div>
              <form onSubmit={handleGenerateCodes} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={s.row}>
                  <div style={s.field}>
                    <label style={s.label}>Презентация *</label>
                    <select style={s.input} value={codeForm.presentationId} onChange={(e) => setCodeForm({ ...codeForm, presentationId: e.target.value })} required>
                      <option value="">Выбери презентацию</option>
                      {presentations.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Количество кодов</label>
                    <input style={s.input} type="number" min="1" max="50" value={codeForm.count} onChange={(e) => setCodeForm({ ...codeForm, count: e.target.value })} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Срок действия (дней)</label>
                    <input style={s.input} type="number" min="1" value={codeForm.validDays} onChange={(e) => setCodeForm({ ...codeForm, validDays: e.target.value })} />
                  </div>
                </div>
                <button type="submit" style={{ ...s.btn, alignSelf: "flex-start" }} disabled={loading}>
                  {loading ? "Генерируем..." : "Сгенерировать"}
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
            <div style={{ marginBottom: 16 }}>
              <select style={{ ...s.input, width: "auto", minWidth: 280 }} value={selectedPresId ?? ""} onChange={(e) => { const val = e.target.value ? Number(e.target.value) : null; setSelectedPresId(val); loadCodes(val ?? undefined); }}>
                <option value="">Все презентации</option>
                {presentations.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            {codes.length === 0 && <p style={{ color: "#6b7280" }}>Кодов пока нет</p>}
            {codes.map((c) => (
              <div key={c.id} style={{ ...s.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: "1rem", color: "#fff", marginRight: 12 }}>{c.code}</span>
                  <span style={s.badge(c.status)}>{c.status}</span>
                  <div style={{ color: "#6b7280", fontSize: "0.78rem", marginTop: 4 }}>
                    {c.presentation_title} · {c.valid_days} дн.
                    {c.first_used_at && ` · использован ${new Date(c.first_used_at).toLocaleDateString("ru")}`}
                  </div>
                </div>
                {c.status === "active" && (
                  <button style={s.btnDanger} onClick={() => handleRevokeCode(c.id)}>Отозвать</button>
                )}
              </div>
            ))}
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
            s={s}
          />
        )}
      </main>
    </div>
  );
}

function EditPresentation({ presentation, onSave, onCancel, s }: {
  presentation: Presentation;
  onSave: (updated: any) => void;
  onCancel: () => void;
  s: any;
}) {
  const [form, setForm] = useState({
    id: presentation.id,
    title: presentation.title,
    description: "",
    subject: presentation.subject,
    grade: String(presentation.grade),
    price: String(presentation.price),
    is_active: presentation.is_active,
    preview_image: presentation.preview_image ?? "",
  });

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 20 }}>Редактировать презентацию</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={s.label}>Название</label>
          <input style={s.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label style={s.label}>Описание</label>
          <input style={s.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label style={s.label}>Имя файла превью (например: preview-1.jpg)</label>
          <input style={s.input} value={form.preview_image ?? ""} onChange={(e) => setForm({ ...form, preview_image: e.target.value })} placeholder="preview-1.jpg" />
          <div style={{ color: "#4b5563", fontSize: "0.75rem", marginTop: 4 }}>Загрузи файл в Supabase Storage → бакет previews, потом укажи имя здесь</div>
        </div>
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Предмет</label>
            <select style={s.input} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
              <option>Математика</option>
              <option>Физика</option>
              <option>Химия</option>
              <option>Информатика</option>
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>Класс</label>
            <select style={s.input} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
              {[5,6,7,8,9,10,11].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>Цена (₽)</label>
            <input style={s.input} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <label htmlFor="is_active" style={{ color: "#6b7280", fontSize: "0.9rem" }}>Показывать в магазине</label>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={s.btn} onClick={() => onSave({ ...form, grade: Number(form.grade), price: Number(form.price) })}>
            Сохранить
          </button>
          <button style={s.btnGhost} onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}