import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StudentView } from './StudentView'

const mocks = vi.hoisted(() => ({
  beginAttempt: vi.fn(),
  beginGraphLoad: vi.fn(),
  failAttempt: vi.fn(),
  loadGraph: vi.fn(),
  runGraph: vi.fn(),
  useServerEvents: vi.fn(),
  useSocket: vi.fn()
}))

vi.mock('@/hooks/useSocket', () => ({ useSocket: mocks.useSocket }))
vi.mock('@/hooks/useServerEvents', () => ({
  useServerEvents: mocks.useServerEvents
}))
vi.mock('@/common/SnackBar', () => ({ default: () => null }))
vi.mock('@/components/TaskView', () => ({
  default: ({ disabled }: { disabled: boolean }) => (
    <button type="button" disabled={disabled}>
      Submit answer
    </button>
  )
}))

const baseServerEvents = {
  outputs: undefined,
  question: 'Question',
  image: undefined,
  maxInputChars: 1500,
  processingPercentage: 0,
  graphState: 'ready',
  attemptState: 'idle',
  failureMessage: undefined,
  snackbar: { message: '', severity: 'success', open: false },
  beginGraphLoad: mocks.beginGraphLoad,
  beginAttempt: mocks.beginAttempt,
  failAttempt: mocks.failAttempt,
  handleSnackbarClose: vi.fn()
}

function renderStudentView() {
  return render(
    <MemoryRouter initialEntries={['/ws/student/demo/1/1']}>
      <Routes>
        <Route
          path="/ws/student/:domain/:courseId/:elementId"
          element={<StudentView />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('StudentView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useSocket.mockReturnValue({
      socket: null,
      connectionStatus: 'Connected',
      runGraph: mocks.runGraph,
      loadGraph: mocks.loadGraph
    })
    mocks.useServerEvents.mockReturnValue({ ...baseServerEvents })
  })

  it('shows connection and loading states', () => {
    mocks.useSocket.mockReturnValue({
      socket: null,
      connectionStatus: 'Disconnected',
      runGraph: mocks.runGraph,
      loadGraph: mocks.loadGraph
    })
    const { rerender } = renderStudentView()

    expect(screen.getByText('Connection to the server is unavailable.')).toBeVisible()

    mocks.useSocket.mockReturnValue({
      socket: null,
      connectionStatus: 'Connected',
      runGraph: mocks.runGraph,
      loadGraph: mocks.loadGraph
    })
    mocks.useServerEvents.mockReturnValue({
      ...baseServerEvents,
      graphState: 'loading'
    })
    rerender(
      <MemoryRouter initialEntries={['/ws/student/demo/1/1']}>
        <Routes>
          <Route
            path="/ws/student/:domain/:courseId/:elementId"
            element={<StudentView />}
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByLabelText('Loading task')).toBeVisible()
  })

  it('retries a missing graph', async () => {
    const user = userEvent.setup()
    mocks.useServerEvents.mockReturnValue({
      ...baseServerEvents,
      graphState: 'not-found',
      failureMessage: 'Task not found'
    })
    renderStudentView()

    expect(screen.getByText('Task not found')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(mocks.beginGraphLoad).toHaveBeenCalled()
    expect(mocks.loadGraph).toHaveBeenCalledWith('/ws/student/demo/1/1')
  })

  it('disables submission while an attempt runs', () => {
    mocks.useServerEvents.mockReturnValue({
      ...baseServerEvents,
      attemptState: 'running'
    })
    renderStudentView()

    expect(screen.getByRole('button', { name: 'Submit answer' })).toBeDisabled()
  })
})
