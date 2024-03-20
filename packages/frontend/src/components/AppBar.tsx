import { DownloadForOffline } from '@mui/icons-material'
import MenuIcon from '@mui/icons-material/Menu'
import ReplayIcon from '@mui/icons-material/Replay'
import SaveIcon from '@mui/icons-material/Save'
import { IconButton, MenuItem, Select, styled, Toolbar, Typography } from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { drawerWidth } from '@/pages/Editor'

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
  handleDrawerOpen?: () => void
  handleSaveGraph?: () => void
  handleClickChangeSocketUrl?: () => void
  handleDownloadGraph?: () => void
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
  const [worflow, setWorkflow] = useState<string[]>([])

  useEffect(() => {
    setWorkflow([location.pathname])
  }, [location])
  return (
    <AppBarStyled position="fixed" open={props.open}>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }} component="div">
          Task Editor
        </Typography>
        <Select value={worflow[0]} sx={{ minWidth: 200 }}>
          {Object.entries(worflow).map(([key, value]) => (
            <MenuItem key={key} value={key}>
              {value}
            </MenuItem>
          ))}
        </Select>
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
