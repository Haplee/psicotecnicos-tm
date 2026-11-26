import { describe, expect, it } from 'vitest'
import { aptitudes, getQuestionsForAptitude } from '../data/questions'
import { formatTime, getAptitudeStats, getFailedQuestions, percent, scoreExam } from '../lib/exam'

describe('Lógica de evaluación y seguimiento de errores', () => {
  it('formatea tiempo y porcentajes de forma segura', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(-12)).toBe('00:00')
    expect(formatTime(75)).toBe('01:15')
    expect(percent(0, 0)).toBe(0)
    expect(percent(3, 4)).toBe(75)
  })

  it('calcula aciertos, errores, en blanco y limita duración al máximo del examen', () => {
    const questions = getQuestionsForAptitude('verbal').slice(0, 4)
    const result = scoreExam({
      id: 'exam-1',
      mode: 'block',
      title: 'Aptitud verbal',
      aptitudeId: 'verbal',
      questions,
      answers: {
        [questions[0].id]: questions[0].answer,
        [questions[1].id]: (questions[1].answer + 1) % 4,
        [questions[2].id]: null,
        [questions[3].id]: questions[3].answer,
      },
      startedAt: '2026-01-01T10:00:00.000Z',
      completedAt: '2026-01-01T10:10:00.000Z',
      durationSeconds: 420,
      elapsedSeconds: 500,
    })

    expect(result.correct).toBe(2)
    expect(result.incorrect).toBe(1)
    expect(result.unanswered).toBe(1)
    expect(result.total).toBe(4)
    expect(result.score).toBe(2)
    expect(result.durationSeconds).toBe(420)
    expect(result.aptitudeId).toBe('verbal')
  })

  it('retira preguntas falladas cuando se aciertan en un intento posterior', () => {
    const [q1, q2, q3] = getQuestionsForAptitude('numerica').slice(0, 3)

    const olderAttempt = scoreExam({
      id: 'old',
      mode: 'practice',
      title: 'Numérica 1',
      questions: [q1, q2, q3],
      answers: {
        [q1.id]: (q1.answer + 1) % 4, // fallada
        [q2.id]: (q2.answer + 1) % 4, // fallada
        [q3.id]: null, // en blanco no cuenta como fallo
      },
      startedAt: '2026-01-01T10:00:00.000Z',
      durationSeconds: 0,
      elapsedSeconds: 60,
    })

    const newerReview = scoreExam({
      id: 'new',
      mode: 'review',
      title: 'Repaso',
      questions: [q1, q2],
      answers: {
        [q1.id]: q1.answer, // resuelta ahora
        [q2.id]: (q2.answer + 2) % 4, // sigue fallada
      },
      startedAt: '2026-01-02T10:00:00.000Z',
      durationSeconds: 0,
      elapsedSeconds: 40,
    })

    const pending = getFailedQuestions([newerReview, olderAttempt])
    expect(pending.map((q) => q.id)).toEqual([q2.id])
  })

  it('calcula estadísticas por aptitud sobre el historial', () => {
    const verbal = getQuestionsForAptitude('verbal').slice(0, 2)
    const attempt = scoreExam({
      id: 'stats-1',
      mode: 'practice',
      title: 'Verbal',
      questions: verbal,
      answers: {
        [verbal[0].id]: verbal[0].answer,
        [verbal[1].id]: (verbal[1].answer + 1) % 4,
      },
      startedAt: '2026-01-01T10:00:00.000Z',
      durationSeconds: 0,
      elapsedSeconds: 30,
    })

    const stats = getAptitudeStats([attempt], aptitudes)
    const verbalStat = stats.find((s) => s.id === 'verbal')
    const numericStat = stats.find((s) => s.id === 'numerica')

    expect(verbalStat?.attempts).toBe(1)
    expect(verbalStat?.progress).toBe(50)
    expect(numericStat?.attempts).toBe(0)
    expect(numericStat?.progress).toBe(0)
  })
})
