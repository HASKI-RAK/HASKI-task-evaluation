import {
  ClientPayload,
  handleWsRequest,
  LiteGraph,
  SerializedGraph,
  ServerEventPayload,
  WebSocketEvent
} from '@haski/ta-lib'
import { AlertColor, Backdrop, Box, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import Snackbar from '@/common/SnackBar'
import CircularProgressWithLabel from '@/components/CircularProgressWithLabel'
import TaskView from '@/components/TaskView'
import { getConfig } from '@/utils/config'

export const StudentView = () => {
  const { domain, courseId, elementId } = useParams<{
    domain: string
    courseId: string
    elementId: string
  }>()
  const [snackbar, setSnackbar] = useState<{
    message: string
    severity: AlertColor
    open: boolean
  }>({
    message: '',
    severity: 'success',
    open: false
  })
  const [question, setQuestion] = useState<string>('')
  const [outputs, setOutputs] = useState<
    Record<string, ServerEventPayload['output']> | undefined
  >(undefined)
  const memoizedOutputs = useMemo(() => outputs, [outputs])
  const [image, setImage] = useState<string>('')
  const [maxInputChars, setMaxInputChars] = useState<number>(300)
  const [processingPercentage, setProcessingPercentage] = useState<number>(0)
  const lgraph = useMemo(() => new LiteGraph.LGraph(), [])
  const [socketUrl] = useState(
    (getConfig().WS ?? 'ws://localhost:5000/') +
      `ws/student/${domain}/${courseId}/${elementId}`
  )
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(socketUrl)

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbar({ ...snackbar, open: false })
  }

  useEffect(() => {
    if (lastMessage !== null) {
      const wsEvent: WebSocketEvent<ServerEventPayload> = JSON.parse(lastMessage.data)
      //* Handle events from server
      handleWsRequest<ServerEventPayload>(wsEvent, {
        graphFinished: (payload) => {
          console.log('Graph finished: ', payload)
          setProcessingPercentage(0)
          lgraph.configure(payload)
          lgraph.setDirtyCanvas(true, true)
        },
        question(payload) {
          setQuestion(payload)
        },
        graphSaved: () => {
          setSnackbar({
            message: 'Graph saved',
            severity: 'success',
            open: true
          })
        },
        output(output) {
          // check if output is already in outputs, if not add it, otherwise update it
          console.log('Outputs: ', outputs)
          setOutputs((prev) => {
            if (prev === undefined) return { [output.uniqueId]: output }
            return { ...prev, [output.uniqueId]: output }
          })
          console.log('Output: ', output)
        },
        nodeError(payload) {
          console.warn('Node error: ', payload)
          setSnackbar({
            message: payload.error,
            severity: 'error',
            open: true
          })
        },
        maxInputChars(maxChars) {
          setMaxInputChars(maxChars)
        },
        processingPercentageUpdate(payload) {
          setProcessingPercentage(payload)
        },
        // We don't have handlers for these events
        nodeExecuting: function (): void | Promise<void> {},
        nodeExecuted: function (): void | Promise<void> {},
        questionImage: function (base64Image: string): void | Promise<void> {
          setImage(base64Image)
        }
      }).then((handled) => {
        if (!handled) {
          setSnackbar({
            message: 'No handler for this event',
            severity: 'error',
            open: true
          })
        }
      })
    }
  }, [lastMessage])

  const handleSubmit = (answer: string) => {
    sendJsonMessage<ClientPayload>({
      eventName: 'runGraph',
      payload: {
        answer: answer,
        graph: lgraph.serialize<SerializedGraph>()
      }
    })
  }

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting...',
    [ReadyState.OPEN]: '',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Connection closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated'
  }[readyState]

  const handleAnswerSubmit = useCallback((answer: string) => {
    handleSubmit(answer)
  }, [])

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={processingPercentage > 0 && processingPercentage < 100}
      >
        <CircularProgressWithLabel value={processingPercentage} />
      </Backdrop>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}
      >
        <Typography
          variant="body1"
          sx={{
            position: 'absolute',
            bottom: 0,
            padding: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white'
          }}
        >
          {connectionStatus}
        </Typography>
        <Stack direction="column" spacing={2}>
          <TaskView
            question={question}
            questionImage={image}
            onSubmit={handleAnswerSubmit}
            outputs={memoizedOutputs}
            maxInputChars={maxInputChars}
          />
        </Stack>
      </Box>
      <Snackbar
        open={snackbar.open}
        handleClose={handleSnackbarClose}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </>
  )
}

export default StudentView
