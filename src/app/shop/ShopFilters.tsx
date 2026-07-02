"use client";

import { useState } from "react";
import Link from "next/link";

type Presentation = {
  id: number;
  title: string;
  description: string;
  price: number;
  preview_image: string | null;
  subject: string;
  grade: number;
};

const GRADES = [5, 6, 7, 8, 9, 10, 11];
const SUBJECTS = ["Математика", "Физика", "Химия", "Информатика"];

export default function ShopFilters({ presentations }: { presentations: Presentation[] }) {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const filtered = presentations.filter((p) => {
    if (selectedGrade && p.grade !== selectedGrade) return false;
    if (selectedSubject && p.subject !== selectedSubject) return false;
    return true;
  });

  return (
    <>
      <div style={{ marginBottom: 32, display: "flex", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div style={{ color: "#6b7280", fontSize: "0.75rem", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Предмет
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <FilterButton label="Все" active={selectedSubject === null} onClick={() => setSelectedSubject(null)} />
            {SUBJECTS.map((s) => (
              <FilterButton key={s} label={s} active={selectedSubject === s} onClick={() => setSelectedSubject(selectedSubject === s ? null : s)} />
            ))}
          </div>
        </div>

        <div>
          <div style={{ color: "#6b7280", fontSize: "0.75rem", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Класс
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <FilterButton label="Все" active={selectedGrade === null} onClick={() => setSelectedGrade(null)} />
            {GRADES.map((g) => (
              <FilterButton key={g} label={`${g} кл`} active={selectedGrade === g} onClick={() => setSelectedGrade(selectedGrade === g ? null : g)} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ color: "#4b5563", fontSize: "0.85rem", marginBottom: 20 }}>
        {filtered.length === 0 ? "Ничего не найдено" : `Найдено: ${filtered.length}`}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#4b5563" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: 8 }}>По этим фильтрам ничего нет</p>
          <button
            onClick={() => { setSelectedGrade(null); setSelectedSubject(null); }}
            style={{ color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {filtered.map((p) => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 8,
        border: active ? "1px solid #3b82f6" : "1px solid #1e2029",
        background: active ? "rgba(59,130,246,0.15)" : "#1e2029",
        color: active ? "#60a5fa" : "#6b7280",
        fontSize: "0.85rem",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

function PresentationCard({ presentation }: { presentation: Presentation }) {
  const { id, title, description, price, preview_image, subject, grade } = presentation;

  return (
    <Link href={`/shop/${id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#1e2029",
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #2a2d3a",
          transition: "border-color 0.2s ease, transform 0.2s ease",
          cursor: "pointer",
          height: 340,
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#3b82f6";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2d3a";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        <div style={{ height: 160, background: "#12131a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {preview_image ? (
            <img src={preview_image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ textAlign: "center", color: "#374151" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
              <div style={{ fontSize: "0.75rem", marginTop: 6 }}>нет превью</div>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <span style={{ background: "#12131a", color: "#60a5fa", fontSize: "0.72rem", padding: "3px 8px", borderRadius: 6 }}>
              {subject}
            </span>
            <span style={{ background: "#12131a", color: "#9ca3af", fontSize: "0.72rem", padding: "3px 8px", borderRadius: 6 }}>
              {grade} класс
            </span>
          </div>

          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f3f4f6", marginBottom: 6, lineHeight: 1.4 }}>
            {title}
          </h2>
          <p style={{
            fontSize: "0.82rem",
            color: "#6b7280",
            lineHeight: 1.5,
            flex: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {description}
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
              {price} ₽
            </span>
            <span style={{ fontSize: "0.72rem", color: "#4b5563", background: "#12131a", padding: "3px 8px", borderRadius: 6 }}>
              10 дней доступа
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
