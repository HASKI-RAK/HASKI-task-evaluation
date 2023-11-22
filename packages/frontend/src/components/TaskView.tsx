import { Button, FormControl, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const useTask = (id: string) => {
  console.log('useTask', id)
  return {
    data: {
      title: 'Strategie Entwurfsmuster',
      description: 'Explain the strategy pattern'
    }
  }
}

const TaskView = ({
  onSubmit,
  feedback
}: {
  onSubmit: (answer: string) => void
  feedback?: string
}) => {
  const { id } = useParams<{ id: string }>()
  const { data: task } = useTask(id ?? '1')

  const [error, setError] = useState<string | null>(null)
  const [answer, setAnswer] = useState<string>('')

  const validateAnswer = (): boolean => {
    if (answer.length < 10) {
      setError('Answer must be at least 10 characters long')
      return false
    } else {
      setError(null)
      return true
    }
  }

  const keyDownHandlerCtrlEnter = (event: KeyboardEvent): void => {
    if (event.ctrlKey && event.key === 'Enter') {
      console.log('ctrl+enter')
      validateAnswer()
    }
  }

  const handleSubmit = (event?: React.FormEvent<HTMLFormElement>): void => {
    event?.preventDefault()
    validateAnswer()
    onSubmit(answer)
  }

  useEffect(() => {
    console.log('Task view rendered with feedback: ', feedback ?? 'no feedback')
    document.addEventListener('keydown', keyDownHandlerCtrlEnter)
    return () => {
      document.removeEventListener('keydown', keyDownHandlerCtrlEnter)
    }
  }, [feedback])

  return (
    <Stack spacing={2} margin={2}>
      <Typography variant="h4">{task.title}</Typography>
      <Typography variant="body1">{task.description}</Typography>
      <form
        onSubmit={handleSubmit}
        noValidate
        autoComplete="off"
        style={{ width: '100%' }}
      >
        <FormControl fullWidth error={!!error}>
          <Stack spacing={2}>
            <TextField
              id="outlined-multiline-static"
              label="Answer"
              multiline
              error={!!error}
              rows={4}
              placeholder="Write your answer here"
              onChange={(event) => setAnswer(event.target.value)}
            />
            <Button variant="contained" type="submit" onClick={() => handleSubmit()}>
              Submit
            </Button>
            {feedback && (
              <>
                <Typography variant="h6">Feedback:</Typography>
                <Typography variant="body1">{feedback}</Typography>
                <Typography variant="body2">
                  Please note that answered generated by the system may be incorrect or
                  contain misleading information.
                </Typography>
              </>
            )}
          </Stack>
        </FormControl>
      </form>
    </Stack>
  )
}
export default TaskView