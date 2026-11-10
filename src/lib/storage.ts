import type { Question } from '../data/questions'

export interface ExamResult {
  id: string
  mode: 'practice' | 'block' | 'full' | 'review'
  title: string
  startedAt: string
  completedAt: string
  durationSeconds: number
  score: number
  correct: number
  incorrect: number
  unanswered: number
  total: number
  answers: Record<string, number | null>
  questions: Question[]
}

export interface Preferences {
  theme: 'dark' | 'light'
  blockMinutes: number
  memorySeconds: number
}

const HISTORY_KEY = 'psicotm.history.v1'
const PREFS_KEY = 'psicotm.preferences.v1'

export function readHistory(): ExamResult[] {
  try {
    const value = localStorage.getItem(HISTORY_KEY)
    if (!value) return []
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as unknown[]).filter(isResult).slice(0, 50) : []
  } catch {
    return []
  }
}

export function writeHistory(history: ExamResult[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
  } catch {
    // Keep the application usable if browser storage is full or unavailable.
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)))
    } catch {
      // The user can still complete the current session; persistence is best-effort.
    }
  }
}

export function readPreferences(): Preferences {
  try {
    const value = localStorage.getItem(PREFS_KEY)
    if (!value) return { theme: 'dark', blockMinutes: 7, memorySeconds: 45 }
    const raw = JSON.parse(value) as Partial<Preferences>
    return {
      theme: raw.theme === 'light' ? 'light' : 'dark',
      blockMinutes: [5, 6, 7, 8, 10, 12].includes(Number(raw.blockMinutes)) ? Number(raw.blockMinutes) : 7,
      memorySeconds: [30, 45, 60, 90].includes(Number(raw.memorySeconds)) ? Number(raw.memorySeconds) : 45,
    }
  } catch {
    return { theme: 'dark', blockMinutes: 7, memorySeconds: 45 }
  }
}

export function writePreferences(prefs: Preferences) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Preferences remain available in memory for the current browser session.
  }
}

export function createBackup(history: ExamResult[], preferences: Preferences) {
  return {
    format: 'psicotm-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    history,
    preferences,
  }
}

function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false
  const question = value as Partial<Question>
  return typeof question.id === 'string'
    && typeof question.aptitudeId === 'string'
    && typeof question.prompt === 'string'
    && Array.isArray(question.options) && question.options.length === 4
    && question.options.every((option) => typeof option === 'string')
    && Number.isInteger(question.answer) && Number(question.answer) >= 0 && Number(question.answer) <= 3
    && typeof question.explanation === 'string'
    && typeof question.tip === 'string'
}

function isResult(value: unknown): value is ExamResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Partial<ExamResult>
  return typeof result.id === 'string'
    && typeof result.title === 'string'
    && typeof result.completedAt === 'string'
    && typeof result.startedAt === 'string'
    && Array.isArray(result.questions) && result.questions.every(isQuestion)
    && !!result.answers && typeof result.answers === 'object'
    && Number.isInteger(result.correct) && Number.isInteger(result.incorrect)
    && Number.isInteger(result.unanswered) && Number.isInteger(result.total)
}

export function parseBackup(file: unknown): { history: ExamResult[]; preferences: Preferences } {
  if (!file || typeof file !== 'object') throw new Error('El archivo no tiene un formato válido.')
  const backup = file as { format?: string; version?: number; history?: unknown; preferences?: unknown }
  if (backup.format !== 'psicotm-backup' || backup.version !== 1) throw new Error('El archivo no es una copia de seguridad compatible de PSICOTÉCNICOS TM.')
  if (!Array.isArray(backup.history) || !backup.history.every(isResult)) throw new Error('La copia contiene resultados incompletos o dañados.')
  const raw = (backup.preferences && typeof backup.preferences === 'object' ? backup.preferences : {}) as Partial<Preferences>
  return {
    history: (backup.history as ExamResult[]).slice(0, 50),
    preferences: {
      theme: raw.theme === 'light' ? 'light' : 'dark',
      blockMinutes: [5, 6, 7, 8, 10, 12].includes(Number(raw.blockMinutes)) ? Number(raw.blockMinutes) : 7,
      memorySeconds: [30, 45, 60, 90].includes(Number(raw.memorySeconds)) ? Number(raw.memorySeconds) : 45,
    },
  }
}
