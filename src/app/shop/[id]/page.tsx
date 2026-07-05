"use client";

import { use } from "react";

export default function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#020610" }}>
      <iframe
        src={`/api/presentation-shop/${id}`}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Презентация"
        sandbox="allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}