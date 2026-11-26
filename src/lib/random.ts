import { aptitudes, type AptitudeId, type Question } from '../data/questions'

/**
 * PRNG determinista (Mulberry32) para poder reproducir sesiones y pruebas unitarias.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1)
    crypto.getRandomValues(buffer)
    return buffer[0] >>> 0
  }
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

export function generateId(prefix = ''): string {
  let raw: string
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    raw = crypto.randomUUID()
  } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(12)
    crypto.getRandomValues(bytes)
    raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  } else {
    raw = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`
  }
  return prefix ? `${prefix}-${raw}` : raw
}

/**
 * Barajado Fisher-Yates inmutable.
 */
export function shuffleArray<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function randomInt(min: number, max: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function pickOne<T>(items: readonly T[], rng: () => number = Math.random): T {
  return items[Math.floor(rng() * items.length)]
}

/**
 * Baraja las 4 opciones de una pregunta y actualiza el índice de la respuesta correcta.
 * Respeta opciones especiales del tipo "Todas las anteriores" o "Ninguna de las anteriores"
 * manteniéndolas al final para no romper la semántica del enunciado.
 */
export function shuffleQuestionOptions(question: Question, rng: () => number = Math.random): Question {
  const lastOption = question.options[3]
  const lockLastOption = /^(todas|ninguna) las anteriores$/i.test(lastOption.trim())

  const indexed = question.options.map((text, index) => ({
    text,
    isCorrect: index === question.answer,
  }))

  let reordered: typeof indexed
  if (lockLastOption) {
    reordered = [...shuffleArray(indexed.slice(0, 3), rng), indexed[3]]
  } else {
    reordered = shuffleArray(indexed, rng)
  }

  const nextAnswer = reordered.findIndex((entry) => entry.isCorrect)
  return {
    ...question,
    options: [reordered[0].text, reordered[1].text, reordered[2].text, reordered[3].text],
    answer: nextAnswer,
  }
}

export interface PrepareQuestionsOptions {
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  difficulty?: 'Todas' | Question['difficulty']
  limit?: number
  seed?: number
  preserveAptitudeGroups?: boolean
}

export function prepareQuestions(
  questions: readonly Question[],
  options: PrepareQuestionsOptions = {},
): Question[] {
  const {
    shuffleQuestions = true,
    shuffleOptions = true,
    difficulty = 'Todas',
    limit,
    seed = createSeed(),
    preserveAptitudeGroups = false,
  } = options

  const rng = mulberry32(seed)

  let pool = difficulty === 'Todas'
    ? [...questions]
    : questions.filter((q) => q.difficulty === difficulty)

  if (shuffleQuestions) {
    if (preserveAptitudeGroups) {
      const grouped: Question[] = []
      const seenAptitudes = new Set<AptitudeId>()
      for (const aptitude of aptitudes) {
        const subset = pool.filter((q) => q.aptitudeId === aptitude.id)
        if (subset.length > 0) {
          seenAptitudes.add(aptitude.id)
          grouped.push(...shuffleArray(subset, rng))
        }
      }
      const remaining = pool.filter((q) => !seenAptitudes.has(q.aptitudeId))
      pool = [...grouped, ...shuffleArray(remaining, rng)]
    } else {
      pool = shuffleArray(pool, rng)
    }
  }

  if (typeof limit === 'number' && limit > 0 && limit < pool.length) {
    pool = pool.slice(0, limit)
  }

  if (shuffleOptions) {
    pool = pool.map((q) => shuffleQuestionOptions(q, rng))
  }

  return pool
}
