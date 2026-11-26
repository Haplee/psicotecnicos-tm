import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { defaultPreferences, writePreferences } from '../lib/storage'

describe('Flujos principales de la aplicación', () => {
  it('permite iniciar un entrenamiento libre, responder, entregar sin window.confirm y revisar resultados', async () => {
    writePreferences({
      ...defaultPreferences,
      shuffleQuestions: false,
      shuffleOptions: false,
      questionSource: 'bank',
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Entrenamiento' }))
    await user.selectOptions(screen.getByLabelText('Cantidad (libre)'), '5')
    await user.click(screen.getByRole('button', { name: /Entrenamiento libre/i }))

    expect(screen.getByText('0/5 respondidas')).toBeInTheDocument()

    const firstGroup = screen.getByRole('radiogroup', { name: 'Respuestas de la pregunta 1' })
    const secondOption = within(firstGroup).getAllByRole('radio')[1]
    await user.click(secondOption)

    expect(screen.getByText('1/5 respondidas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Entregar y corregir/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/1 de 5 respuestas/i)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: /Entregar y corregir/i }))

    expect(screen.getByText('Revisión de respuestas')).toBeInTheDocument()
    expect(screen.getByText('1/5')).toBeInTheDocument()
  })

  it('carga los apuntes base y permite editar el textarea de forma fluida', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Mis apuntes/i }))

    expect(screen.getByRole('heading', { name: 'Mis apuntes' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nuevo apunte' }))
    const textarea = screen.getByLabelText('Contenido del apunte') as HTMLTextAreaElement
    await user.type(textarea, 'Regla de tres inversa')

    expect(textarea.value).toBe('Regla de tres inversa')
  })
})
