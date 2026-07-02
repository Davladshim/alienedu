import Link from 'next/link'

export default function TeacherPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🪐</div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 500, marginBottom: '8px' }}>
          Alien<span style={{ color: '#4f8ef7' }}>Edu</span>
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Кабинет преподавателя
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          <Link href="/teacher/quest/new" style={{
            display: 'block',
            background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
            color: '#fff',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 600
          }}>
            🎮 Создать новый квест
          </Link>

          <div style={{
            background: '#1a1d27',
            border: '0.5px solid #2a2d3d',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            📅 Календарь — в разработке
          </div>

          <div style={{
            background: '#1a1d27',
            border: '0.5px solid #2a2d3d',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            👥 Мои ученики — в разработке
          </div>
        </div>
      </div>
    </div>
  )
}