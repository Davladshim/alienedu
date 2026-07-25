import type { ComponentType } from 'react'
import { TheoryEditor, TheoryPlayer, theoryDefault } from './TheoryBlock'
import { SingleChoiceEditor, SingleChoicePlayer, singleChoiceDefault, checkSingleChoice } from './SingleChoiceBlock'
import { MultiChoiceEditor, MultiChoicePlayer, multiChoiceDefault, checkMultiChoice } from './MultiChoiceBlock'
import { ShortTextEditor, ShortTextPlayer, shortTextDefault, checkShortText } from './ShortTextBlock'
import { NumericEditor, NumericPlayer, numericDefault, checkNumeric } from './NumericBlock'
import { MatchingEditor, MatchingPlayer, matchingDefault, checkMatching } from './MatchingBlock'
import { OrderingEditor, OrderingPlayer, orderingDefault, checkOrdering } from './OrderingBlock'
import { FillBlankEditor, FillBlankPlayer, fillBlankDefault, checkFillBlank } from './FillBlankBlock'

export type BlockType =
  | 'theory' | 'single-choice' | 'multi-choice' | 'short-text' | 'numeric'
  | 'matching' | 'ordering' | 'fill-blank'

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
    checkAnswer: checkSingleChoice,
  },
  'multi-choice': {
    type: 'multi-choice', label: 'Несколько правильных ответов', icon: '✅',
    defaultContent: multiChoiceDefault, Editor: MultiChoiceEditor, Player: MultiChoicePlayer,
    checkAnswer: checkMultiChoice,
  },
  'short-text': {
    type: 'short-text', label: 'Короткий текстовый ответ', icon: '✏️',
    defaultContent: shortTextDefault, Editor: ShortTextEditor, Player: ShortTextPlayer,
    checkAnswer: checkShortText,
  },
  numeric: {
    type: 'numeric', label: 'Числовой ответ (формулы через $...$)', icon: '🔢',
    defaultContent: numericDefault, Editor: NumericEditor, Player: NumericPlayer,
    checkAnswer: checkNumeric,
  },
  matching: {
    type: 'matching', label: 'Сопоставление пар', icon: '🔗',
    defaultContent: matchingDefault, Editor: MatchingEditor, Player: MatchingPlayer,
    checkAnswer: checkMatching,
  },
  ordering: {
    type: 'ordering', label: 'Порядок шагов', icon: '🔀',
    defaultContent: orderingDefault, Editor: OrderingEditor, Player: OrderingPlayer,
    checkAnswer: checkOrdering,
  },
  'fill-blank': {
    type: 'fill-blank', label: 'Заполнение пропусков', icon: '📝',
    defaultContent: fillBlankDefault, Editor: FillBlankEditor, Player: FillBlankPlayer,
    checkAnswer: checkFillBlank,
  },
}

export const blockTypes: BlockType[] = [
  'theory', 'single-choice', 'multi-choice', 'short-text', 'numeric',
  'matching', 'ordering', 'fill-blank',
]
