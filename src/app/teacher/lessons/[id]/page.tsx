'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LessonBuilder, type LessonMeta } from '../LessonBuilder'
import type { LessonBlockData } from '@/components/lesson-blocks'

export default function EditLessonPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState<any>(null)
  const [blocks, setBlocks] = useState<LessonBlockData[]>([])
  const [assignedStudentIds, setAssignedStudentIds] = useState<number[]>([])
  const [canPublishToLibrary, setCanPublishToLibrary] = useState(true)

  useEffect(() => {
    fetch(`/api/lessons/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.lesson) {
          setLesson(data.lesson)
          setBlocks((data.blocks || []).map((b: any) => ({ id: String(b.id), type: b.type, content: b.content })))
          setAssignedStudentIds(data.assigned_student_ids || [])
        }
        setLoading(false)
      })
    fetch('/api/me').then(r => r.json()).then(data => setCanPublishToLibrary(data.plan === 'pro'))
  }, [id])

  async function handleSave(meta: LessonMeta, newBlocks: LessonBlockData[]): Promise<boolean> {
    setError('')
    setSaving(true)
    const res = await fetch(`/api/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: meta.title, subject: meta.subject, grade: meta.grade || null,
        status: meta.status, mode: meta.mode, is_public: meta.isPublic,
        library_description: meta.libraryDescription, blocks: newBlocks,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      router.push('/teacher/lessons')
      return true
    } else {
      setError(data.detail ? `${data.error || 'Ошибка'}: ${data.detail}` : (data.error || 'Ошибка'))
      return false
    }
  }

  async function handleDelete() {
    if (!confirm('Удалить урок?')) return
    const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/teacher/lessons')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Загрузка...
      </div>
    )
  }
  if (!lesson) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Урок не найден
      </div>
    )
  }

  return (
    <LessonBuilder
      backHref="/teacher/lessons"
      lessonId={id}
      initialTitle={lesson.title}
      initialSubject={lesson.subject || ''}
      initialGrade={lesson.grade || ''}
      initialStatus={lesson.status === 'published' ? 'published' : 'draft'}
      initialMode={lesson.mode === 'exam' ? 'exam' : 'quiz'}
      initialIsPublic={!!lesson.is_public}
      initialLibraryDescription={lesson.library_description || ''}
      initialBlocks={blocks}
      initialAssignedStudentIds={assignedStudentIds}
      locked={!!lesson.locked}
      authorName={lesson.author_name}
      canPublishToLibrary={canPublishToLibrary}
      saving={saving}
      error={error}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  )
}
