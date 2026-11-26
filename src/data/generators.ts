import { aptitudes, getQuestionsForAptitude, type AptitudeId, type Question } from './questions'
import { createSeed, mulberry32, pickOne, randomInt, shuffleArray } from '../lib/random'

function buildOptions(
  correct: string,
  candidates: string[],
  rng: () => number,
): { options: [string, string, string, string]; answer: number } {
  const uniqueDistractors: string[] = []
  for (const candidate of candidates) {
    if (candidate !== correct && !uniqueDistractors.includes(candidate)) {
      uniqueDistractors.push(candidate)
    }
    if (uniqueDistractors.length === 3) break
  }

  let fallbackIndex = 1
  while (uniqueDistractors.length < 3) {
    const fallback = `${correct} (${fallbackIndex})`
    fallbackIndex += 1
    if (fallback !== correct && !uniqueDistractors.includes(fallback)) {
      uniqueDistractors.push(fallback)
    }
  }

  const combined = shuffleArray([correct, ...uniqueDistractors.slice(0, 3)], rng)
  return {
    options: [combined[0], combined[1], combined[2], combined[3]],
    answer: combined.indexOf(correct),
  }
}

function generateNumericQuestion(index: number, seed: number, rng: () => number): Question {
  const variant = index % 5
  const id = `gen-num-${seed}-${index}`

  if (variant === 0) {
    const start = randomInt(2, 15, rng)
    const step = randomInt(3, 12, rng)
    const seq = [start, start + step, start + step * 2, start + step * 3, start + step * 4]
    const next = start + step * 5
    const { options, answer } = buildOptions(
      String(next),
      [String(next + step), String(next - step), String(next + 2), String(next - 2)],
      rng,
    )
    return {
      id,
      aptitudeId: 'numerica',
      prompt: `¿Qué número continúa la serie? ${seq.join(' – ')} – …`,
      options,
      answer,
      explanation: `Cada término suma +${step} al anterior. ${seq[4]} + ${step} = ${next}.`,
      tip: 'Calcula la diferencia entre pares consecutivos para identificar si la progresión es constante.',
      difficulty: 'Básico',
      topic: 'Series',
    }
  }

  if (variant === 1) {
    const pct = pickOne([10, 15, 20, 25, 30, 40], rng)
    const base = randomInt(4, 24, rng) * 20
    const result = Math.round((pct * base) / 100)
    const { options, answer } = buildOptions(
      String(result),
      [String(result + 5), String(Math.max(1, result - 5)), String(result + 10), String(result * 2)],
      rng,
    )
    return {
      id,
      aptitudeId: 'numerica',
      prompt: `¿Cuánto es el ${pct} % de ${base}?`,
      options,
      answer,
      explanation: `${pct} % de ${base} = (${pct} × ${base}) / 100 = ${result}.`,
      tip: 'Descompón el porcentaje en múltiplos de 10 % y 5 % para calcularlo mentalmente.',
      difficulty: 'Básico',
      topic: 'Porcentajes',
    }
  }

  if (variant === 2) {
    const start = randomInt(2, 7, rng)
    const delta = pickOne([1, 2, -1], rng)
    const s1 = start
    const s2 = s1 * 2 + delta
    const s3 = s2 * 2 + delta
    const s4 = s3 * 2 + delta
    const next = s4 * 2 + delta
    const { options, answer } = buildOptions(
      String(next),
      [String(next - 2), String(next + 2), String(s4 * 2), String(next + 4)],
      rng,
    )
    const signLabel = delta >= 0 ? `+ ${delta}` : `− ${Math.abs(delta)}`
    return {
      id,
      aptitudeId: 'numerica',
      prompt: `Completa la serie: ${s1} – ${s2} – ${s3} – ${s4} – …`,
      options,
      answer,
      explanation: `Cada término se obtiene multiplicando el anterior por 2 y aplicando ${signLabel}: ${s4} × 2 ${signLabel} = ${next}.`,
      tip: 'Cuando la serie crece rápido pero no es potencia exacta, prueba multiplicaciones con ajuste constante.',
      difficulty: 'Avanzado',
      topic: 'Series',
    }
  }

  if (variant === 3) {
    const workersA = pickOne([2, 3, 4, 5], rng)
    const factor = pickOne([2, 3], rng)
    const workersB = workersA * factor
    const daysB = randomInt(3, 9, rng)
    const daysA = daysB * factor
    const { options, answer } = buildOptions(
      `${daysB} días`,
      [`${daysB + 2} días`, `${daysA * factor} días`, `${Math.max(1, daysB - 1)} días`, `${daysB * 2} días`],
      rng,
    )
    return {
      id,
      aptitudeId: 'numerica',
      prompt: `Si ${workersA} operarios completan una tarea en ${daysA} días, ¿cuánto tardarían ${workersB} operarios al mismo ritmo?`,
      options,
      answer,
      explanation: `Es proporcionalidad inversa: al multiplicar el personal por ${factor}, el tiempo se divide entre ${factor}: ${daysA} / ${factor} = ${daysB} días.`,
      tip: 'Comprueba siempre si las magnitudes son directa o inversamente proporcionales antes de aplicar la regla de tres.',
      difficulty: 'Intermedio',
      topic: 'Proporcionalidad inversa',
    }
  }

  const speed = pickOne([40, 50, 60, 70, 80, 90], rng)
  const hoursA = randomInt(2, 4, rng)
  const hoursB = hoursA + randomInt(2, 4, rng)
  const distA = speed * hoursA
  const distB = speed * hoursB
  const { options, answer } = buildOptions(
    `${distB} km`,
    [`${distB - speed} km`, `${distB + speed} km`, `${distA + speed} km`, `${distB + 20} km`],
    rng,
  )
  return {
    id,
    aptitudeId: 'numerica',
    prompt: `Un vehículo recorre ${distA} km en ${hoursA} horas a velocidad constante. ¿Cuántos kilómetros recorrerá en ${hoursB} horas?`,
    options,
    answer,
    explanation: `La velocidad constante es ${distA} / ${hoursA} = ${speed} km/h. En ${hoursB} horas recorre ${speed} × ${hoursB} = ${distB} km.`,
    tip: 'Calcula primero el valor unitario por hora y multiplícalo por el nuevo tiempo.',
    difficulty: 'Básico',
    topic: 'Proporcionalidad',
  }
}

function generateSpatialQuestion(index: number, seed: number, rng: () => number): Question {
  const variant = index % 4
  const id = `gen-esp-${seed}-${index}`
  const cardinals = ['Norte', 'Este', 'Sur', 'Oeste'] as const

  if (variant === 0) {
    const startIdx = randomInt(0, 3, rng)
    const step1 = pickOne([1, 2, -1], rng)
    const step2 = pickOne([1, 2, -1], rng)
    const labelStep = (step: number) =>
      step === 2 ? '180°' : step === 1 ? '90° en sentido horario' : '90° en sentido antihorario'
    const finalIdx = (((startIdx + step1 + step2) % 4) + 4) % 4
    const correct = cardinals[finalIdx]
    const { options, answer } = buildOptions(
      correct,
      cardinals.filter((c) => c !== correct),
      rng,
    )
    return {
      id,
      aptitudeId: 'espacial',
      prompt: `Una flecha apunta al ${cardinals[startIdx].toLowerCase()}. Gira ${labelStep(step1)} y después ${labelStep(step2)}. ¿Hacia dónde apunta finalmente?`,
      options,
      answer,
      explanation: `Partiendo del ${cardinals[startIdx].toLowerCase()}, tras el primer giro apunta al ${cardinals[(((startIdx + step1) % 4) + 4) % 4].toLowerCase()}, y tras el segundo queda apuntando al ${correct.toLowerCase()}.`,
      tip: 'Ejecuta cada giro de 90° paso a paso sobre la rosa de los vientos.',
      difficulty: 'Básico',
      topic: 'Rotación',
    }
  }

  if (variant === 1) {
    const netOpposites: [string, string][] = [
      ['A', 'F'],
      ['B', 'D'],
      ['C', 'E'],
    ]
    const [face, opposite] = pickOne(netOpposites, rng)
    const allFaces = ['A', 'B', 'C', 'D', 'E', 'F'].filter((f) => f !== face)
    const { options, answer } = buildOptions(
      opposite,
      allFaces.filter((f) => f !== opposite),
      rng,
    )
    return {
      id,
      aptitudeId: 'espacial',
      prompt: `En el desarrollo de cubo mostrado, ¿qué cara queda opuesta a la cara ${face}?`,
      options,
      answer,
      explanation: `Al plegar el desarrollo en cruz, la cara ${opposite} queda exactamente enfrentada a la cara ${face}.`,
      tip: 'Toma una cara central como base y pliega mentalmente las cuatro caras adyacentes a 90°.',
      difficulty: 'Intermedio',
      topic: 'Desarrollo de cubos',
      visual: 'cube-net',
    }
  }

  if (variant === 2) {
    const north = randomInt(3, 8, rng)
    const south = randomInt(1, north - 1, rng)
    const east = randomInt(2, 7, rng)
    const netN = north - south
    const correct = `${netN} al norte y ${east} al este`
    const { options, answer } = buildOptions(
      correct,
      [
        `${netN} al sur y ${east} al este`,
        `${netN + 2} al norte y ${east} al oeste`,
        `${north + south} al norte y ${east} al este`,
        `${netN} al norte y ${east + 1} al oeste`,
      ],
      rng,
    )
    return {
      id,
      aptitudeId: 'espacial',
      prompt: `Desde el origen avanzas ${north} pasos al norte, ${east} al este y ${south} al sur. ¿Cuál es tu posición final?`,
      options,
      answer,
      explanation: `En el eje vertical: ${north} norte − ${south} sur = ${netN} al norte. En el eje horizontal quedan ${east} pasos al este.`,
      tip: 'Agrupa siempre los desplazamientos opuestos (norte/sur y este/oeste) por separado.',
      difficulty: 'Intermedio',
      topic: 'Orientación',
    }
  }

  const l = randomInt(2, 5, rng)
  const w = randomInt(2, 5, rng)
  const h = randomInt(2, 6, rng)
  const volume = l * w * h
  const { options, answer } = buildOptions(
    `${volume} cm³`,
    [`${l + w + h} cm³`, `${volume + l} cm³`, `${volume * 2} cm³`, `${Math.max(4, volume - w)} cm³`],
    rng,
  )
  return {
    id,
    aptitudeId: 'espacial',
    prompt: `Una caja rectangular mide ${l} cm × ${w} cm × ${h} cm. ¿Cuál es su volumen?`,
    options,
    answer,
    explanation: `Volumen = ${l} × ${w} × ${h} = ${volume} cm³.`,
    tip: 'El volumen de un prisma rectangular es el producto de sus tres dimensiones.',
    difficulty: 'Básico',
    topic: 'Volumen',
  }
}

function generateMechanicalQuestion(index: number, seed: number, rng: () => number): Question {
  const variant = index % 4
  const id = `gen-mec-${seed}-${index}`

  if (variant === 0) {
    const zA = pickOne([12, 16, 18, 20, 24, 30], rng)
    const ratio = pickOne([2, 3], rng)
    const zB = zA * ratio
    const rpmB = pickOne([15, 20, 30, 40], rng)
    const rpmA = rpmB * ratio
    const { options, answer } = buildOptions(
      `${rpmB} rpm`,
      [`${rpmA} rpm`, `${rpmA * ratio} rpm`, `${rpmB + 10} rpm`, `${Math.max(5, Math.round(rpmB / 2))} rpm`],
      rng,
    )
    return {
      id,
      aptitudeId: 'mecanica',
      prompt: `El engranaje A de ${zA} dientes mueve al engranaje B de ${zB} dientes. Si A gira a ${rpmA} rpm, ¿a qué velocidad gira B?`,
      options,
      answer,
      explanation: `nB = nA × (ZA / ZB) = ${rpmA} × (${zA} / ${zB}) = ${rpmB} rpm.`,
      tip: 'Cuando el engranaje conducido tiene más dientes, gira más lento en la misma proporción.',
      difficulty: 'Intermedio',
      topic: 'Engranajes',
      visual: 'gears',
    }
  }

  if (variant === 1) {
    const strands = pickOne([2, 3, 4], rng)
    const effort = randomInt(3, 12, rng) * 10
    const load = effort * strands
    const { options, answer } = buildOptions(
      `${effort} N`,
      [`${load} N`, `${effort * 2} N`, `${Math.round(effort / 2)} N`, `${effort + 20} N`],
      rng,
    )
    return {
      id,
      aptitudeId: 'mecanica',
      prompt: `Un polipasto ideal sostiene una carga de ${load} N repartida en ${strands} tramos verticales de cuerda. ¿Qué fuerza de tracción se necesita?`,
      options,
      answer,
      explanation: `La carga se divide entre los ${strands} tramos que la soportan: ${load} / ${strands} = ${effort} N.`,
      tip: 'Cuenta los tramos de cuerda que tiran directamente hacia arriba de la polea móvil.',
      difficulty: 'Intermedio',
      topic: 'Poleas',
    }
  }

  if (variant === 2) {
    const area = randomInt(2, 8, rng)
    const pressure = randomInt(5, 20, rng)
    const force = area * pressure
    const { options, answer } = buildOptions(
      `${pressure} Pa`,
      [`${force} Pa`, `${pressure * 2} Pa`, `${pressure + area} Pa`, `${Math.max(1, pressure - 3)} Pa`],
      rng,
    )
    return {
      id,
      aptitudeId: 'mecanica',
      prompt: `Una fuerza de ${force} N se aplica perpendicularmente sobre una superficie de ${area} m². ¿Qué presión ejerce?`,
      options,
      answer,
      explanation: `Presión = Fuerza / Superficie = ${force} / ${area} = ${pressure} Pa.`,
      tip: 'A igual fuerza, cuanto menor es la superficie de apoyo, mayor es la presión.',
      difficulty: 'Básico',
      topic: 'Presión',
    }
  }

  const count = randomInt(3, 6, rng)
  const dir = pickOne(['horario', 'antihorario'] as const, rng)
  const lastIsSame = count % 2 === 1
  const correct = lastIsSame ? dir : dir === 'horario' ? 'antihorario' : 'horario'
  const { options, answer } = buildOptions(
    correct === 'horario' ? 'Horario' : 'Antihorario',
    [correct === 'horario' ? 'Antihorario' : 'Horario', 'No gira', 'Depende del tamaño'],
    rng,
  )
  return {
    id,
    aptitudeId: 'mecanica',
    prompt: `Una cadena de ${count} engranajes externos consecutivos engrana en fila. Si el primero gira en sentido ${dir}, ¿en qué sentido gira el último?`,
    options,
    answer,
    explanation: `Cada contacto externo invierte el sentido de giro. En ${count} ruedas hay ${count - 1} contactos, por lo que el último gira en sentido ${correct}.`,
    tip: 'Las ruedas en posiciones impares (1.ª, 3.ª, 5.ª...) mantienen el sentido de la primera.',
    difficulty: 'Intermedio',
    topic: 'Engranajes',
  }
}

function generatePerceptiveQuestion(index: number, seed: number, rng: () => number): Question {
  const variant = index % 4
  const id = `gen-per-${seed}-${index}`

  if (variant === 0) {
    const pairs: [string, string][] = [
      ['0', 'O'],
      ['1', 'I'],
      ['5', 'S'],
      ['8', 'B'],
      ['2', 'Z'],
      ['7', 'T'],
    ]
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const digits = '0123456789'
    const c1 = alphabet[randomInt(0, alphabet.length - 1, rng)]
    const [dConfuse, lConfuse] = pickOne(pairs, rng)
    const d1 = digits[randomInt(0, digits.length - 1, rng)]
    const d2 = digits[randomInt(0, digits.length - 1, rng)]
    const c2 = alphabet[randomInt(0, alphabet.length - 1, rng)]
    const target = `${c1}${dConfuse}${c2}-${d1}${d2}${lConfuse}`
    const mut1 = `${c1}${lConfuse}${c2}-${d1}${d2}${lConfuse}`
    const mut2 = `${c1}${dConfuse}${c2}-${d2}${d1}${lConfuse}`
    const mut3 = `${c1}${dConfuse}${c2}-${d1}${d2}${dConfuse}`
    const { options, answer } = buildOptions(target, [mut1, mut2, mut3, `${c1}${dConfuse}${c2}-${d1}${d1}${lConfuse}`], rng)
    return {
      id,
      aptitudeId: 'perceptiva',
      prompt: `¿Qué código es exactamente igual a «${target}»?`,
      options,
      answer,
      explanation: `Solo «${target}» mantiene todos los caracteres y su posición exacta sin confundir ${dConfuse}/${lConfuse}.`,
      tip: 'Compara el código bloque por bloque y presta atención a dígitos y letras visualmente similares.',
      difficulty: 'Básico',
      topic: 'Comparación de códigos',
    }
  }

  if (variant === 1) {
    const length = 9
    const digitsArr: number[] = []
    for (let i = 0; i < length; i += 1) {
      if (i > 0 && rng() < 0.38) {
        digitsArr.push(digitsArr[i - 1])
      } else {
        let next = randomInt(1, 9, rng)
        if (i > 0 && next === digitsArr[i - 1]) next = (next % 9) + 1
        digitsArr.push(next)
      }
    }
    const sequence = digitsArr.join('')
    let pairCount = 0
    for (let i = 0; i < digitsArr.length - 1; i += 1) {
      if (digitsArr[i] === digitsArr[i + 1]) pairCount += 1
    }
    const { options, answer } = buildOptions(
      String(pairCount),
      [String(pairCount + 1), String(Math.max(0, pairCount - 1)), String(pairCount + 2), String(pairCount + 3)],
      rng,
    )
    return {
      id,
      aptitudeId: 'perceptiva',
      prompt: `¿Cuántos pares de dígitos consecutivos iguales aparecen en ${sequence}?`,
      options,
      answer,
      explanation: `Recorriendo ${sequence} de izquierda a derecha, existen exactamente ${pairCount} parejas de dígitos adyacentes idénticos.`,
      tip: 'Avanza posición a posición comparando cada dígito solo con el siguiente.',
      difficulty: 'Intermedio',
      topic: 'Atención numérica',
    }
  }

  if (variant === 2) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N']
    const start = randomInt(0, letters.length - 5, rng)
    const sorted = [letters[start], letters[start + 1], letters[start + 2], letters[start + 4]].join('')
    const wrong1 = [letters[start], letters[start + 2], letters[start + 1], letters[start + 4]].join('')
    const wrong2 = [letters[start + 1], letters[start], letters[start + 2], letters[start + 4]].join('')
    const wrong3 = [letters[start], letters[start + 1], letters[start + 4], letters[start + 2]].join('')
    const { options, answer } = buildOptions(sorted, [wrong1, wrong2, wrong3], rng)
    return {
      id,
      aptitudeId: 'perceptiva',
      prompt: '¿Cuál de estas secuencias está ordenada alfabéticamente?',
      options,
      answer,
      explanation: `En «${sorted}» cada letra sigue estrictamente el orden alfabético creciente.`,
      tip: 'Verifica todas las transiciones entre letras adyacentes, no solo la primera y la última.',
      difficulty: 'Básico',
      topic: 'Ordenación',
    }
  }

  const symbols = ['△', '○', '□', '◇']
  const counts = [2, 2, 2, 2]
  const uniqueIdx = randomInt(0, 3, rng)
  counts[uniqueIdx] = 1
  const flat: string[] = []
  symbols.forEach((sym, sIdx) => {
    for (let c = 0; c < counts[sIdx]; c += 1) flat.push(sym)
  })
  const sequence = shuffleArray(flat, rng).join('  ')
  const correct = symbols[uniqueIdx]
  const { options, answer } = buildOptions(
    correct,
    symbols.filter((s) => s !== correct),
    rng,
  )
  return {
    id,
    aptitudeId: 'perceptiva',
    prompt: `¿Qué símbolo aparece una sola vez?  ${sequence}`,
    options,
    answer,
    explanation: `El símbolo ${correct} aparece exactamente una vez mientras que los demás se repiten.`,
    tip: 'Cuenta por tipo de símbolo antes de responder.',
    difficulty: 'Básico',
    topic: 'Recuento visual',
  }
}

function generateAbstractQuestion(index: number, seed: number, rng: () => number): Question {
  const variant = index % 4
  const id = `gen-abs-${seed}-${index}`

  if (variant === 0) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const start = randomInt(0, 7, rng)
    const step = randomInt(2, 4, rng)
    const seq = [0, 1, 2, 3].map((k) => alphabet[start + k * step])
    const next = alphabet[start + 4 * step]
    const { options, answer } = buildOptions(
      next,
      [
        alphabet[start + 4 * step + 1],
        alphabet[Math.max(0, start + 4 * step - 1)],
        alphabet[start + 4 * step + 2],
      ],
      rng,
    )
    return {
      id,
      aptitudeId: 'abstracta',
      prompt: `Completa la serie de letras: ${seq.join(' – ')} – …`,
      options,
      answer,
      explanation: `Cada letra avanza +${step} posiciones en el alfabeto. Tras ${seq[3]} corresponde ${next}.`,
      tip: 'Convierte mentalmente las letras en posiciones numéricas para ver el salto exacto.',
      difficulty: 'Intermedio',
      topic: 'Series alfabéticas',
    }
  }

  if (variant === 1) {
    const start = randomInt(2, 6, rng)
    const stepSides = pickOne([1, 2], rng)
    const steps = pickOne([2, 3], rng)
    const totalSides = start + 1 + stepSides * steps // start=2 -> triangle (3 sides) if we map cleanly
    const polygonBySides: Record<number, string> = {
      3: 'Triángulo',
      4: 'Cuadrilátero',
      5: 'Pentágono',
      6: 'Hexágono',
      7: 'Heptágono',
      8: 'Octógono',
      9: 'Eneágono',
      10: 'Decágono',
    }
    const baseSides = pickOne([3, 4], rng)
    const finalSides = baseSides + stepSides * steps
    const startName = polygonBySides[baseSides] ?? 'Triángulo'
    const correct = polygonBySides[finalSides] ?? `${finalSides} lados`
    const { options, answer } = buildOptions(
      correct,
      Object.entries(polygonBySides)
        .filter(([sides]) => Number(sides) !== finalSides && Number(sides) >= 4 && Number(sides) <= 9)
        .map(([, name]) => name),
      rng,
    )
    void totalSides
    void start
    return {
      id,
      aptitudeId: 'abstracta',
      prompt: `Si cada paso añade ${stepSides} ${stepSides === 1 ? 'lado' : 'lados'} a un ${startName.toLowerCase()}, ¿qué polígono se obtiene tras ${steps} pasos?`,
      options,
      answer,
      explanation: `El ${startName.toLowerCase()} parte con ${baseSides} lados. Tras ${steps} pasos (+${stepSides * steps}) tiene ${finalSides} lados: ${correct.toLowerCase()}.`,
      tip: 'Anota el número inicial de lados y suma el incremento multiplicado por los pasos.',
      difficulty: 'Avanzado',
      topic: 'Reglas geométricas',
    }
  }

  if (variant === 2) {
    const n = randomInt(5, 19, rng)
    const mult = pickOne([2, 3], rng)
    const offset = pickOne([-1, 1, 2, -2], rng)
    const result = n * mult + offset
    const ruleText = `${mult === 2 ? 'duplicar' : 'triplicar'} la cantidad y ${offset > 0 ? `sumar ${offset}` : `restar ${Math.abs(offset)}`}`
    const { options, answer } = buildOptions(
      String(result),
      [String(result + 1), String(result - 1), String(n * mult), String(result + 2)],
      rng,
    )
    return {
      id,
      aptitudeId: 'abstracta',
      prompt: `Si la regla es «${ruleText}», ¿qué valor sigue a ${n}?`,
      options,
      answer,
      explanation: `${n} × ${mult} ${offset >= 0 ? `+ ${offset}` : `− ${Math.abs(offset)}`} = ${result}.`,
      tip: 'Aplica las operaciones estrictamente en el orden que describe la regla.',
      difficulty: 'Básico',
      topic: 'Reglas lógicas',
    }
  }

  const offset = randomInt(1, 5, rng)
  const seq = [1, 2, 3, 4].map((n) => n * n + offset)
  const next = 25 + offset
  const { options, answer } = buildOptions(
    String(next),
    [String(next - 2), String(next + 2), String(next + 4), String(seq[3] + 7)],
    rng,
  )
  return {
    id,
    aptitudeId: 'abstracta',
    prompt: `¿Qué número completa la serie? ${seq.join(' – ')} – …`,
    options,
    answer,
    explanation: `Cada término sigue la forma n² + ${offset}: 1²+${offset}, 2²+${offset}, 3²+${offset}, 4²+${offset}; sigue 5² + ${offset} = ${next}.`,
    tip: 'Calcula las diferencias entre términos; si crecen de forma constante (+3, +5, +7, +9...), la serie se basa en cuadrados.',
    difficulty: 'Avanzado',
    topic: 'Series numéricas',
  }
}

export interface MemoryScenario {
  brief: string
  questions: Question[]
}

export function generateMemoryScenario(seed = createSeed()): MemoryScenario {
  const rng = mulberry32(seed)
  const unit = randomInt(10, 48, rng)
  const destinations = ['Base Sierra Norte', 'Base Valle Sur', 'Puerto Atlántico', 'Acuartelamiento Este']
  const destination = pickOne(destinations, rng)
  const truck = randomInt(12, 89, rng)
  const hours = pickOne(['05:45', '06:15', '06:40', '07:20', '08:10'], rng)
  const personnel = randomInt(8, 22, rng)
  const boxes = randomInt(4, 14, rng)
  const radios = randomInt(2, 7, rng)
  const meetings = ['Puerta este', 'Puerta norte', 'Puesto de mando', 'Acceso principal']
  const meeting = pickOne(meetings, rng)
  const officers = ['Cabo Martín', 'Sargento López', 'Cabo Ruiz', 'Teniente Navarro']
  const officer = pickOne(officers, rng)
  const codeDigits = [randomInt(1, 9, rng), randomInt(1, 9, rng), randomInt(1, 9, rng), randomInt(1, 9, rng)]
  const code = codeDigits.join('–')
  const checks = ['revisión de combustible', 'presión de neumáticos', 'comprobación de enlaces radio', 'nivel de aceite']
  const check = pickOne(checks, rng)

  const brief = [
    `INFORME DE SERVICIO · UNIDAD ${unit}`,
    '',
    `Destino: ${destination}`,
    `Vehículo asignado: camión ${truck}`,
    `Hora de salida: ${hours}`,
    `Personal: ${personnel} integrantes`,
    `Material: ${boxes} cajas de suministros y ${radios} radios`,
    `Punto de encuentro: ${meeting.toLowerCase()}`,
    `Responsable: ${officer.toLowerCase()}`,
    `Código de acceso: ${codeDigits.join(' – ')}`,
    `Incidencia: ${check} antes de la salida`,
  ].join('\n')

  const makeMem = (
    idx: number,
    prompt: string,
    correct: string,
    distractors: string[],
    explanation: string,
    tip: string,
    difficulty: Question['difficulty'],
    topic: string,
  ): Question => {
    const { options, answer } = buildOptions(correct, distractors, rng)
    return {
      id: `gen-mem-${seed}-${idx}`,
      aptitudeId: 'memoria',
      prompt,
      options,
      answer,
      explanation,
      tip,
      difficulty,
      topic,
    }
  }

  const questions: Question[] = [
    makeMem(
      1,
      '¿Cuál era el destino indicado en el informe?',
      destination,
      destinations.filter((d) => d !== destination),
      `El informe indicaba como destino ${destination}.`,
      'Visualiza el destino con una imagen mental clara.',
      'Básico',
      'Memoria verbal',
    ),
    makeMem(
      2,
      '¿Qué número tenía asignado el camión?',
      String(truck),
      [String(truck + 5), String(truck - 3), String(unit)],
      `El vehículo asignado era el camión ${truck}.`,
      'Asocia la palabra «camión» directamente con su número.',
      'Básico',
      'Memoria numérica',
    ),
    makeMem(
      3,
      '¿A qué hora estaba prevista la salida?',
      hours,
      ['05:45', '06:15', '06:40', '07:20', '08:10'].filter((h) => h !== hours),
      `La salida estaba fijada a las ${hours}.`,
      'Divide la hora en dos cifras fáciles de recordar.',
      'Básico',
      'Memoria numérica',
    ),
    makeMem(
      4,
      '¿Cuántas personas formaban el personal?',
      String(personnel),
      [String(personnel + 2), String(personnel - 2), String(boxes)],
      `El informe indicaba ${personnel} integrantes.`,
      'Relaciona el número de personas con una formación mental.',
      'Básico',
      'Memoria de datos',
    ),
    makeMem(
      5,
      '¿Cuántas cajas de suministros se transportaban?',
      String(boxes),
      [String(boxes + 2), String(Math.max(1, boxes - 2)), String(radios)],
      `Se transportaban ${boxes} cajas de suministros.`,
      'Empareja cada cifra con el tipo de material.',
      'Básico',
      'Memoria de datos',
    ),
    makeMem(
      6,
      '¿Cuántas radios se incluían en el material?',
      String(radios),
      [String(radios + 1), String(radios + 3), String(boxes)],
      `El material incluía ${radios} radios.`,
      'Separa visualmente el número de radios del número de cajas.',
      'Básico',
      'Memoria de datos',
    ),
    makeMem(
      7,
      '¿Cuál era el punto de encuentro?',
      meeting,
      meetings.filter((m) => m !== meeting),
      `El punto de encuentro era ${meeting.toLowerCase()}.`,
      'Sitúa el punto de encuentro mentalmente en un plano.',
      'Básico',
      'Memoria verbal',
    ),
    makeMem(
      8,
      '¿Quién figuraba como responsable?',
      officer,
      officers.filter((o) => o !== officer),
      `La persona responsable era ${officer.toLowerCase()}.`,
      'Memoriza rango y apellido como un bloque único.',
      'Intermedio',
      'Memoria verbal',
    ),
    makeMem(
      9,
      '¿Cuál era el código de acceso?',
      code,
      [
        [codeDigits[0], codeDigits[2], codeDigits[1], codeDigits[3]].join('–'),
        [codeDigits[1], codeDigits[0], codeDigits[2], codeDigits[3]].join('–'),
        [codeDigits[0], codeDigits[1], codeDigits[3], codeDigits[2]].join('–'),
        codeDigits.map((d) => (d % 9) + 1).join('–'),
      ],
      `El código de acceso era ${code}.`,
      'Agrupa los cuatro dígitos en dos parejas.',
      'Intermedio',
      'Memoria secuencial',
    ),
    makeMem(
      10,
      '¿Qué incidencia debía atenderse antes de salir?',
      check.charAt(0).toUpperCase() + check.slice(1),
      checks.filter((c) => c !== check).map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
      `La incidencia señalaba: ${check} antes de la salida.`,
      'Recuerda la incidencia como una tarea práctica.',
      'Intermedio',
      'Memoria de instrucciones',
    ),
    makeMem(
      11,
      '¿Qué número identificaba a la unidad en el encabezado?',
      String(unit),
      [String(truck), String(unit + 4), String(personnel)],
      `El encabezado indicaba Unidad ${unit}.`,
      'Distingue los identificadores (unidad y camión) de las cantidades.',
      'Avanzado',
      'Memoria numérica',
    ),
    makeMem(
      12,
      '¿Qué combinación recoge correctamente la hora de salida y el personal?',
      `${hours} y ${personnel} integrantes`,
      [
        `${hours} y ${personnel + 2} integrantes`,
        `09:00 y ${personnel} integrantes`,
        `${hours} y ${boxes} integrantes`,
      ],
      `La salida era a las ${hours} con ${personnel} integrantes.`,
      'Comprueba cada dato de la pareja por separado.',
      'Avanzado',
      'Memoria combinada',
    ),
    makeMem(
      13,
      '¿Qué elemento aparecía inmediatamente después del vehículo asignado?',
      `Hora de salida: ${hours}`,
      [`Personal: ${personnel} integrantes`, `Destino: ${destination}`, `Punto de encuentro: ${meeting.toLowerCase()}`],
      `Tras el vehículo asignado figuraba la hora de salida (${hours}).`,
      'Recorre mentalmente la estructura de arriba abajo.',
      'Avanzado',
      'Memoria de orden',
    ),
    makeMem(
      14,
      '¿Qué elemento NO figuraba en el material transportado?',
      'Mapas topográficos',
      ['Cajas de suministros', 'Radios', 'Suministros'],
      'El inventario mencionaba cajas de suministros y radios, no mapas topográficos.',
      'Repasa los elementos del inventario uno a uno.',
      'Intermedio',
      'Memoria de detalles',
    ),
    makeMem(
      15,
      '¿Cuántos tipos de material distintos se mencionaban?',
      '2',
      ['1', '3', '4'],
      'Se mencionaban dos tipos: cajas de suministros y radios.',
      'Distingue entre tipos de objeto y número total de unidades.',
      'Intermedio',
      'Memoria de clasificación',
    ),
  ]

  return { brief, questions }
}

export function generateDynamicSessionData(
  aptitudeId: AptitudeId | 'full',
  countPerAptitude = 15,
  seed = createSeed(),
): { questions: Question[]; memoryBrief?: string } {
  const rng = mulberry32(seed)

  if (aptitudeId === 'memoria') {
    const scenario = generateMemoryScenario(seed)
    return {
      questions: scenario.questions.slice(0, countPerAptitude),
      memoryBrief: scenario.brief,
    }
  }

  if (aptitudeId === 'full') {
    const memoryScenario = generateMemoryScenario(seed + 77)
    const questions: Question[] = []
    for (const apt of aptitudes) {
      if (apt.id === 'memoria') {
        questions.push(...memoryScenario.questions.slice(0, countPerAptitude))
      } else {
        const result = generateDynamicSessionData(apt.id, countPerAptitude, seed + apt.id.length * 131)
        questions.push(...result.questions)
      }
    }
    return { questions, memoryBrief: memoryScenario.brief }
  }

  if (aptitudeId === 'verbal') {
    const base = shuffleArray(getQuestionsForAptitude('verbal'), rng)
    return { questions: base.slice(0, countPerAptitude) }
  }

  const generated: Question[] = []
  for (let i = 0; i < countPerAptitude; i += 1) {
    if (aptitudeId === 'numerica') generated.push(generateNumericQuestion(i, seed, rng))
    else if (aptitudeId === 'espacial') generated.push(generateSpatialQuestion(i, seed, rng))
    else if (aptitudeId === 'mecanica') generated.push(generateMechanicalQuestion(i, seed, rng))
    else if (aptitudeId === 'perceptiva') generated.push(generatePerceptiveQuestion(i, seed, rng))
    else if (aptitudeId === 'abstracta') generated.push(generateAbstractQuestion(i, seed, rng))
  }

  return { questions: generated }
}
