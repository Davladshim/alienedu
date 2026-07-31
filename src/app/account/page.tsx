'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Me {
  full_name: string
  role: 'teacher' | 'student' | 'admin'
}

export default function AccountPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => {
      if (data.error) { router.push('/login'); return }
      setMe(data)
    })
  }, [router])

  async function handleDelete() {
    const warning = me?.role === 'teacher'
      ? 'Удалить аккаунт репетитора? Все ваши уроки, ученики, расписание и финансы будут безвозвратно удалены через 30 дней. В течение этого срока можно восстановить аккаунт, просто войдя снова с тем же логином и паролем. Продолжить?'
      : 'Удалить аккаунт? Через 30 дней он будет удалён безвозвратно. В течение этого срока можно восстановить аккаунт, просто войдя снова с тем же логином и паролем. Продолжить?'
    if (!confirm(warning)) return

    setDeleting(true)
    setError('')
    const res = await fetch('/api/auth/delete-account', { method: 'POST' })
    setDeleting(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Не удалось удалить аккаунт')
      return
    }
    router.push('/login')
  }

  const backHref = me?.role === 'teacher' ? '/teacher' : me?.role === 'student' ? '/student' : '/'

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif', color: 'var(--t-text)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '560px', padding: '2rem' }}>
        <Link href={backHref} style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '10px 0 1.5rem' }}>Аккаунт</h1>

        {me && (
          <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{me.full_name}</div>
            <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '4px' }}>
              {me.role === 'teacher' ? 'Репетитор' : 'Ученик'}
            </div>
          </div>
        )}

        <div style={{ background: 'var(--t-danger-bg)', border: '1px solid var(--t-danger)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Удаление аккаунта</div>
          <p style={{ color: 'var(--t-text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 1rem' }}>
            После удаления аккаунт блокируется сразу, а данные хранятся ещё 30 дней — в этот срок можно
            восстановить его, просто войдя снова с тем же логином и паролем. По истечении 30 дней данные
            удаляются безвозвратно.
          </p>
          {error && (
            <div style={{ color: 'var(--t-danger)', fontSize: '13px', marginBottom: '10px' }}>{error}</div>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: 'var(--t-danger)', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '10px 18px', fontSize: '14px', fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? 'Удаляем...' : 'Удалить аккаунт'}
          </button>
        </div>
      </div>
    </div>
  )
}
