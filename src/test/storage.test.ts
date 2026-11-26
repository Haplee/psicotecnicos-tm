import { describe, expect, it } from 'vitest'
import { getQuestionsForAptitude } from '../data/questions'
import { scoreExam } from '../lib/exam'
import { createNote, deleteNote, getBundledNotes, initializeNotes, readNotes, updateNote } from '../lib/notes'
import {
  createBackup,
  defaultPreferences,
  parseBackup,
  readHistory,
  readPreferences,
  writeHistory,
  writePreferences,
} from '../lib/storage'

describe('Persistencia y copias de seguridad', () => {
  it('lee y escribe preferencias incluyendo aleatoriedad y fuente', () => {
    expect(readPreferences()).toEqual(defaultPreferences)

    const custom = {
      ...defaultPreferences,
      theme: 'light' as const,
      blockMinutes: 10,
      shuffleQuestions: false,
      questionSource: 'dynamic' as const,
    }
    writePreferences(custom)
    expect(readPreferences()).toEqual(custom)
  })

  it('descarta historial corrupto o inválido y mantiene un máximo de 50 entradas', () => {
    localStorage.setItem('psicotm.history.v1', '{invalid-json')
    expect(readHistory()).toEqual([])

    const qs = getQuestionsForAptitude('verbal').slice(0, 2)
    const list = Array.from({ length: 55 }, (_, i) =>
      scoreExam({
        id: `res-${i}`,
        mode: 'practice',
        title: `Intento ${i}`,
        questions: qs,
        answers: { [qs[0].id]: qs[0].answer, [qs[1].id]: qs[1].answer },
        startedAt: '2026-01-01T10:00:00.000Z',
        durationSeconds: 0,
        elapsedSeconds: 20,
      }),
    )

    writeHistory(list)
    expect(readHistory()).toHaveLength(50)
  })

  it('exporta e importa copia de seguridad completa y rechaza archivos incompatibles', () => {
    const qs = getQuestionsForAptitude('espacial').slice(0, 1)
    const result = scoreExam({
      id: 'bk-1',
      mode: 'block',
      title: 'Espacial',
      aptitudeId: 'espacial',
      questions: qs,
      answers: { [qs[0].id]: qs[0].answer },
      startedAt: '2026-01-01T10:00:00.000Z',
      durationSeconds: 420,
      elapsedSeconds: 120,
    })
    const note = createNote({ title: 'Fórmula', content: 'P1 x D1 = P2 x D2' })
    const backup = createBackup([result], { ...defaultPreferences, questionSource: 'mixed' }, [note])

    const parsed = parseBackup(backup)
    expect(parsed.history).toHaveLength(1)
    expect(parsed.preferences.questionSource).toBe('mixed')
    expect(parsed.notes).toHaveLength(1)

    expect(() => parseBackup({ format: 'otro', version: 1 })).toThrow()
    expect(() => parseBackup('invalido')).toThrow()
  })
})

describe('Gestión de apuntes', () => {
  it('precarga los apuntes incluidos en src/Apuntes en el primer inicio', () => {
    const bundled = getBundledNotes()
    expect(bundled.length).toBeGreaterThanOrEqual(7)

    const initialized = initializeNotes()
    expect(initialized.length).toBe(bundled.length)
    expect(initialized.some((n) => n.title === 'Balanzas')).toBe(true)
  })

  it('permite crear, actualizar y eliminar apuntes con IDs válidos', () => {
    localStorage.setItem('psicotm.notes.v1', '[]')
    const created = createNote({ title: 'Palancas', content: 'Apoyo entre carga y fuerza' })
    expect(created.id.length).toBeGreaterThan(8)
    expect(readNotes()).toHaveLength(1)

    const updated = updateNote(created.id, { content: 'Contenido actualizado' })
    expect(updated?.content).toBe('Contenido actualizado')

    expect(deleteNote(created.id)).toBe(true)
    expect(readNotes()).toHaveLength(0)
  })
})
