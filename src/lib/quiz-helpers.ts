import type { Block, RichText } from './interfaces'

export interface QuizChoice {
  id: string
  text: string
  richTexts: RichText[]
  correct: boolean
}
export interface Quiz {
  id: string
  title: string
  choices: QuizChoice[]
  multiple: boolean
}

// Only convert the explicit authoring format; ordinary and incomplete toggles stay readable.
export function parseQuiz(
  block: Block
): { quiz: Quiz; explanation: Block[] } | null {
  if (!block.Toggle) return null
  const title = block.Toggle.RichTexts.map((text) => text.PlainText).join('')
  if (!/^\s*\[quiz\]/i.test(title)) return null
  const question = title.replace(/^\s*\[quiz\]\s*/i, '').trim()
  const children = block.Toggle.Children || []
  const optionBlocks = children.filter((child) => child.Type === 'to_do')
  const choices = optionBlocks.map((child) => ({
    id: child.Id,
    text: (child.ToDo?.RichTexts || []).map((text) => text.PlainText).join(''),
    richTexts: child.ToDo?.RichTexts || [],
    correct: child.ToDo?.Checked === true,
  }))
  const correctCount = choices.filter((choice) => choice.correct).length
  if (
    !question ||
    choices.length < 2 ||
    !correctCount ||
    choices.some((choice) => !choice.id || !choice.text.trim()) ||
    new Set(choices.map((choice) => choice.id)).size !== choices.length ||
    optionBlocks.some((child) => child.ToDo?.Children?.length)
  )
    return null
  return {
    quiz: {
      id: block.Id,
      title: question,
      choices,
      multiple: correctCount > 1,
    },
    explanation: children.filter((child) => child.Type !== 'to_do'),
  }
}

export function isQuizAnswerCorrect(
  choices: QuizChoice[],
  selected: string[]
): boolean {
  const correct = choices
    .filter((choice) => choice.correct)
    .map((choice) => choice.id)
  const answers = new Set(selected)
  return (
    correct.length > 0 &&
    answers.size === correct.length &&
    correct.every((id) => answers.has(id))
  )
}
