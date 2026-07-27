'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { inputStyle, labelStyle, submitButtonStyle, submitButtonDisabledStyle, smallButtonStyle } from '@/components/lesson-blocks/styles'

function formatMoney(n: any): string {
  const num = Number(n) || 0
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
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
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [savingRow, setSavingRow] = useState(false)
  const [history, setHistory] = useState<any[] | null>(null)

  const [expandedFamilyId, setExpandedFamilyId] = useState<number | null>(null)
  const [familyPaymentAmount, setFamilyPaymentAmount] = useState('')
  const [familyPaymentDescription, setFamilyPaymentDescription] = useState('')
  const [savingFamilyPayment, setSavingFamilyPayment] = useState(false)
  const [familyHistory, setFamilyHistory] = useState<any[] | null>(null)

  function loadAll() {
    Promise.all([
      fetch('/api/students').then(r => r.json()),
      fetch('/api/families').then(r => r.json()),
    ]).then(([studentsData, familiesData]) => {
      setStudents(studentsData.students || [])
      setFamilies(familiesData.families || [])
      setLoading(false)
    })
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
    setPaymentAmount('')
    setPaymentDescription('')
    setHistory(null)
  }

  async function saveRowSettings(studentRowId: number) {
    setSavingRow(true)
    await fetch(`/api/students/${studentRowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_price: priceDraft === '' ? null : Number(priceDraft),
        family_id: familyDraft === '' ? null : Number(familyDraft),
      }),
    })
    setSavingRow(false)
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

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif',
      color: '#fff', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Кабинет
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>👥 Мои ученики</h1>
        </div>

        {/* Семьи */}
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Семьи (общий баланс на нескольких учеников)</div>
          {families.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {families.map(f => {
                const balance = Number(f.balance)
                const avgPrice = Number(f.avg_lesson_price)
                const available = balance > 0 && avgPrice > 0 ? Math.floor(balance / avgPrice) : 0
                return (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '6px 0' }}>
                    <span>{f.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: balance < 0 ? '#f87171' : '#9ca3af' }}>
                        {formatMoney(f.balance)} ₽{available > 0 && ` · доступно ${available} ${available === 1 ? 'занятие' : 'занятий'}`}
                      </span>
                      <button
                        onClick={() => handleDeleteFamily(f.id)}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px' }}
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

        {/* Добавить ученика */}
        <div style={{
          background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
          padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setAddMode('login')}
              style={{
                background: addMode === 'login' ? '#4f8ef7' : '#0f1117',
                color: addMode === 'login' ? '#fff' : '#9ca3af',
                border: '1px solid #2a2d3d', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
              }}
            >
              Уже зарегистрирован
            </button>
            <button
              type="button"
              onClick={() => setAddMode('name')}
              style={{
                background: addMode === 'name' ? '#4f8ef7' : '#0f1117',
                color: addMode === 'name' ? '#fff' : '#9ca3af',
                border: '1px solid #2a2d3d', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
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
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
              Можно сразу планировать занятия и вести оплату. Когда ученик зарегистрируется сам — привяжи его аккаунт кнопкой в карточке, и вся история перенесётся.
            </div>
          )}
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        {!loading && students.length === 0 && (
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: '#6b7280',
          }}>
            Пока нет учеников — добавь по логину выше, если ученик уже зарегистрирован,
            <br />
            или просто по имени, если ещё нет — аккаунт можно будет привязать позже.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {families.map(family => {
            const members = students.filter(s => s.family_id === family.id)
            if (members.length === 0) return null
            const balance = Number(family.balance)
            const avgPrice = Number(family.avg_lesson_price)
            const available = balance > 0 && avgPrice > 0 ? Math.floor(balance / avgPrice) : 0
            return (
              <div key={`family-${family.id}`} style={{ border: '1px solid #4f8ef7', borderRadius: '16px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 10px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#4f8ef7' }}>👪 {family.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: balance < 0 ? '#f87171' : '#9ca3af' }}>
                      {formatMoney(family.balance)} ₽{available > 0 && ` · доступно ${available} ${available === 1 ? 'занятие' : 'занятий'}`}
                    </span>
                    <button
                      onClick={() => openFamilyPayment(family.id)}
                      style={{ background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7', color: '#4f8ef7', cursor: 'pointer', fontSize: '12px', borderRadius: '6px', padding: '4px 10px' }}
                    >
                      Пополнить баланс
                    </button>
                  </div>
                </div>

                {expandedFamilyId === family.id && (
                  <div style={{ background: '#0f1117', border: '1px solid #2a2d3d', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Пополнить баланс семьи</div>
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
                      <button onClick={() => loadFamilyHistory(family.id)} style={{ background: 'none', border: 'none', color: '#4f8ef7', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                        Показать историю платежей
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                        {familyHistory.length === 0 && <div style={{ color: '#4b5563', fontSize: '13px' }}>Платежей ещё не было</div>}
                        {familyHistory.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9ca3af' }}>
                            <span>{p.description || 'Пополнение'} · {new Date(p.payment_date).toLocaleDateString('ru-RU')}</span>
                            <span style={{ color: '#34d399' }}>+{formatMoney(p.amount)} ₽</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {members.map(student => renderStudentCard(student))}
                </div>
              </div>
            )
          })}

          {students.filter(s => !s.family_id).map(student => renderStudentCard(student))}
        </div>

      </div>
    </div>
  )

  function renderStudentCard(student: any) {
    const isOpen = expandedId === student.id
    return (
      <div key={student.id} style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px' }}>
                <div
                  onClick={() => openRow(student)}
                  style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {student.full_name}
                      {student.is_placeholder && (
                        <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '11px', padding: '2px 8px', borderRadius: '999px' }}>
                          не зарегистрирован
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                      {student.is_placeholder ? 'ждём регистрацию' : `@${student.login}`}{student.family_name ? ` · семья: ${student.family_name}` : ''}
                      {Number(student.assigned_count) > 0 && ` · уроков пройдено: ${student.completed_count}/${student.assigned_count}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '14px', color: Number(student.balance) < 0 ? '#f87171' : '#9ca3af' }}>
                      {formatMoney(student.balance)} ₽
                    </span>
                    {student.is_placeholder && (
                      <button
                        onClick={e => { e.stopPropagation(); openLinkForm(student.id) }}
                        style={{ background: 'none', border: '1px solid #4f8ef7', color: '#4f8ef7', cursor: 'pointer', fontSize: '12px', borderRadius: '6px', padding: '4px 10px' }}
                      >
                        Привязать аккаунт
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(student.id) }}
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Убрать
                    </button>
                  </div>
                </div>

                {linkingId === student.id && (
                  <div style={{ borderTop: '1px solid #2a2d3d', padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <label style={labelStyle}>Логин реального аккаунта ученика</label>
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
                    {linkError && <p style={{ color: '#ef4444', fontSize: '13px', width: '100%', margin: 0 }}>{linkError}</p>}
                  </div>
                )}

                {isOpen && (
                  <div style={{ borderTop: '1px solid #2a2d3d', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <div>
                        <label style={labelStyle}>Стоимость занятия, ₽</label>
                        <input type="number" value={priceDraft} onChange={e => setPriceDraft(e.target.value)} style={{ ...inputStyle, width: '120px' }} placeholder="1500" />
                      </div>
                      <div>
                        <label style={labelStyle}>Семья</label>
                        <select value={familyDraft} onChange={e => setFamilyDraft(e.target.value)} style={inputStyle}>
                          <option value="">Без семьи</option>
                          {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div style={{ alignSelf: 'flex-end' }}>
                        <button onClick={() => saveRowSettings(student.id)} disabled={savingRow} style={savingRow ? submitButtonDisabledStyle : smallButtonStyle}>
                          Сохранить
                        </button>
                      </div>
                    </div>

                    {student.family_id ? (
                      <div style={{ color: '#6b7280', fontSize: '13px' }}>
                        Баланс пополняется на уровне семьи — кнопка «Пополнить баланс» в шапке семьи выше.
                        Здесь виден только личный долг ученика за уже проведённые занятия.
                      </div>
                    ) : (
                      <>
                        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Пополнить баланс</div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ ...inputStyle, width: '120px' }} placeholder="Сумма" />
                          <input value={paymentDescription} onChange={e => setPaymentDescription(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '160px' }} placeholder="Комментарий (необязательно)" />
                          <button onClick={() => submitPayment(student.id)} disabled={savingRow || !paymentAmount} style={savingRow || !paymentAmount ? submitButtonDisabledStyle : submitButtonStyle}>
                            + Оплата
                          </button>
                        </div>

                        {history === null ? (
                          <button onClick={() => loadHistory(student.id)} style={{ background: 'none', border: 'none', color: '#4f8ef7', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                            Показать историю платежей
                          </button>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                            {history.length === 0 && <div style={{ color: '#4b5563', fontSize: '13px' }}>Платежей ещё не было</div>}
                            {history.map(p => (
                              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9ca3af' }}>
                                <span>{p.description || 'Пополнение'} · {new Date(p.payment_date).toLocaleDateString('ru-RU')}</span>
                                <span style={{ color: '#34d399' }}>+{formatMoney(p.amount)} ₽</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
      </div>
    )
  }
}
