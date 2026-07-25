import type { ComponentType } from 'react'
import { TheoryEditor, TheoryPlayer, theoryDefault } from './TheoryBlock'
import { SingleChoiceEditor, SingleChoicePlayer, singleChoiceDefault, checkSingleChoice } from './SingleChoiceBlock'
import { MultiChoiceEditor, MultiChoicePlayer, multiChoiceDefault, checkMultiChoice } from './MultiChoiceBlock'
import { ShortTextEditor, ShortTextPlayer, shortTextDefault, checkShortText } from './ShortTextBlock'
import { NumericEditor, NumericPlayer, numericDefault, checkNumeric } from './NumericBlock'

export type BlockType = 'theory' | 'single-choice' | 'multi-choice' | 'short-text' | 'numeric'

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
}

export const blockTypes: BlockType[] = ['theory', 'single-choice', 'multi-choice', 'short-text', 'numeric']
