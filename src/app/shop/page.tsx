// src/app/shop/page.tsx
// Главная страница магазина — список всех активных презентаций

import Link from "next/link";

// Тип презентации (потом заменим на запрос к БД)
type Presentation = {
  id: number;
  title: string;
  description: string | null;
  price: number;
  preview_image: string | null;
};

// Заглушка данных — потом заменим на реальный запрос к PostgreSQL
async function getPresentations(): Promise<Presentation[]> {
  // TODO: заменить на запрос к БД
  // const { rows } = await db.query(
  //   "SELECT id, title, description, price, preview_image FROM presentations WHERE is_active = true ORDER BY created_at DESC"
  // );
  // return rows;

  return [
    {
      id: 1,
      title: "Алгебра 6 класс — повторение",
      description: "Интерактивная презентация для повторения тем 5-6 класса. Дроби, уравнения, координаты.",
      price: 299,
      preview_image: null,
    },
    {
      id: 2,
      title: "Физика 7 класс — силы",
      description: "Виды сил, законы Ньютона, задачи с анимацией.",
      price: 349,
      preview_image: null,
    },
  ];
}

export default async function ShopPage() {
  const presentations = await getPresentations();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Шапка */}
      <header className="border-b border-zinc-800 px-6 py-5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold tracking-tight text-white">
              AlienEdu
            </span>
            <span className="ml-3 text-sm text-zinc-500">/ магазин презентаций</span>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            ← на платформу
          </Link>
        </div>
      </header>

      {/* Основной контент */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Интерактивные презентации
          </h1>
          <p className="text-zinc-400 text-base">
            Авторские материалы по математике, физике и другим точным предметам.
            Купи код доступа — открой презентацию на 30 дней.
          </p>
        </div>

        {/* Сетка карточек */}
        {presentations.length === 0 ? (
          <div className="text-center py-24 text-zinc-500">
            <p className="text-lg">Презентации скоро появятся</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {presentations.map((p) => (
              <PresentationCard key={p.id} presentation={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Карточка презентации
function PresentationCard({ presentation }: { presentation: Presentation }) {
  const { id, title, description, price, preview_image } = presentation;

  return (
    <Link href={`/shop/${id}`} className="group block">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/70">
        {/* Превью */}
        <div className="aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden">
          {preview_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview_image}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-600">
              {/* Иконка-заглушка */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
              <span className="text-xs">нет превью</span>
            </div>
          )}
        </div>

        {/* Текст */}
        <div className="p-5">
          <h2 className="text-base font-semibold text-zinc-100 mb-1 group-hover:text-white transition-colors line-clamp-2">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-zinc-400 mb-4 line-clamp-3">
              {description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">
              {price} ₽
            </span>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
              30 дней доступа
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
