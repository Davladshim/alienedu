'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LessonBuilder, type LessonMeta } from '../LessonBuilder'
import type { LessonBlockData } from '@/components/lesson-blocks'

export default function NewLessonPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [canPublishToLibrary, setCanPublishToLibrary] = useState(true)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => setCanPublishToLibrary(data.plan === 'pro'))
  }, [])

  async function handleSave(meta: LessonMeta, blocks: LessonBlockData[]): Promise<boolean> {
    setError('')
    setSaving(true)
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: meta.title, subject: meta.subject, grade: meta.grade || null, status: meta.status, mode: meta.mode, is_public: meta.isPublic, library_description: meta.libraryDescription, blocks }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      router.push(`/teacher/lessons/${data.lesson_id}`)
      return true
    } else {
      setError(data.detail ? `${data.error || 'Ошибка'}: ${data.detail}` : (data.error || 'Ошибка'))
      return false
    }
  }

  return (
    <LessonBuilder
      backHref="/teacher/lessons"
      canPublishToLibrary={canPublishToLibrary}
      saving={saving}
      error={error}
      onSave={handleSave}
    />
  )
}
