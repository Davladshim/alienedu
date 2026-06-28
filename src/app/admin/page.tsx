export default function AdminPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🪐</div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 500 }}>
          Alien<span style={{ color: '#4f8ef7' }}>Edu</span>
        </h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>
          Панель администратора — в разработке
        </p>
      </div>
    </div>
  )
}
