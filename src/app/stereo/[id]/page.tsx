"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

interface Task {
  id: number;
  title: string;
  condition: string;
  solution: string;
  answer: string;
  model_url: string;
  topic: string;
  grade: number;
  textbook: string;
  authors: string;
  year: number;
  annotations: {
    points: { name: string; coords: [number, number, number] }[];
    segments: { from: string; to: string; label: string; isTarget: boolean }[];
    planes?: { name: string; anchor: [number, number, number] }[];
    additional?: any[];
  };
}

const defaultLayers = {
  planes: true,
  points: false,
  segments: false,
  dimensions: false,
  additional: false,
};

export default function TaskPage() {
  const params = useParams();
  const id = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [layers, setLayers] = useState(defaultLayers);
  const [hideAll, setHideAll] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [additionalNote, setAdditionalNote] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<"left" | "right" | "wheel" | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  function loadTask() {
    const savedCode = localStorage.getItem("stereo_code");
    const url = savedCode
      ? `/api/stereo-task/${id}?code=${encodeURIComponent(savedCode)}`
      : `/api/stereo-task/${id}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setTask(data.task);
          setError("");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Не удалось загрузить задачу");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadTask();
  }, [id]);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");
    setCodeLoading(true);

    try {
      const res = await fetch("/api/stereo-verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.error || "Ошибка");
        setCodeLoading(false);
        return;
      }

      localStorage.setItem("stereo_token", data.token);
      localStorage.setItem("stereo_unlocked", "true");
      localStorage.setItem("stereo_code", code.trim().toUpperCase());
      setCodeLoading(false);
      setLoading(true);
      loadTask();
    } catch {
      setCodeError("Не удалось подключиться к серверу");
      setCodeLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "48px 24px", color: "#9ca3af" }}>
          Загрузка...
        </div>
      </div>
    );
  }

  if (error === "Нужен код доступа" || error === "Код недействителен" || error === "Срок действия кода истёк") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 32, maxWidth: 400, width: "90%" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#f1f5f9" }}>
            🔒 Задача заблокирована
          </h2>
          <p style={{ color: "#9ca3af", marginBottom: 20, fontSize: 14 }}>
            Чтобы открыть все задачи StereoSpace на 30 дней, купите код доступа:
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <a
              href="https://vk.ru/darya_shim"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 12px",
                borderRadius: 8,
                background: "#3b82f6",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Личная страница ВК
            </a>
            <a
              href="https://vk.ru/alientutor_for_tutors"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 12px",
                borderRadius: 8,
                background: "#3b82f6",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Группа ВК
            </a>
          </div>

          <form onSubmit={handleCodeSubmit}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Уже есть код? Введите его"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #374151",
                background: "#111827",
                color: "#fff",
                fontSize: 14,
                marginBottom: 8,
                boxSizing: "border-box",
              }}
            />
            {codeError && (
              <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>
                {codeError}
              </p>
            )}
            <button
              type="submit"
              disabled={codeLoading}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#22c55e",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: codeLoading ? "not-allowed" : "pointer",
              }}
            >
              {codeLoading ? "Проверяем..." : "Разблокировать"}
            </button>
          </form>

          <a
            href="/stereo"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 12,
              color: "#9ca3af",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            ← Все задачи
          </a>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "48px 24px", color: "#f87171" }}>
          {error || "Задача не найдена"}
        </div>
      </div>
    );
  }

  const hasAdditional = (task.annotations.additional || []).length > 0;
  const allOn = Object.values(layers).every(Boolean) && !hideAll;
  const effectiveLayers = hideAll
    ? { planes: false, points: false, segments: false, dimensions: false, additional: false }
    : layers;

  function toggleLayer(key: keyof typeof defaultLayers) {
    if (key === "additional" && !hasAdditional) {
      setAdditionalNote(true);
      setTimeout(() => setAdditionalNote(false), 2500);
      return;
    }
    setHideAll(false);
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleAll() {
    setHideAll(false);
    if (allOn) {
      setLayers(defaultLayers);
    } else {
      setLayers({
        planes: true,
        points: true,
        segments: true,
        dimensions: true,
        additional: hasAdditional,
      });
    }
  }

  const checkboxLabels: { key: keyof typeof defaultLayers; label: string }[] = [
    { key: "planes", label: "Плоскости" },
    { key: "points", label: "Точки" },
    { key: "segments", label: "Отрезки" },
    { key: "dimensions", label: "Размеры" },
    { key: "additional", label: "Доп. построения" },
  ];

  const solutionSteps = task.solution.split("\n").filter((s) => s.trim().length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "48px 24px" }}>
      <a href="/stereo" style={{ color: "#60a5fa", fontSize: 14, textDecoration: "none" }}>
        ← Все задачи
      </a>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16, marginBottom: 4 }}>
        {task.title}
      </h1>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
        {[task.textbook, task.authors, task.year].filter(Boolean).join(" · ")}
      </p>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        <div style={{ flexShrink: 0, width: 560 }}>
          <div
            style={{
              border: "1px solid #374151",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 12,
            }}
          >
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10, fontWeight: 600, letterSpacing: 0.5 }}>
              ФИЛЬТРЫ
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#f87171", cursor: "pointer", fontWeight: 600 }}>
                <input type="checkbox" checked={hideAll} onChange={() => setHideAll(!hideAll)} />
                Скрыть всё
              </label>

              <span style={{ width: 1, height: 16, background: "#374151" }} />

              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: allOn ? "#60a5fa" : "#9ca3af", cursor: "pointer" }}>
                <input type="checkbox" checked={allOn} onChange={toggleAll} />
                Всё
              </label>

              {checkboxLabels.map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: !hideAll && layers[key] ? "#60a5fa" : "#9ca3af",
                    cursor: "pointer",
                    opacity: key === "additional" && !hasAdditional ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!hideAll && layers[key]}
                    onChange={() => toggleLayer(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {additionalNote && (
            <p style={{ color: "#fbbf24", fontSize: 13, marginBottom: 8 }}>
              У этой задачи нет дополнительных построений
            </p>
          )}

          <div
            style={{
              width: 560,
              height: 560,
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid #334155",
              marginBottom: 12,
            }}
          >
            <Scene modelUrl={task.model_url} annotations={task.annotations} active={effectiveLayers} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "16px 20px",
              borderRadius: 14,
              background: "rgba(148, 163, 184, 0.08)",
              border: "1px solid #334155",
            }}
          >
            <svg width="72" height="104" viewBox="0 0 36 52" fill="none" style={{ flexShrink: 0 }}>
              <rect x="1" y="1" width="34" height="50" rx="17" stroke="#6b7280" strokeWidth="1.5" />
              <path d="M18 1 V22 M2 20 Q2 1 18 1" stroke="#6b7280" strokeWidth="1.5" fill="none" />
              <path d="M18 22 L18 1 Q18 1 18 1 Q34 1 34 20" stroke="#6b7280" strokeWidth="1.5" fill="none" />
              <rect
                x="2" y="2" width="15" height="19" rx="8"
                fill={hoveredBtn === "left" ? "#3b82f6" : "transparent"}
                opacity={hoveredBtn === "left" ? 0.3 : 0}
                style={{ cursor: "pointer", transition: "opacity 0.25s ease" }}
                onMouseEnter={() => setHoveredBtn("left")}
                onMouseLeave={() => setHoveredBtn(null)}
              />
              <rect
                x="19" y="2" width="15" height="19" rx="8"
                fill={hoveredBtn === "right" ? "#3b82f6" : "transparent"}
                opacity={hoveredBtn === "right" ? 0.3 : 0}
                style={{ cursor: "pointer", transition: "opacity 0.25s ease" }}
                onMouseEnter={() => setHoveredBtn("right")}
                onMouseLeave={() => setHoveredBtn(null)}
              />
              <rect
                x="16" y="6" width="4" height="12" rx="2"
                fill={hoveredBtn === "wheel" ? "#3b82f6" : "#9ca3af"}
                style={{ cursor: "pointer", transition: "fill 0.25s ease" }}
                onMouseEnter={() => setHoveredBtn("wheel")}
                onMouseLeave={() => setHoveredBtn(null)}
              />
            </svg>

            <div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                Наведите на кнопки мышки, чтобы узнать управление
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "#e2e8f0",
                  minHeight: 20,
                  opacity: hoveredBtn ? 1 : 0,
                  transition: "opacity 0.3s ease",
                }}
              >
                {hoveredBtn === "left" && "Левая кнопка — вращение модели"}
                {hoveredBtn === "right" && "Правая кнопка — перемещение модели"}
                {hoveredBtn === "wheel" && "Колесико — масштабирование модели"}
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: "#1f2937", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Условие</h3>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6 }}>{task.condition}</p>
          </div>

          <button
            onClick={() => setShowSolution(!showSolution)}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#3b82f6",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            {showSolution ? "Скрыть решение" : "Показать решение"}
          </button>

          {showSolution && (
            <div style={{ background: "#1f2937", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Решение</h3>
              {solutionSteps.map((step, i) => (
                <p
                  key={i}
                  style={{
                    color: "#cbd5e1",
                    fontSize: 14,
                    lineHeight: 1.7,
                    marginBottom: 20,
                  }}
                >
                  {step}
                </p>
              ))}
              <p
                style={{
                  color: "#4ade80",
                  fontWeight: 700,
                  fontSize: 15,
                  background: "rgba(74,222,128,0.1)",
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginTop: 8,
                }}
              >
                Ответ: {task.answer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}