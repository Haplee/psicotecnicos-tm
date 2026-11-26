import { describe, expect, it } from 'vitest'
import { aptitudes, questionBank, type Question } from '../data/questions'
import { generateDynamicSessionData, generateMemoryScenario } from '../data/generators'
import { mulberry32, prepareQuestions, shuffleArray, shuffleQuestionOptions } from '../lib/random'

describe('Utilidades de aleatoriedad y barajado', () => {
  it('mulberry32 es determinista para una misma semilla', () => {
    const rngA = mulberry32(123456)
    const rngB = mulberry32(123456)
    const seqA = Array.from({ length: 10 }, () => rngA())
    const seqB = Array.from({ length: 10 }, () => rngB())
    expect(seqA).toEqual(seqB)
  })

  it('shuffleArray conserva los mismos elementos sin mutar el array original', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8]
    const snapshot = [...original]
    const shuffled = shuffleArray(original, mulberry32(42))

    expect(original).toEqual(snapshot)
    expect(shuffled).toHaveLength(original.length)
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original)
    expect(shuffled).not.toEqual(original)
  })

  it('shuffleQuestionOptions mantiene el texto de la respuesta correcta en el nuevo índice', () => {
    const sample = questionBank[0]
    const expectedText = sample.options[sample.answer]

    for (let seed = 1; seed <= 20; seed += 1) {
      const shuffled = shuffleQuestionOptions(sample, mulberry32(seed))
      expect(shuffled.options).toHaveLength(4)
      expect(new Set(shuffled.options)).toEqual(new Set(sample.options))
      expect(shuffled.options[shuffled.answer]).toBe(expectedText)
    }
  })

  it('shuffleQuestionOptions mantiene fija al final la opción "Todas las anteriores"', () => {
    const p07 = questionBank.find((q) => q.id === 'p07') as Question
    for (let seed = 1; seed <= 15; seed += 1) {
      const shuffled = shuffleQuestionOptions(p07, mulberry32(seed))
      expect(shuffled.options[3]).toBe('Todas las anteriores')
      expect(shuffled.answer).toBe(3)
    }
  })

  it('prepareQuestions filtra por dificultad, respeta límite y agrupa por aptitud en modo completo', () => {
    const filtered = prepareQuestions(questionBank, {
      difficulty: 'Avanzado',
      limit: 5,
      seed: 99,
    })
    expect(filtered).toHaveLength(5)
    expect(filtered.every((q) => q.difficulty === 'Avanzado')).toBe(true)

    const grouped = prepareQuestions(questionBank, {
      shuffleQuestions: true,
      shuffleOptions: true,
      preserveAptitudeGroups: true,
      seed: 777,
    })
    expect(grouped).toHaveLength(105)
    aptitudes.forEach((apt, index) => {
      const slice = grouped.slice(index * 15, (index + 1) * 15)
      expect(slice.every((q) => q.aptitudeId === apt.id)).toBe(true)
    })
  })
})

describe('Generadores dinámicos de preguntas', () => {
  it('genera 15 preguntas válidas y con 4 opciones únicas por cada aptitud', () => {
    for (const apt of aptitudes) {
      const { questions, memoryBrief } = generateDynamicSessionData(apt.id, 15, 2026)
      expect(questions).toHaveLength(15)
      if (apt.id === 'memoria') {
        expect(memoryBrief).toBeDefined()
        expect(memoryBrief?.length).toBeGreaterThan(40)
      }
      const ids = new Set<string>()
      for (const q of questions) {
        expect(ids.has(q.id)).toBe(false)
        ids.add(q.id)
        expect(q.aptitudeId).toBe(apt.id)
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options).size).toBe(4)
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThanOrEqual(3)
      }
    }
  })

  it('genera simulacro completo dinámico de 105 preguntas con informe de memoria coherente', () => {
    const fullA = generateDynamicSessionData('full', 15, 101)
    const fullB = generateDynamicSessionData('full', 15, 202)

    expect(fullA.questions).toHaveLength(105)
    expect(fullA.memoryBrief).toBeDefined()
    expect(fullA.memoryBrief).not.toBe(fullB.memoryBrief)
  })

  it('el escenario de memoria generado contiene los datos preguntados', () => {
    const scenario = generateMemoryScenario(555)
    expect(scenario.questions).toHaveLength(15)
    const destQ = scenario.questions[0]
    expect(scenario.brief).toContain(destQ.options[destQ.answer])
  })
})
