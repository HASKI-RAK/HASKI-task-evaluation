import { GraphSchema } from '@haski/ta-lib'
import { DownloadForOffline, UploadFile } from '@mui/icons-material'
import MenuIcon from '@mui/icons-material/Menu'
import ReplayIcon from '@mui/icons-material/Replay'
import SaveIcon from '@mui/icons-material/Save'
import {
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  styled,
  Toolbar,
  Typography
} from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { drawerWidth } from '@/pages/Editor'
import { getConfig } from '@/utils/config'

interface AppBarProps extends MuiAppBarProps {
  currentPath?: string
  open?: boolean
  handleDrawerOpen?: () => void
  handleSaveGraph?: () => void
  handleClickChangeSocketUrl?: () => void
  handleDownloadGraph?: () => void
  handleUploadGraph?: () => void
  handleWorkflowChange?: (workflow: string) => void
}

const AppBarStyled = styled(MuiAppBar, {
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

export const AppBar = (props: AppBarProps) => {
  const location = useLocation()
  const [workflows, setWorkflows] = useState<GraphSchema[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<GraphSchema>()

  const workflowChange = (workflow: string) => {
    setSelectedWorkflow(workflows.find((graph) => graph.path === workflow))
    props.handleWorkflowChange?.(workflow)
  }

  useEffect(() => {
    fetch(getConfig().API + 'v1/graphs')
      .then((res) => res.json())
      .then((graphs: Array<GraphSchema>) => {
        setWorkflows(graphs)
        // set the selected workflow
        setSelectedWorkflow(
          graphs.find((graph) => graph.path === props.currentPath) || graphs[0]
        )
      })
  }, [location.pathname])

  return (
    <AppBarStyled position="fixed" open={props.open}>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }} component="div">
          Task Editor
        </Typography>
        <FormControl>
          <Stack direction="column" padding={1} spacing={1}>
            <Typography variant="body1">Workflow:</Typography>
            <Select
              value={selectedWorkflow?.path || ''}
              sx={{ minWidth: 200 }}
              onChange={(e) => workflowChange(e.target.value)}
            >
              {workflows.map((workflow) => (
                <MenuItem key={workflow.id} value={workflow.path}>
                  {
                    workflow.path // actual name of the graph from db
                  }
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </FormControl>
        <Tooltip title="Reconnect to websocket">
          <IconButton
            aria-label="change socket url"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            color="inherit"
            onClick={props.handleClickChangeSocketUrl}
          >
            <ReplayIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Upload graph">
          <IconButton
            onClick={props.handleUploadGraph}
            aria-label="upload"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            color="inherit"
          >
            <UploadFile />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download graph">
          <IconButton
            onClick={props.handleDownloadGraph}
            aria-label="download"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            color="inherit"
          >
            <DownloadForOffline />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save graph">
          <IconButton
            onClick={props.handleSaveGraph}
            aria-label="save"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            color="inherit"
          >
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Task assessment preview">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={props.handleDrawerOpen}
            sx={{ ...(props.open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBarStyled>
  )
}

export default AppBar
