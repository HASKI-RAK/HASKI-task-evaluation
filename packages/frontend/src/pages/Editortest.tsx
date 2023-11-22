import { LGraph, LiteGraph, ServerEvent, ServerEventPayload } from '@haski/lib'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MenuIcon from '@mui/icons-material/Menu'
import ReplayIcon from '@mui/icons-material/Replay'
import SaveIcon from '@mui/icons-material/Save'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  styled,
  Toolbar,
  Typography,
  useTheme
} from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import Snackbar from '@/common/SnackBar'
import Canvas from '@/components/Canvas'
import TaskView from '@/components/TaskView'
import { getConfig } from '@/utils/config'

const drawerWidth = 500

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

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open'
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginRight: drawerWidth
  })
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
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false)
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

    setIsSnackbarOpen(false)
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

  useEffect(() => {
    if (lastMessage !== null) {
      const lgraph_json = JSON.parse(lastMessage.data)
      handleWsRequest(
        lgraph_json,
        lgraph,
        handleNodeExecuting,
        handleNodeExecuted,
        () => {
          setIsSnackbarOpen(true)
          console.log('isSnackbarOpen: ', isSnackbarOpen)
          console.log('graphSaved')
        }
      )
    }
    setOpen(true)
    window.addEventListener('resize', checkSize)
    return () => {
      window.removeEventListener('resize', checkSize)
    }
  }, [lastMessage])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = () => {
    // TODO: Add type to json
    sendJsonMessage({
      eventName: 'runGraph',
      payload: JSON.stringify(lgraph.serialize())
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
        <AppBar position="fixed" open={open}>
          <Toolbar>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }} component="div">
              Task Editor
            </Typography>
            <IconButton
              aria-label="change socket url"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              color="inherit"
              onClick={handleClickChangeSocketUrl}
            >
              <ReplayIcon />
            </IconButton>
            <IconButton
              onClick={() =>
                sendJsonMessage({
                  eventName: 'saveGraph',
                  payload: JSON.stringify(lgraph.serialize())
                })
              }
              aria-label="save"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              color="inherit"
            >
              <SaveIcon />
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerOpen}
              sx={{ ...(open && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
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
          <TaskView onSubmit={() => handleSubmit()} />
        </Drawer>
      </Box>
      <Snackbar
        open={isSnackbarOpen}
        handleClose={handleSnackbarClose}
        message="Graph saved"
      />
    </>
  )
}
function handleWsRequest<T extends keyof ServerEventPayload>(
  lgraph_json: ServerEvent<T>,
  lgraph: LGraph,
  handleNodeExecuting: (lgraph: LGraph, nodeId: number) => void,
  handleNodeExecuted: (lgraph: LGraph, nodeId: number) => void,
  handleGraphSaved?: () => void
) {
  switch (lgraph_json.eventName) {
    case 'graphFinished':
      console.log('graphFinished')
      console.log(lgraph_json)
      lgraph.configure(lgraph_json.payload)
      break
    case 'nodeExecuting':
      handleNodeExecuting(lgraph, lgraph_json.payload)
      break
    case 'nodeExecuted':
      handleNodeExecuted(lgraph, lgraph_json.payload)
      break
    case 'graphSaved':
      handleGraphSaved?.()
      break
  }
}
