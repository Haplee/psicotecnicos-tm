import { describe, expect, it } from 'vitest'
import { aptitudes, getQuestionsForAptitude, memoryBrief, questionBank, type VisualKind } from '../data/questions'

const validVisuals = new Set<VisualKind>([
  'cube-net',
  'lever',
  'pulley',
  'gears',
  'matrix',
  'sequence',
  'symbol-grid',
  'shading-sequence',
])

describe('Banco de preguntas base', () => {
  it('define 7 aptitudes con exactamente 15 preguntas cada una (105 en total)', () => {
    expect(aptitudes).toHaveLength(7)
    expect(questionBank).toHaveLength(105)
    for (const aptitude of aptitudes) {
      expect(getQuestionsForAptitude(aptitude.id)).toHaveLength(15)
    }
  })

  it('garantiza identificadores únicos, metadatos completos y 4 opciones distintas', () => {
    const ids = new Set<string>()
    const aptitudeIds = new Set(aptitudes.map((a) => a.id))

    for (const q of questionBank) {
      expect(ids.has(q.id)).toBe(false)
      ids.add(q.id)

      expect(aptitudeIds.has(q.aptitudeId)).toBe(true)
      expect(q.prompt.trim().length).toBeGreaterThan(5)
      expect(q.explanation.trim().length).toBeGreaterThan(5)
      expect(q.tip.trim().length).toBeGreaterThan(5)
      expect(q.topic.trim().length).toBeGreaterThan(2)
      expect(['Básico', 'Intermedio', 'Avanzado']).toContain(q.difficulty)

      expect(q.options).toHaveLength(4)
      for (const option of q.options) {
        expect(option.trim().length).toBeGreaterThan(0)
      }
      expect(new Set(q.options).size).toBe(4)

      expect(Number.isInteger(q.answer)).toBe(true)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThanOrEqual(3)

      if (q.visual) {
        expect(validVisuals.has(q.visual)).toBe(true)
      }
    }
  })

  it('corrige la pregunta p06 de pares consecutivos en 441887233', () => {
    const p06 = questionBank.find((q) => q.id === 'p06')
    expect(p06).toBeDefined()
    expect(p06?.options[p06.answer]).toBe('3')
    expect(p06?.explanation).not.toContain('Corrección:')
  })

  it('incluye informe de memoria no vacío', () => {
    expect(memoryBrief.trim().length).toBeGreaterThan(50)
  })
})
