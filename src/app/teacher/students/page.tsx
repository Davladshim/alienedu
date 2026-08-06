'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { inputStyle, labelStyle, submitButtonStyle, submitButtonDisabledStyle, smallButtonStyle, removeButtonStyle } from '@/components/lesson-blocks/styles'
import { PlanGateModal } from '@/components/PlanGateModal'

function formatMoney(n: any): string {
  const num = Number(n) || 0
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

// Пояснение фиксированного размера над значком вместо нативного title —
// у браузерного title длинная подсказка растягивается в одну неудобную
// строку. Работает и по наведению (десктоп), и по тапу (телефон)
function HoverHint({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={e => { e.stopPropagation(); setShow(v => !v) }}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          width: '170px', background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '8px',
          padding: '8px 10px', fontSize: '12px', lineHeight: 1.4, color: 'var(--t-text-secondary)',
          textAlign: 'left', whiteSpace: 'normal', zIndex: 300, boxShadow: '0 8px 20px rgba(0,0,0,0.35)', cursor: 'default',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

// Сетка по 3 карточки в ряд — но на портретных телефонах/планшетах
// (<=900px) карточки слишком узкие даже для двух колонок, поэтому там
// список остаётся одной колонкой, как раньше
function useColumnCount(breakpoint = 900): number {
  const [cols, setCols] = useState(3)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setCols(mq.matches ? 1 : 3)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return cols
}

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addMode, setAddMode] = useState<'login' | 'name'>('login')
  const [login, setLogin] = useState('')
  const [newStudentName, setNewStudentName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const [linkingId, setLinkingId] = useState<number | null>(null)
  const [linkLogin, setLinkLogin] = useState('')
  const [linkError, setLinkError] = useState('')
  const [linking, setLinking] = useState(false)

  const [newFamilyName, setNewFamilyName] = useState('')
  const [creatingFamily, setCreatingFamily] = useState(false)

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [priceDraft, setPriceDraft] = useState('')
  const [familyDraft, setFamilyDraft] = useState('')
  const [gradeDraft, setGradeDraft] = useState('')
  const [parentNameDraft, setParentNameDraft] = useState('')
  const [callLinkDraft, setCallLinkDraft] = useState('')
  const [displayNameDraft, setDisplayNameDraft] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [savingRow, setSavingRow] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [savedFading, setSavedFading] = useState(false)
  const [history, setHistory] = useState<any[] | null>(null)
  const [rowError, setRowError] = useState('')

  const [expandedFamilyId, setExpandedFamilyId] = useState<number | null>(null)
  const [familyPaymentAmount, setFamilyPaymentAmount] = useState('')
  const [familyPaymentDescription, setFamilyPaymentDescription] = useState('')
  const [savingFamilyPayment, setSavingFamilyPayment] = useState(false)
  const [familyHistory, setFamilyHistory] = useState<any[] | null>(null)

  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)
  const [gate, setGate] = useState<{ needed: boolean; limit: number; activeCount: number } | null>(null)
  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => setPlan(data.plan === 'pro' ? 'pro' : 'free'))
  }, [])

  function loadAll() {
    Promise.all([
      fetch('/api/students').then(r => r.json()),
      fetch('/api/families').then(r => r.json()),
    ]).then(([studentsData, familiesData]) => {
      setStudents(studentsData.students || [])
      setGate(studentsData.gate || null)
      setFamilies(familiesData.families || [])
      setLoading(false)
    })
  }

  async function resolveStudentsGate(keepIds: number[]) {
    const res = await fetch('/api/students/resolve-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepIds }),
    })
    const data = await res.json()
    if (res.ok) {
      loadAll()
      return { ok: true }
    }
    return { ok: false, error: data.error }
  }

  useEffect(() => { loadAll() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const body = addMode === 'login' ? { login } : { full_name: newStudentName }
    if (addMode === 'login' && !login.trim()) return
    if (addMode === 'name' && !newStudentName.trim()) return
    setAdding(true)
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) {
      setLogin('')
      setNewStudentName('')
      loadAll()
    } else {
      setError(data.detail ? `${data.error || 'Ошибка'}: ${data.detail}` : (data.error || 'Ошибка'))
    }
  }

  function openLinkForm(studentRowId: number) {
    setLinkingId(linkingId === studentRowId ? null : studentRowId)
    setLinkLogin('')
    setLinkError('')
  }

  async function submitLink(studentRowId: number) {
    if (!linkLogin.trim()) return
    setLinking(true)
    setLinkError('')
    const res = await fetch(`/api/students/${studentRowId}/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: linkLogin }),
    })
    const data = await res.json()
    setLinking(false)
    if (res.ok) {
      setLinkingId(null)
      setLinkLogin('')
      loadAll()
    } else {
      setLinkError(data.error || 'Ошибка')
    }
  }

  async function handleRemove(id: number) {
    if (!confirm('Убрать ученика из списка? Ещё не проведённые занятия и шаблон с ним удалятся, проведённые останутся в истории.')) return
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setStudents(s => s.filter(st => st.id !== id))
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Не удалось убрать ученика')
    }
  }

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault()
    if (!newFamilyName.trim()) return
    setCreatingFamily(true)
    const res = await fetch('/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFamilyName }),
    })
    setCreatingFamily(false)
    if (res.ok) {
      setNewFamilyName('')
      loadAll()
    }
  }

  async function handleDeleteFamily(id: number) {
    if (!confirm('Удалить семью? Ученики останутся в списке со своим личным балансом, просто больше не будут сгруппированы.')) return
    const res = await fetch(`/api/families/${id}`, { method: 'DELETE' })
    if (res.ok) {
      loadAll()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Не удалось удалить семью')
    }
  }

  function openRow(student: any) {
    if (expandedId === student.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(student.id)
    setPriceDraft(student.lesson_price ?? '')
    setFamilyDraft(student.family_id ?? '')
    setGradeDraft(student.grade ?? '')
    setParentNameDraft(student.parent_name ?? '')
    setCallLinkDraft(student.call_link ?? '')
    setDisplayNameDraft(student.display_name ?? '')
    setPaymentAmount('')
    setPaymentDescription('')
    setHistory(null)
    setRowError('')
  }

  async function saveRowSettings(studentRowId: number) {
    if (priceDraft !== '' && Number(priceDraft) < 0) {
      setRowError('Стоимость занятия не может быть отрицательной')
      return
    }
    setRowError('')
    setSavingRow(true)
    const res = await fetch(`/api/students/${studentRowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_price: priceDraft === '' ? null : Number(priceDraft),
        family_id: familyDraft === '' ? null : Number(familyDraft),
        grade: gradeDraft === '' ? null : Number(gradeDraft),
        parent_name: parentNameDraft === '' ? null : parentNameDraft,
        call_link: callLinkDraft.trim() === '' ? null : callLinkDraft.trim(),
        display_name: displayNameDraft.trim() === '' ? null : displayNameDraft.trim(),
      }),
    })
    setSavingRow(false)
    if (res.ok) {
      setExpandedId(null)
      setSavedId(studentRowId)
      setSavedFading(false)
      setTimeout(() => setSavedFading(true), 1200)
      setTimeout(() => setSavedId(id => (id === studentRowId ? null : id)), 2000)
    } else {
      const data = await res.json().catch(() => ({}))
      setRowError(data.error || 'Не удалось сохранить')
    }
    loadAll()
  }

  async function submitPayment(studentRowId: number) {
    if (!paymentAmount || Number.isNaN(Number(paymentAmount))) return
    setSavingRow(true)
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_student_id: studentRowId,
        amount: Number(paymentAmount),
        description: paymentDescription || null,
      }),
    })
    setSavingRow(false)
    setPaymentAmount('')
    setPaymentDescription('')
    loadAll()
  }

  function loadHistory(studentRowId: number) {
    fetch(`/api/payments?teacher_student_id=${studentRowId}`)
      .then(r => r.json())
      .then(data => setHistory(data.payments || []))
  }

  function openFamilyPayment(familyId: number) {
    setExpandedFamilyId(expandedFamilyId === familyId ? null : familyId)
    setFamilyPaymentAmount('')
    setFamilyPaymentDescription('')
    setFamilyHistory(null)
  }

  async function submitFamilyPayment(familyId: number) {
    if (!familyPaymentAmount || Number.isNaN(Number(familyPaymentAmount))) return
    setSavingFamilyPayment(true)
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        family_id: familyId,
        amount: Number(familyPaymentAmount),
        description: familyPaymentDescription || null,
      }),
    })
    setSavingFamilyPayment(false)
    setFamilyPaymentAmount('')
    setFamilyPaymentDescription('')
    loadAll()
  }

  function loadFamilyHistory(familyId: number) {
    fetch(`/api/payments?family_id=${familyId}`)
      .then(r => r.json())
      .then(data => setFamilyHistory(data.payments || []))
  }

  const archivedCount = students.filter(s => s.archived_at).length
  const cols = useColumnCount()

  async function handleGateCodeRedeemed() {
    fetch('/api/me').then(r => r.json()).then(data => setPlan(data.plan === 'pro' ? 'pro' : 'free'))
    loadAll()
  }

  return (
    <div style={{
      minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif',
      color: 'var(--t-text)', display: 'flex', justifyContent: 'center',
    }}>
      {gate?.needed && (
        <PlanGateModal
          title="Pro-подписка закончилась"
          description={`Аккаунт автоматически переключён на бесплатный тариф — на нём доступны только ${gate.limit} учеников. Выберите, кто останется активным: остальные будут временно заморожены (архивированы) на 6 месяцев — их данные, расписание и оплаты никуда не денутся, просто пока не будут видны. Как только вы снова активируете Pro, все вернутся на свои места.`}
          items={students.filter(s => !s.archived_at).map(s => ({
            id: s.id,
            label: s.full_name,
            sublabel: s.family_name ? `семья: ${s.family_name}` : undefined,
          }))}
          mode="multi"
          limit={gate.limit}
          confirmLabel="Оставить выбранных активными"
          onConfirm={resolveStudentsGate}
          onCodeRedeemed={handleGateCodeRedeemed}
        />
      )}
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Link href="/teacher" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>
            ← Кабинет
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>👥 Мои ученики</h1>
        </div>

        {archivedCount > 0 && !gate?.needed && (
          <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginBottom: '1rem' }}>
            В архиве: {archivedCount} {archivedCount === 1 ? 'ученик' : 'учеников'} (заморожены из-за окончания Pro) — вернутся при активации Pro.
          </div>
        )}

        {plan === 'free' && (
          <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginBottom: '1rem' }}>
            Бесплатный тариф: {students.length} из 5 учеников. {students.length >= 5 && (
              <>Чтобы добавить больше — <Link href="/teacher/tariffs" style={{ color: 'var(--t-accent)' }}>перейдите на Pro</Link>.</>
            )}
          </div>
        )}

        {/* Добавить ученика */}
        <div style={{
          background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
          padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>
            Мои ученики · {students.length} {students.length === 1 ? 'ученик' : 'учеников'}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setAddMode('login')}
              style={{
                background: addMode === 'login' ? 'var(--t-accent)' : 'var(--t-bg)',
                color: addMode === 'login' ? '#fff' : 'var(--t-text-secondary)',
                border: '1px solid var(--t-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
              }}
            >
              Уже зарегистрирован
            </button>
            <button
              type="button"
              onClick={() => setAddMode('name')}
              style={{
                background: addMode === 'name' ? 'var(--t-accent)' : 'var(--t-bg)',
                color: addMode === 'name' ? '#fff' : 'var(--t-text-secondary)',
                border: '1px solid var(--t-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
              }}
            >
              Ещё не зарегистрирован
            </button>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            {addMode === 'login' ? (
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Логин ученика</label>
                <input
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  style={inputStyle}
                  placeholder="Логин, который ученик указал при регистрации"
                />
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Имя ученика</label>
                <input
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  style={inputStyle}
                  placeholder="Как записать в расписании, например «Аня Иванова»"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={adding || (addMode === 'login' ? !login.trim() : !newStudentName.trim())}
              style={adding || (addMode === 'login' ? !login.trim() : !newStudentName.trim()) ? submitButtonDisabledStyle : submitButtonStyle}
            >
              {adding ? 'Добавляем...' : '+ Добавить'}
            </button>
          </form>
          {addMode === 'name' && (
            <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginTop: '8px' }}>
              Можно сразу планировать занятия и вести оплату. Когда ученик зарегистрируется сам — привяжите его аккаунт кнопкой в карточке, и вся история перенесётся.
            </div>
          )}
        </div>

        {/* Семьи */}
        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>
            Семьи (общий баланс на нескольких учеников) · {families.length}
          </div>
          {families.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {families.map(f => {
                const pool = Number(f.balance)
                const netBalance = Number(f.net_balance)
                const avgPrice = Number(f.avg_lesson_price)
                const available = pool > 0 && avgPrice > 0 ? Math.floor(pool / avgPrice) : 0
                return (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '6px 0' }}>
                    <span>{f.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ whiteSpace: 'nowrap', color: netBalance < 0 ? 'var(--t-danger-soft)' : 'var(--t-text-secondary)' }}>
                        {formatMoney(netBalance)} ₽{available > 0 && ` · доступно ${available} ${available === 1 ? 'занятие' : 'занятий'}`}
                      </span>
                      <button
                        onClick={() => handleDeleteFamily(f.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <form onSubmit={handleCreateFamily} style={{ display: 'flex', gap: '10px' }}>
            <input value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Название семьи, например «Ивановы»" />
            <button type="submit" disabled={creatingFamily || !newFamilyName.trim()} style={creatingFamily || !newFamilyName.trim() ? submitButtonDisabledStyle : smallButtonStyle}>
              + Создать
            </button>
          </form>
        </div>

        {error && <p style={{ color: 'var(--t-danger)', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && students.length === 0 && (
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: 'var(--t-text-muted)',
          }}>
            Пока нет учеников — добавьте по логину выше, если ученик уже зарегистрирован,
            <br />
            или просто по имени, если ещё нет — аккаунт можно будет привязать позже.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {families.map(family => {
            const members = students.filter(s => s.family_id === family.id)
            if (members.length === 0) return null
            const pool = Number(family.balance)
            const netBalance = Number(family.net_balance)
            const avgPrice = Number(family.avg_lesson_price)
            const available = pool > 0 && avgPrice > 0 ? Math.floor(pool / avgPrice) : 0
            return (
              <div key={`family-${family.id}`} style={{ border: '1px solid var(--t-accent)', borderRadius: '16px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 10px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t-accent)' }}>👪 {family.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', whiteSpace: 'nowrap', color: netBalance < 0 ? 'var(--t-danger-soft)' : 'var(--t-text-secondary)' }}>
                      {formatMoney(netBalance)} ₽{available > 0 && ` · доступно ${available} ${available === 1 ? 'занятие' : 'занятий'}`}
                    </span>
                    <button
                      onClick={() => openFamilyPayment(family.id)}
                      style={{ background: 'rgba(79,142,247,0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)', cursor: 'pointer', fontSize: '12px', borderRadius: '6px', padding: '4px 10px' }}
                    >
                      Пополнить баланс
                    </button>
                  </div>
                </div>

                {expandedFamilyId === family.id && (
                  <div style={{ background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                    <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Пополнить баланс семьи</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <input type="number" value={familyPaymentAmount} onChange={e => setFamilyPaymentAmount(e.target.value)} style={{ ...inputStyle, width: '120px' }} placeholder="Сумма" />
                      <input value={familyPaymentDescription} onChange={e => setFamilyPaymentDescription(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '160px' }} placeholder="Комментарий (необязательно)" />
                      <button
                        onClick={() => submitFamilyPayment(family.id)}
                        disabled={savingFamilyPayment || !familyPaymentAmount}
                        style={savingFamilyPayment || !familyPaymentAmount ? submitButtonDisabledStyle : submitButtonStyle}
                      >
                        + Оплата
                      </button>
                    </div>
                    {familyHistory === null ? (
                      <button onClick={() => loadFamilyHistory(family.id)} style={{ background: 'none', border: 'none', color: 'var(--t-accent)', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                        Показать историю платежей
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                        {familyHistory.length === 0 && <div style={{ color: 'var(--t-text-faint)', fontSize: '13px' }}>Платежей ещё не было</div>}
                        {familyHistory.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--t-text-secondary)' }}>
                            <span>{p.description || 'Пополнение'} · {new Date(p.payment_date).toLocaleDateString('ru-RU')}</span>
                            <span style={{ color: 'var(--t-success)' }}>+{formatMoney(p.amount)} ₽</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {renderStudentGrid(members)}
              </div>
            )
          })}

          {renderStudentGrid(students.filter(s => !s.family_id))}
        </div>

      </div>
    </div>
  )

  // Компактная карточка-заголовок — только то, что нужно для узнавания
  // ученика и клика для разворачивания. Кнопки "Убрать"/"Привязать аккаунт"
  // теперь внутри развёрнутой карточки (renderStudentDetail), чтобы здесь
  // оставалось больше места для ФИО и статуса
  function renderStudentHeader(student: any) {
    if (student.archived_at) {
      return (
        <div key={student.id} style={{
          background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px',
          padding: '14px 18px', opacity: 0.5,
        }}>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{student.full_name}</div>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '2px' }}>
            {student.is_placeholder ? 'ждём регистрацию' : `@${student.login}`}
          </div>
          <span style={{
            display: 'inline-block', marginTop: '8px', fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(107,114,128,0.15)', color: 'var(--t-text-muted)', whiteSpace: 'nowrap',
          }}>
            📦 В архиве
          </span>
        </div>
      )
    }
    const isOpen = expandedId === student.id
    return (
      <div
        key={student.id}
        onClick={() => openRow(student)}
        style={{
          background: 'var(--t-card)', border: `2px solid ${isOpen ? 'var(--t-accent)' : 'var(--t-border)'}`,
          borderRadius: '12px', padding: '14px 18px', cursor: 'pointer',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '15px' }}>
          {student.full_name}{' '}
          {student.is_placeholder && (
            <HoverHint text="Карточку завёл репетитор — ученик ещё не зарегистрировался и не привязан к своему аккаунту">
              <span style={{ color: 'var(--t-warning)', fontSize: '13px' }}>⏳</span>
            </HoverHint>
          )}
          {savedId === student.id && (
            <span style={{ color: 'var(--t-success)', fontSize: '12px', fontWeight: 500, transition: 'opacity 0.8s', opacity: savedFading ? 0 : 1 }}>
              {' '}✓ Сохранено
            </span>
          )}
        </div>
        <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '2px' }}>
          {[
            student.is_placeholder ? null : `@${student.login}`,
            student.family_name ? `семья: ${student.family_name}` : null,
            student.display_name ? `настоящее имя: ${student.account_name}` : null,
            Number(student.assigned_count) > 0 ? `уроков пройдено: ${student.completed_count}/${student.assigned_count}` : null,
          ].filter(Boolean).join(' · ')}
        </div>
        <div style={{ marginTop: '8px', fontSize: '14px', whiteSpace: 'nowrap', color: Number(student.balance) < 0 ? 'var(--t-danger-soft)' : 'var(--t-text-secondary)' }}>
          {formatMoney(student.balance)} ₽
        </div>
        {student.lesson_price === null && (
          <div style={{ color: 'var(--t-danger-soft)', fontSize: '12px', marginTop: '4px' }}>
            Стоимость занятия не указана
          </div>
        )}
      </div>
    )
  }

  // Развёрнутая карточка — настройки, привязка аккаунта, удаление, оплата
  // и история. Появляется на всю ширину под строкой, где стоит карточка
  // открытого ученика (см. вызовы renderStudentDetail выше)
  function renderStudentDetail(student: any) {
    return (
      <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-accent)', borderRadius: '12px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div style={{ minWidth: '200px' }}>
            <label style={labelStyle}>Отображаемое имя</label>
            <input
              type="text" value={displayNameDraft} onChange={e => setDisplayNameDraft(e.target.value)}
              style={inputStyle} placeholder={student.account_name || student.full_name}
            />
          </div>
          <div>
            <label style={labelStyle}>Стоимость занятия, ₽</label>
            <input type="number" min="0" value={priceDraft} onChange={e => setPriceDraft(e.target.value)} style={{ ...inputStyle, width: '120px' }} placeholder="не задана" />
            {priceDraft === '' && (
              <div style={{ color: 'var(--t-danger-soft)', fontSize: '12px', marginTop: '4px', maxWidth: '160px' }}>
                Стоимость не указана
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Класс</label>
            <input type="number" value={gradeDraft} onChange={e => setGradeDraft(e.target.value)} style={{ ...inputStyle, width: '80px' }} />
          </div>
          <div>
            <label style={labelStyle}>Имя родителя</label>
            <input type="text" value={parentNameDraft} onChange={e => setParentNameDraft(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
          </div>
          <div>
            <label style={labelStyle}>Семья</label>
            <select value={familyDraft} onChange={e => setFamilyDraft(e.target.value)} style={inputStyle}>
              <option value="">Выбрать</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={labelStyle}>Ссылка на звонок (необязательно)</label>
            <input type="text" value={callLinkDraft} onChange={e => setCallLinkDraft(e.target.value)} style={inputStyle} placeholder="Zoom / Телемост / Telegram и т.д." />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button onClick={() => saveRowSettings(student.id)} disabled={savingRow} style={savingRow ? submitButtonDisabledStyle : smallButtonStyle}>
              Сохранить
            </button>
          </div>
        </div>

        {rowError && <p style={{ color: 'var(--t-danger)', fontSize: '13px', marginTop: '-6px', marginBottom: '14px' }}>{rowError}</p>}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--t-border)' }}>
          {student.is_placeholder && (
            <button
              onClick={() => openLinkForm(student.id)}
              style={{ background: 'none', border: '1px solid var(--t-accent)', color: 'var(--t-accent)', cursor: 'pointer', fontSize: '13px', borderRadius: '8px', padding: '6px 14px' }}
            >
              {linkingId === student.id ? 'Отменить привязку' : 'Привязать аккаунт'}
            </button>
          )}
          <button onClick={() => handleRemove(student.id)} style={removeButtonStyle}>
            Убрать ученика из списка
          </button>
        </div>

        {linkingId === student.id && (
          <div style={{ background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '10px', padding: '14px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={labelStyle}>Логин аккаунта ученика</label>
              <input
                value={linkLogin}
                onChange={e => setLinkLogin(e.target.value)}
                style={inputStyle}
                placeholder="Логин, который ученик указал при регистрации"
              />
            </div>
            <button
              onClick={() => submitLink(student.id)}
              disabled={linking || !linkLogin.trim()}
              style={linking || !linkLogin.trim() ? submitButtonDisabledStyle : submitButtonStyle}
            >
              {linking ? 'Привязываем...' : 'Привязать'}
            </button>
            {linkError && <p style={{ color: 'var(--t-danger)', fontSize: '13px', width: '100%', margin: 0 }}>{linkError}</p>}
          </div>
        )}

        {student.family_id ? (
          <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>
            Баланс пополняется на уровне семьи — кнопка «Пополнить баланс» в шапке семьи выше.
            Здесь виден только личный баланс ученика за уже проведённые занятия.
          </div>
        ) : (
          <>
            <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Пополнить баланс</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ ...inputStyle, width: '120px' }} placeholder="Сумма" />
              <input value={paymentDescription} onChange={e => setPaymentDescription(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '160px' }} placeholder="Комментарий (необязательно)" />
              <button onClick={() => submitPayment(student.id)} disabled={savingRow || !paymentAmount} style={savingRow || !paymentAmount ? submitButtonDisabledStyle : submitButtonStyle}>
                + Оплата
              </button>
            </div>

            {history === null ? (
              <button onClick={() => loadHistory(student.id)} style={{ background: 'none', border: 'none', color: 'var(--t-accent)', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                Показать историю платежей
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {history.length === 0 && <div style={{ color: 'var(--t-text-faint)', fontSize: '13px' }}>Платежей ещё не было</div>}
                {history.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--t-text-secondary)' }}>
                    <span>{p.description || 'Пополнение'} · {new Date(p.payment_date).toLocaleDateString('ru-RU')}</span>
                    <span style={{ color: 'var(--t-success)' }}>+{formatMoney(p.amount)} ₽</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Список учеников сеткой по `cols` в ряд — используется и для учеников
  // без семьи, и для членов одной семьи (каждая семья — свой вызов, так
  // что у неё всегда отдельная строка/строки, даже если она не заполнена
  // до полного ряда). Открытая карточка разворачивается под своим рядом
  function renderStudentGrid(list: any[]) {
    const rows: any[][] = []
    for (let i = 0; i < list.length; i += cols) rows.push(list.slice(i, i + cols))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.map((row, ri) => {
          const openStudent = row.find(s => s.id === expandedId)
          return (
            <div key={ri}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '10px' }}>
                {row.map(student => renderStudentHeader(student))}
              </div>
              {openStudent && (
                <div style={{ marginTop: '10px' }}>
                  {renderStudentDetail(openStudent)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
}
