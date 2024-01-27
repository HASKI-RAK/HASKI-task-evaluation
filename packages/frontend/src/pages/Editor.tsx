import {
  handleWsRequest,
  LGraph,
  LiteGraph,
  SerializedGraph,
  ServerEventPayload,
  WebSocketEvent
} from '@haski/lib'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  AlertColor,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  styled,
  Typography,
  useTheme
} from '@mui/material'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import Snackbar from '@/common/SnackBar'
import { AppBar } from '@/components/AppBar'
import Canvas from '@/components/Canvas'
import TaskView from '@/components/TaskView'
import { getConfig } from '@/utils/config'

export const drawerWidth = 500

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean
}>(({ theme, open }) => ({
  flexGrow: 1,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  marginRight: -drawerWidth,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginRight: 0
  }),
  /**
   * This is necessary to enable the selection of content. In the DOM, the stacking order is determined
   * by the order of appearance. Following this rule, elements appearing later in the markup will overlay
   * those that appear earlier. Since the Drawer comes after the Main content, this adjustment ensures
   * proper interaction with the underlying content.
   */
  position: 'relative'
}))

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-start'
}))

export const Editor = () => {
  const [open, setOpen] = useState(true)
  const [snackbar, setSnackbar] = useState<{
    message: string
    severity: AlertColor
    open: boolean
  }>({
    message: '',
    severity: 'success',
    open: false
  })
  const [outputs, setOutputs] = useState<
    Record<string, ServerEventPayload['output']> | undefined
  >(undefined)
  const [maxInputChars, setMaxInputChars] = useState<number>(300)
  const lgraph = useMemo(() => new LiteGraph.LGraph(), [])
  const [socketUrl, setSocketUrl] = useState(
    getConfig().API_WS ?? 'ws://localhost:5000/ws/editor/ke.haski.app/2/2'
  )
  const [size, setSize] = useState({
    width: window.outerWidth,
    height: window.outerHeight
  })
  const theme = useTheme()
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(socketUrl)

  const checkSize = useCallback(() => {
    setSize({
      width: window.outerWidth,
      height: window.outerWidth
    })
  }, [open])

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbar({ ...snackbar, open: false })
  }

  const handleNodeExecuting = (lgraph: LGraph, nodeId: number) => {
    if (lgraph.getNodeById(nodeId) === null) return
    // eslint-disable-next-line immutable/no-mutation
    lgraph.getNodeById(nodeId)!.color = '#88FF00'
    lgraph.setDirtyCanvas(true, true)
  }

  const handleNodeExecuted = (lgraph: LGraph, nodeId: number) => {
    if (lgraph.getNodeById(nodeId) === null) return
    // eslint-disable-next-line immutable/no-mutation
    lgraph.getNodeById(nodeId)!.color = '#FFFFFF00'
    lgraph.setDirtyCanvas(true, true)
  }

  const handleSaveGraph = () => {
    sendJsonMessage({
      eventName: 'saveGraph',
      payload: lgraph.serialize()
    })
  }

  useEffect(() => {
    if (lastMessage !== null) {
      const wsEvent: WebSocketEvent<ServerEventPayload> = JSON.parse(lastMessage.data)
      //* Handle events from server
      if (
        !handleWsRequest<ServerEventPayload>(wsEvent, {
          graphFinished: (payload) => {
            console.log('Graph finished: ', payload)
            lgraph.configure(payload)
            lgraph.setDirtyCanvas(true, true)
          },
          nodeExecuting: (nodeId) => handleNodeExecuting(lgraph, nodeId),
          nodeExecuted: (nodeId) => handleNodeExecuted(lgraph, nodeId),
          graphSaved: () => {
            setSnackbar({
              message: 'Graph saved',
              severity: 'success',
              open: true
            })
          },
          output(output) {
            // check if output is already in outputs, if not add it, otherwise update it
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
          }
        })
      ) {
        setSnackbar({
          message: 'No handler for this event',
          severity: 'error',
          open: true
        })
      }
    }
    setOpen(true)
    window.addEventListener('resize', checkSize)
    return () => {
      window.removeEventListener('resize', checkSize)
    }
  }, [lastMessage])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = (answer: string) => {
    // TODO: Add type to json
    sendJsonMessage({
      eventName: 'runGraph',
      payload: {
        answer: answer,
        graph: lgraph.serialize<SerializedGraph>()
      }
    })
  }

  const handleClickChangeSocketUrl = useCallback(
    () =>
      setSocketUrl(
        getConfig().API_WS ?? 'ws://localhost:5000/ws/editor/ke.haski.app/2/2'
      ),
    []
  )

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting...',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Connection closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated'
  }[readyState]
  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <AppBar
          open={open}
          handleClickChangeSocketUrl={handleClickChangeSocketUrl}
          handleSaveGraph={handleSaveGraph}
          handleDrawerOpen={handleDrawerOpen}
        />
        <Main open={open}>
          <Button
            onClick={handleDrawerOpen}
            variant="contained"
            startIcon={
              <ArrowBackIosNewIcon
                sx={{
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: (theme) =>
                    theme.transitions.create('transform', {
                      duration: theme.transitions.duration.shortest
                    })
                }}
              />
            }
            style={{ position: 'absolute', top: 0, right: 0 }}
          >
            {open ? 'Close' : 'Open'}
          </Button>
          <Canvas lgraph={lgraph} width={size.width} height={size.height} />
        </Main>
        {/* WS connection indicator status */}
        <Typography
          variant="body1"
          sx={{
            position: 'absolute',
            bottom: 0,
            padding: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            marginRight: drawerWidth
          }}
        >
          {connectionStatus}
        </Typography>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth
            }
          }}
          variant="persistent"
          anchor="right"
          open={open}
        >
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Task preview
            </Typography>
          </DrawerHeader>
          <Divider />
          <TaskView
            onSubmit={(answer) => handleSubmit(answer)}
            outputs={outputs}
            maxInputChars={maxInputChars}
          />
        </Drawer>
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

export default memo(Editor)
