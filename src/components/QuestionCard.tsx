import type { Question } from '../data/questions'
import { Diagram } from './Diagram'
import { Check, CircleHelp } from 'lucide-react'

interface Props {
  question: Question
  index: number
  value: number | null
  onChange: (value: number) => void
  showResult?: boolean
}

export function QuestionCard({ question, index, value, onChange, showResult = false }: Props) {
  const letters = ['A', 'B', 'C', 'D']
  const isCorrect = value === question.answer

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (showResult) return
    const key = event.key.toUpperCase()
    const keyMap: Record<string, number> = {
      '1': 0,
      '2': 1,
      '3': 2,
      '4': 3,
      A: 0,
      B: 1,
      C: 2,
      D: 3,
    }
    if (key in keyMap) {
      event.preventDefault()
      onChange(keyMap[key])
    }
  }

  return (
    <article
      className={`question-card ${showResult ? (isCorrect ? 'question-correct' : value === null ? 'question-unanswered' : 'question-incorrect') : ''}`}
      id={`question-${question.id}`}
      onKeyDown={handleKeyDown}
    >
      <div className="question-heading">
        <div className="question-number">{String(index).padStart(2, '0')}</div>
        <div className="question-meta"><span>{question.topic}</span><span className="dot-separator">·</span><span>{question.difficulty}</span></div>
        {showResult && <span className={`result-pill ${isCorrect ? 'good' : value === null ? 'neutral' : 'bad'}`}>{isCorrect ? 'Correcta' : value === null ? 'Sin responder' : 'Incorrecta'}</span>}
      </div>
      <h3 className="question-prompt">{question.prompt}</h3>
      {question.visual && <Diagram kind={question.visual} />}
      <div className="answer-options" role="radiogroup" aria-label={`Respuestas de la pregunta ${index}`}>
        {question.options.map((option, optionIndex) => {
          const selected = value === optionIndex
          const correctOption = showResult && question.answer === optionIndex
          const wrongSelected = showResult && selected && !isCorrect
          return (
            <label key={optionIndex} className={`answer-option ${selected ? 'selected' : ''} ${correctOption ? 'answer-correct' : ''} ${wrongSelected ? 'answer-wrong' : ''} ${showResult ? 'readonly' : ''}`}>
              <input type="radio" name={question.id} value={optionIndex} checked={selected} disabled={showResult} onChange={() => onChange(optionIndex)} />
              <span className="option-letter">{letters[optionIndex]}</span>
              <span className="option-text">{option}</span>
              {correctOption && <Check size={16} className="option-status" />}
              {wrongSelected && <CircleHelp size={16} className="option-status" />}
            </label>
          )
        })}
      </div>
      {showResult && (
        <div className="answer-explanation">
          <div className="explanation-title"><Check size={15} /> Explicación</div>
          <p>{question.explanation}</p>
          <div className="tip-box"><strong>Consejo:</strong> {question.tip}</div>
        </div>
      )}
    </article>
  )
}
