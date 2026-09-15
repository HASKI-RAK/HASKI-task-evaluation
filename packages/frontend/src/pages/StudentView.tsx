import { Alert, Backdrop, Box, Button, CircularProgress, Container } from '@mui/material'
import { LiteGraph } from 'litegraph.js'
import { useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import Snackbar from '@/common/SnackBar'
import CircularProgressWithLabel from '@/components/CircularProgressWithLabel'
import TaskView from '@/components/TaskView'
import { useServerEvents } from '@/hooks/useServerEvents'
import { useSocket } from '@/hooks/useSocket'

export const StudentView = () => {
  const { domain, courseId, elementId } = useParams<{
    domain: string
    courseId: string
    elementId: string
  }>()
  const searchParams = new URLSearchParams(window.location.search)

  // Create LiteGraph instance
  const lgraph = useMemo(() => new LiteGraph.LGraph(), [])

  // Set socket path based on URL params
  const socketPath = `/ws/student/${domain}/${courseId}/${elementId}`

  // Use the socket hook to manage socket connection
  const { socket, connectionStatus, runGraph, loadGraph } = useSocket({
    socketPath,
    lgraph
  })

  // Use the serverEvents hook to manage server events
  const {
    outputs,
    question,
    image,
    maxInputChars,
    processingPercentage,
    graphState,
    attemptState,
    failureMessage,
    snackbar,
    beginGraphLoad,
    beginAttempt,
    failAttempt,
    handleSnackbarClose
  } = useServerEvents({
    socket,
    lgraph
  })

  const memoizedOutputs = useMemo(() => outputs, [outputs])

  // Handle form submission
  const handleSubmit = useCallback(
    (answer: string) => {
      try {
        beginAttempt()
        runGraph({
          answer,
          xapi: {
            custom_activityname: searchParams.get('custom_activityname') || '',
            resource_link_title: searchParams.get('resource_link_title') || '',
            tool_consumer_info_product_family_code:
              searchParams.get('tool_consumer_info_product_family_code') || '',
            launch_presentation_locale:
              searchParams.get('launch_presentation_locale') || '',
            tool_consumer_instance_guid:
              searchParams.get('tool_consumer_instance_guid') || '',
            context_id: searchParams.get('context_id') || '',
            context_title: searchParams.get('context_title') || '',
            context_type: searchParams.get('context_type') || ''
          }
        })
      } catch (error) {
        console.error('Error running graph:', error)
        failAttempt(
          error instanceof Error
            ? error.message
            : 'The answer could not be evaluated. Please try again.'
        )
      }
    },
    [beginAttempt, failAttempt, runGraph, searchParams]
  )

  const handleLoadGraph = useCallback(() => {
    beginGraphLoad()
    loadGraph(socketPath)
  }, [beginGraphLoad, loadGraph, socketPath])

  // Load the graph when the connection is established
  useEffect(() => {
    // Only load the graph when the connection is established
    if (connectionStatus === 'Connected') {
      console.log('Loading graph for student view:', socketPath)
      handleLoadGraph()
    }
  }, [connectionStatus, handleLoadGraph, socketPath])

  // Debug outputs
  useEffect(() => {
    console.log('Student view outputs updated:', outputs)
  }, [outputs])

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={attemptState === 'running'}
      >
        <CircularProgressWithLabel value={processingPercentage} />
      </Backdrop>
      <Container
        style={{
          height: '100vh',
          overflowY: 'scroll'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          padding={2}
        >
          {connectionStatus !== 'Connected' && (
            <Alert severity="warning">Connection to the server is unavailable.</Alert>
          )}
          {connectionStatus === 'Connected' &&
            (graphState === 'idle' || graphState === 'loading') && (
              <CircularProgress aria-label="Loading task" />
            )}
          {(graphState === 'not-found' || graphState === 'failed') && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={handleLoadGraph}>
                  Retry
                </Button>
              }
            >
              {failureMessage}
            </Alert>
          )}
          {graphState === 'ready' && (
            <TaskView
              question={question}
              questionImage={image}
              onSubmit={handleSubmit}
              outputs={memoizedOutputs}
              maxInputChars={maxInputChars}
              disabled={attemptState === 'running' || connectionStatus !== 'Connected'}
            />
          )}
        </Box>
      </Container>
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
