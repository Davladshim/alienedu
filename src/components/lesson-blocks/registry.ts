import type { ComponentType } from 'react'
import { TheoryEditor, TheoryPlayer, theoryDefault } from './TheoryBlock'
import { SingleChoiceEditor, SingleChoicePlayer, singleChoiceDefault, checkSingleChoice, describeSingleChoiceAnswer } from './SingleChoiceBlock'
import { MultiChoiceEditor, MultiChoicePlayer, multiChoiceDefault, checkMultiChoice, describeMultiChoiceAnswer } from './MultiChoiceBlock'
import { ShortTextEditor, ShortTextPlayer, shortTextDefault, checkShortText, describeShortTextAnswer } from './ShortTextBlock'
import { NumericEditor, NumericPlayer, numericDefault, checkNumeric, describeNumericAnswer } from './NumericBlock'
import { MatchingEditor, MatchingPlayer, matchingDefault, checkMatching, describeMatchingAnswer } from './MatchingBlock'
import { OrderingEditor, OrderingPlayer, orderingDefault, checkOrdering, describeOrderingAnswer } from './OrderingBlock'
import { FillBlankEditor, FillBlankPlayer, fillBlankDefault, checkFillBlank, describeFillBlankAnswer } from './FillBlankBlock'
import { GeometryEditor, GeometryPlayer, geometryDefault } from './GeometryBlock'
import { AlgebraEditor, AlgebraPlayer, algebraDefault } from './AlgebraBlock'

export type BlockType =
  | 'theory' | 'single-choice' | 'multi-choice' | 'short-text' | 'numeric'
  | 'matching' | 'ordering' | 'fill-blank' | 'geometry' | 'algebra'

export interface LessonBlockData {
  id: string
  type: BlockType
  content: any
}

export interface BlockDefinition {
  type: BlockType
  label: string
  icon: string
  defaultContent: any
  Editor: ComponentType<any>
  Player: ComponentType<any>
  // null — блок без автопроверки (теория), проходится по кнопке "Далее"
  checkAnswer: ((content: any, answer: any) => boolean) | null
  // человекочитаемое описание правильного ответа — для экрана разбора ответов
  describeAnswer?: (content: any) => string
  // блок без автопроверки, но требующий явной отправки ответа (учитель проверяет вручную),
  // в отличие от теории, которую достаточно просто прочитать
  manualReview?: boolean
}

export const blockRegistry: Record<BlockType, BlockDefinition> = {
  theory: {
    type: 'theory', label: 'Теория', icon: '📖',
    defaultContent: theoryDefault, Editor: TheoryEditor, Player: TheoryPlayer,
    checkAnswer: null,
  },
  'single-choice': {
    type: 'single-choice', label: 'Один правильный ответ', icon: '☑️',
    defaultContent: singleChoiceDefault, Editor: SingleChoiceEditor, Player: SingleChoicePlayer,
    checkAnswer: checkSingleChoice, describeAnswer: describeSingleChoiceAnswer,
  },
  'multi-choice': {
    type: 'multi-choice', label: 'Несколько правильных ответов', icon: '✅',
    defaultContent: multiChoiceDefault, Editor: MultiChoiceEditor, Player: MultiChoicePlayer,
    checkAnswer: checkMultiChoice, describeAnswer: describeMultiChoiceAnswer,
  },
  'short-text': {
    type: 'short-text', label: 'Короткий текстовый ответ', icon: '✏️',
    defaultContent: shortTextDefault, Editor: ShortTextEditor, Player: ShortTextPlayer,
    checkAnswer: checkShortText, describeAnswer: describeShortTextAnswer,
  },
  numeric: {
    type: 'numeric', label: 'Числовой ответ (формулы через $...$)', icon: '🔢',
    defaultContent: numericDefault, Editor: NumericEditor, Player: NumericPlayer,
    checkAnswer: checkNumeric, describeAnswer: describeNumericAnswer,
  },
  matching: {
    type: 'matching', label: 'Сопоставление пар', icon: '🔗',
    defaultContent: matchingDefault, Editor: MatchingEditor, Player: MatchingPlayer,
    checkAnswer: checkMatching, describeAnswer: describeMatchingAnswer,
  },
  ordering: {
    type: 'ordering', label: 'Порядок шагов', icon: '🔀',
    defaultContent: orderingDefault, Editor: OrderingEditor, Player: OrderingPlayer,
    checkAnswer: checkOrdering, describeAnswer: describeOrderingAnswer,
  },
  'fill-blank': {
    type: 'fill-blank', label: 'Заполнение пропусков', icon: '📝',
    defaultContent: fillBlankDefault, Editor: FillBlankEditor, Player: FillBlankPlayer,
    checkAnswer: checkFillBlank, describeAnswer: describeFillBlankAnswer,
  },
  geometry: {
    type: 'geometry', label: 'Геометрия (чертёж в GeoGebra)', icon: '📐',
    defaultContent: geometryDefault, Editor: GeometryEditor, Player: GeometryPlayer,
    checkAnswer: null, manualReview: true,
  },
  algebra: {
    type: 'algebra', label: 'Алгебра (график в GeoGebra)', icon: '📈',
    defaultContent: algebraDefault, Editor: AlgebraEditor, Player: AlgebraPlayer,
    checkAnswer: null, manualReview: true,
  },
}

export const blockTypes: BlockType[] = [
  'theory', 'single-choice', 'multi-choice', 'short-text', 'numeric',
  'matching', 'ordering', 'fill-blank', 'geometry', 'algebra',
]
