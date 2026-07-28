'use client'
import Link from 'next/link'
import { PlanWidget } from '@/components/PlanWidget'

const cardStyle: React.CSSProperties = {
  background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.75rem', flex: 1, minWidth: '260px',
}
const listStyle: React.CSSProperties = { margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }
const itemStyle: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '14px', color: '#d1d5db' }

export default function TariffsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif', color: '#fff', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '10px 0 4px' }}>Тарифы</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 1.5rem' }}>
          Есть код на тариф? Введите его прямо здесь — активируется сразу.
        </p>

        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px', padding: '14px 18px', marginBottom: '2rem' }}>
          <PlanWidget />
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>Бесплатный</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Чтобы попробовать платформу</div>
            <ul style={listStyle}>
              <li style={itemStyle}>✅ До 5 учеников</li>
              <li style={itemStyle}>✅ Календарь без ограничений</li>
              <li style={itemStyle}>✅ Финансы без ограничений</li>
              <li style={itemStyle}>✅ 1 собственный урок — из любого количества блоков, все типы блоков доступны</li>
              <li style={itemStyle}>✅ До 5 готовых уроков из библиотеки сообщества</li>
            </ul>
          </div>

          <div style={{ ...cardStyle, border: '1px solid #4f8ef7', background: 'linear-gradient(180deg, rgba(79,142,247,0.08), #1a1d27)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>Pro — 590 ₽</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Для постоянной работы</div>
            <ul style={listStyle}>
              <li style={itemStyle}>✅ Ученики без ограничений</li>
              <li style={itemStyle}>✅ Календарь без ограничений</li>
              <li style={itemStyle}>✅ Финансы без ограничений</li>
              <li style={itemStyle}>✅ Уроки без ограничений</li>
              <li style={itemStyle}>✅ Библиотека сообщества без ограничений — и можно добавлять свои уроки, чтобы делиться ими</li>
            </ul>
          </div>
        </div>

        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2rem' }}>
          Код на тариф можно получить у нас напрямую — оплата пока принимается вручную, без автоматической подписки.
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>🛍️ Магазин презентаций</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Подписка на 30 дней на весь магазин — 399 ₽. Код вводится прямо в <a href="/shop" target="_blank" rel="noopener noreferrer" style={{ color: '#4f8ef7' }}>магазине</a>.
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>🔷 StereoSpace</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Подписка на 30 дней на весь банк задач — 399 ₽. Код вводится прямо в <a href="/stereo" target="_blank" rel="noopener noreferrer" style={{ color: '#4f8ef7' }}>StereoSpace</a>.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
