"use client";

import { use, useEffect, useRef } from "react";

export default function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadPresentation() {
      try {
        const res = await fetch(`/api/presentation-shop/${id}`);
        if (!res.ok) {
          document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f1117;color:#fff;font-family:sans-serif;">Ошибка загрузки презентации</div>`;
          return;
        }

        const html = await res.text();

        // Парсим HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Переносим стили
        doc.querySelectorAll("style, link[rel='stylesheet']").forEach(el => {
          document.head.appendChild(document.adoptNode(el));
        });

        // Переносим контент body
        if (containerRef.current) {
          containerRef.current.innerHTML = doc.body.innerHTML;
        }

        // Запускаем скрипты
        doc.querySelectorAll("script").forEach(oldScript => {
          const newScript = document.createElement("script");
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          document.body.appendChild(newScript);
        });

      } catch (err) {
        console.error("Ошибка загрузки презентации:", err);
      }
    }

    loadPresentation();
  }, [id]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#020610" }}
    />
  );
}