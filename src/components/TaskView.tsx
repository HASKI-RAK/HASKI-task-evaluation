import { Button, FormControl, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const useTask = (id: string) => {
  return {
    data: {
      title: 'Strategie Entwurfsmuster',
      description: 'Explain the strategy pattern'
    }
  }
}

const TaskView = ({ onSubmit }: { onSubmit: (answer: string) => void }) => {
  const { id } = useParams<{ id: string }>()
  const { data: task } = useTask(id)

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
    document.addEventListener('keydown', keyDownHandlerCtrlEnter)
    return () => {
      document.removeEventListener('keydown', keyDownHandlerCtrlEnter)
    }
  }, [])

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
          </Stack>
        </FormControl>
      </form>
    </Stack>
  )
}
export default TaskView
