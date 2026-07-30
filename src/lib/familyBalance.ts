import { query } from './db'

// Новая модель баланса семьи: положительный баланс существует только на
// уровне семьи (families.balance, всегда >= 0) — это ещё не распределённые
// деньги. Долг за проведённые занятия — всегда персональный, у конкретного
// ученика (teacher_students.balance, всегда <= 0), потому что известно,
// с кем именно было занятие. У ученика без семьи баланс как раньше — единое
// число, может быть как положительным, так и отрицательным.

// Списание за занятие: сначала тратится семейный пул, то, что он не
// покрыл, становится личным долгом ученика
export async function chargeForLesson(teacherStudentId: number, familyId: number | null, amount: number) {
  if (familyId) {
    const familyResult = await query(`SELECT balance FROM families WHERE id = $1`, [familyId])
    const familyBalance = Number(familyResult.rows[0]?.balance || 0)
    const fromPool = Math.min(Math.max(familyBalance, 0), amount)
    const shortfall = amount - fromPool
    if (fromPool > 0) {
      await query(`UPDATE families SET balance = balance - $1 WHERE id = $2`, [fromPool, familyId])
    }
    if (shortfall > 0) {
      await query(`UPDATE teacher_students SET balance = balance - $1 WHERE id = $2`, [shortfall, teacherStudentId])
    }
  } else {
    await query(`UPDATE teacher_students SET balance = balance - $1 WHERE id = $2`, [amount, teacherStudentId])
  }
}

// Применяем пул семьи к уже накопленным личным долгам её учеников — нужно
// вызывать сразу после пополнения баланса семьи, иначе деньги просто лежат
// в пуле и не гасят долг, начисленный за уже прошедшие занятия
export async function settleFamilyDebts(familyId: number) {
  const familyResult = await query(`SELECT balance FROM families WHERE id = $1`, [familyId])
  let pool = Number(familyResult.rows[0]?.balance || 0)
  if (pool <= 0) return

  const studentsResult = await query(
    `SELECT id, balance FROM teacher_students WHERE family_id = $1 AND balance < 0 ORDER BY id`,
    [familyId]
  )

  for (const student of studentsResult.rows) {
    if (pool <= 0) break
    const debt = -Number(student.balance)
    const toPay = Math.min(debt, pool)
    if (toPay > 0) {
      await query(`UPDATE teacher_students SET balance = balance + $1 WHERE id = $2`, [toPay, student.id])
      await query(`UPDATE families SET balance = balance - $1 WHERE id = $2`, [toPay, familyId])
      pool -= toPay
    }
  }
}

// Обратная операция (например, отмена уже списанного занятия): сначала
// гасим личный долг ученика (не выше нуля), остаток возвращается в семейный пул
export async function refundForLesson(teacherStudentId: number, familyId: number | null, amount: number) {
  if (familyId) {
    const studentResult = await query(`SELECT balance FROM teacher_students WHERE id = $1`, [teacherStudentId])
    const studentBalance = Number(studentResult.rows[0]?.balance || 0)
    const debt = Math.max(0, -studentBalance)
    const toDebt = Math.min(debt, amount)
    const toPool = amount - toDebt
    if (toDebt > 0) {
      await query(`UPDATE teacher_students SET balance = balance + $1 WHERE id = $2`, [toDebt, teacherStudentId])
    }
    if (toPool > 0) {
      await query(`UPDATE families SET balance = balance + $1 WHERE id = $2`, [toPool, familyId])
    }
  } else {
    await query(`UPDATE teacher_students SET balance = balance + $1 WHERE id = $2`, [amount, teacherStudentId])
  }
}
