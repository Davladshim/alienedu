import Link from "next/link";
export const dynamic = 'force-dynamic';
import { query } from "@/lib/db";
import ShopFilters from "./ShopFilters";

type Presentation = {
  id: number;
  title: string;
  description: string;
  price: number;
  preview_image: string | null;
  subject: string;
  grade: number;
  content_description: string | null;
};

async function getPresentations(): Promise<Presentation[]> {
  const result = await query(
    `SELECT id, title, description, price, preview_image, subject, grade, content_description
     FROM presentations
     WHERE is_active = true
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export default async function ShopPage() {
  const presentations = await getPresentations();

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#fff" }}>
      <header style={{ borderBottom: "1px solid #1e2029", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🪐</span>
            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              <span style={{ color: "#fff" }}>Alien</span>
              <span style={{ color: "#60a5fa" }}>Edu</span>
            </span>
            <span style={{ color: "#4b5563", marginLeft: 8, fontSize: "0.9rem" }}>/ магазин презентаций</span>
          </div>
          <Link href="/" style={{ color: "#6b7280", fontSize: "0.85rem", textDecoration: "none" }}>
            ← на платформу
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}>
            Интерактивные презентации
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>
            Авторские материалы по точным предметам. Купи код доступа — открой презентацию на 10 дней.
          </p>
        </div>

        <ShopFilters presentations={presentations} />
      </main>
    </div>
  );
}