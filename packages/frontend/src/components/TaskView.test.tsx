import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import TaskView from './TaskView'

describe('TaskView', () => {
  it('does not submit an invalid answer', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TaskView question="Question" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Antwort'), 'short')
    await user.click(screen.getByRole('button', { name: 'Absenden' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Answer must be at least 10 characters long')).toBeVisible()
  })

  it('submits a valid answer with Ctrl+Enter', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TaskView question="Question" onSubmit={onSubmit} />)
    const input = screen.getByLabelText('Antwort')

    await user.type(input, 'A sufficiently long answer')
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith('A sufficiently long answer')
  })

  it('prevents another submission while an attempt is running', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    function RunningAttempt() {
      const [running, setRunning] = useState(false)
      return (
        <TaskView
          question="Question"
          disabled={running}
          onSubmit={(answer) => {
            onSubmit(answer)
            setRunning(true)
          }}
        />
      )
    }

    render(<RunningAttempt />)
    await user.type(screen.getByLabelText('Antwort'), 'A sufficiently long answer')
    await user.dblClick(screen.getByRole('button', { name: 'Absenden' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Wird ausgewertet...' })).toBeDisabled()
  })
})
