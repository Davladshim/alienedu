"use client";

import { useEffect, useState } from "react";

interface Task {
  id: number;
  title: string;
  topic: string;
  grade: number;
  difficulty: number;
  is_free: boolean;
  textbook: string | null;
  authors: string | null;
  year: number | null;
}

export default function StereoSpacePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  useEffect(() => {
    fetch("/api/stereo-tasks-list")
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...(data.tasks || [])].sort(
          (a: Task, b: Task) => Number(b.is_free) - Number(a.is_free)
        );
        setTasks(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/stereo-admin-check")
      .then((res) => res.json())
      .then((data) => setIsAdmin(!!data.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  function handleTaskClick(task: Task) {
    if (task.is_free || isAdmin) {
      window.location.href = `/stereo/${task.id}`;
      return;
    }
    const unlocked = localStorage.getItem("stereo_unlocked");
    if (unlocked === "true") {
      window.location.href = `/stereo/${task.id}`;
      return;
    }
    setModalOpen(true);
  }

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
      setModalOpen(false);
      setCodeLoading(false);
    } catch {
      setCodeError("Не удалось подключиться к серверу");
      setCodeLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--t-bg)" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "var(--t-text)"  }}>
        💎 StereoSpace
      </h1>
      <p style={{ color: "var(--t-text-secondary)", marginBottom: 32 }}>
        Банк задач по стереометрии
      </p>

      {loading && <p style={{ color: "var(--t-text-secondary)" }}>Загрузка...</p>}

      {!loading && tasks.length === 0 && (
        <p style={{ color: "var(--t-text-secondary)" }}>Задач пока нет.</p>
      )}

      <div
        className="stereo-grid"
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task)}
            style={{
              display: "flex",
              borderRadius: 12,
              background: "var(--t-card)",
              border: "1px solid var(--t-border)",
              cursor: "pointer",
              opacity: task.is_free || isAdmin ? 1 : 0.5,
              position: "relative",
              overflow: "hidden",
              height: 120,
            }}
          >
            <div
              style={{
                width: 110,
                height: 110,
                flexShrink: 0,
                background: "var(--t-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
              }}
            >
              📐
            </div>

            {!task.is_free && !isAdmin && (
              <div style={{ position: "absolute", top: 10, right: 10, fontSize: 18 }}>
                🔒
              </div>
            )}

            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0, flex: 1 }}>
              <p style={{ color: "var(--t-text-muted)", fontSize: 11, marginBottom: 6 }}>
                {[task.textbook, task.authors, task.year].filter(Boolean).join(" · ") || "—"}
              </p>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  marginBottom: 6,
                  color: "var(--t-text)",
                }}
              >
                {task.title}
              </h3>
              <div style={{ display: "flex", gap: 6 }}>
                <span
                  style={{
                    background: "rgba(var(--t-info-rgb),0.2)",
                    color: "var(--t-info)",
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  {task.topic}
                </span>
                <span
                  style={{
                    background: "var(--t-border)",
                    color: "var(--t-text-secondary)",
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  {task.grade} класс
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--t-overlay)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--t-card)",
              borderRadius: 12,
              padding: 32,
              maxWidth: 400,
              width: "90%",
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--t-text)"  }}>
              🔒 Задача заблокирована
            </h2>
            <p style={{ color: "var(--t-text-secondary)", marginBottom: 20, fontSize: 14 }}>
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
                  background: "var(--t-accent)",
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
                  background: "var(--t-accent)",
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
                  border: "1px solid var(--t-border)",
                  background: "var(--t-bg)",
                  color: "var(--t-text)",
                  fontSize: 14,
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />
              {codeError && (
                <p style={{ color: "var(--t-danger-soft)", fontSize: 13, marginBottom: 8 }}>
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
                  background: "var(--t-success2)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: codeLoading ? "not-allowed" : "pointer",
                }}
              >
                {codeLoading ? "Проверяем..." : "Разблокировать"}
              </button>
            </form>

            <button
              onClick={() => setModalOpen(false)}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "8px",
                background: "transparent",
                border: "none",
                color: "var(--t-text-secondary)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        .stereo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
      `}</style>
      </div>
    </div>
  );
}