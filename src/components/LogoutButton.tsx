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
        background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
        borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
      }}
    >
      Выйти
    </button>
  )
}
