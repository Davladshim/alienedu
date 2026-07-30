import type { LessonBlockData } from './registry'

// Объединённые блоки хранят общий идентификатор группы прямо в content —
// отдельная колонка в БД не нужна, content и так произвольный JSON, а
// order_index уже гарантирует, что блоки одной группы стоят подряд
export const GROUP_ID_FIELD = '_groupId'

export function getGroupId(block: LessonBlockData): string | undefined {
  return block.content?.[GROUP_ID_FIELD] || undefined
}

// Группирует подряд идущие блоки с одинаковым _groupId в одну "страницу" —
// используется и в конструкторе (нумерация), и в предпросмотре/прохождении
// урока (объединённые блоки показываются на одной странице целиком)
export function groupBlocksIntoPages<T extends LessonBlockData>(blocks: T[]): T[][] {
  const pages: T[][] = []
  for (const block of blocks) {
    const gid = getGroupId(block)
    const last = pages[pages.length - 1]
    if (gid && last && last.length > 0 && getGroupId(last[0]) === gid) {
      last.push(block)
    } else {
      pages.push([block])
    }
  }
  return pages
}
