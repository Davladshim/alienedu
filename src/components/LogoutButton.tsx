'use client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
        borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
      }}
    >
      Выйти
    </button>
  )
}
