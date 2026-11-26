import type { Aptitude, AptitudeId, Question } from '../data/questions'
import type { ExamResult } from './storage'

export const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export const percent = (correct: number, total: number): number => (total ? Math.round((correct / total) * 100) : 0)

export interface ScoreExamInput {
  id: string
  mode: ExamResult['mode']
  title: string
  aptitudeId?: AptitudeId
  memoryBrief?: string
  questions: Question[]
  answers: Record<string, number | null>
  startedAt: string
  completedAt?: string
  durationSeconds: number
  elapsedSeconds: number
}

export function scoreExam(input: ScoreExamInput): ExamResult {
  const correct = input.questions.filter((q) => input.answers[q.id] === q.answer).length
  const answered = input.questions.filter((q) => input.answers[q.id] !== null && input.answers[q.id] !== undefined).length
  const incorrect = answered - correct
  const unanswered = input.questions.length - answered
  const safeElapsed = Math.max(0, Math.round(input.elapsedSeconds))

  return {
    id: input.id,
    mode: input.mode,
    title: input.title,
    aptitudeId: input.aptitudeId,
    memoryBrief: input.memoryBrief,
    startedAt: input.startedAt,
    completedAt: input.completedAt ?? new Date().toISOString(),
    durationSeconds: input.durationSeconds > 0 ? Math.min(safeElapsed, input.durationSeconds) : safeElapsed,
    score: correct,
    correct,
    incorrect,
    unanswered,
    total: input.questions.length,
    answers: input.answers,
    questions: input.questions,
  }
}

/**
 * Devuelve preguntas pendientes de repaso basándose en el historial ordenado
 * del intento más reciente al más antiguo. Si una pregunta fallada se acierta
 * en un intento posterior, deja de figurar como pendiente.
 */
export function getFailedQuestions(history: readonly ExamResult[]): Question[] {
  const statusById = new Map<string, 'failed' | 'resolved'>()
  const failed: Question[] = []

  for (const result of history) {
    for (const question of result.questions) {
      if (statusById.has(question.id)) continue
      const selected = result.answers[question.id]
      if (selected === null || selected === undefined) continue
      if (selected === question.answer) {
        statusById.set(question.id, 'resolved')
      } else {
        statusById.set(question.id, 'failed')
        failed.push(question)
      }
    }
  }

  return failed
}

export interface AptitudeStat extends Aptitude {
  attempts: number
  progress: number
  count: number
}

export function getAptitudeStats(history: readonly ExamResult[], aptitudeList: readonly Aptitude[]): AptitudeStat[] {
  return aptitudeList.map((aptitude) => {
    const relevant = history.filter((result) => result.questions.some((q) => q.aptitudeId === aptitude.id))
    const answeredItems = relevant.flatMap((result) =>
      result.questions
        .filter((q) => q.aptitudeId === aptitude.id)
        .map((q) => ({ q, selected: result.answers[q.id] })),
    )
    const correct = answeredItems.filter(({ q, selected }) => selected === q.answer).length
    return {
      ...aptitude,
      attempts: relevant.length,
      progress: percent(correct, answeredItems.length),
      count: answeredItems.length,
    }
  })
}
