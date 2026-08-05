// Минимальный возраст для самостоятельной регистрации ученика без родителя.
// Рабочее значение, взятое по аналогии с распространённой практикой
// (14 лет — возраст частичной дееспособности по ГК РФ) — точную цифру
// для этой платформы нужно подтвердить с юристом, после чего просто
// поменять число здесь и в текстах /terms, /privacy, /oferta
export const MIN_STUDENT_SELF_REGISTER_AGE = 14

export function calculateAge(birthDateStr: string): number {
  const today = new Date()
  const dob = new Date(birthDateStr)
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}
