import { Alert, AlertColor, Card } from '@mui/material'
import SnackbarMui from '@mui/material/Snackbar'
import { memo, SyntheticEvent, useEffect, useState } from 'react'

export function Snackbar(
  props: Readonly<{
    message: string
    open: boolean
    handleClose: (event: SyntheticEvent | Event, reason?: string) => void
    children?: React.ReactNode
    severity?: AlertColor
  }>
) {
  const [isOpen, setIsOpen] = useState(props.open)

  useEffect(() => {
    setIsOpen(props.open)
  }, [props.open])

  return (
    <SnackbarMui open={isOpen} autoHideDuration={6000} onClose={props.handleClose}>
      <Card sx={{ mb: 1 }}>
        <Alert
          elevation={6}
          variant="outlined"
          onClose={props.handleClose}
          severity={props.severity}
        >
          {props.message}
        </Alert>
      </Card>
    </SnackbarMui>
  )
}

export default memo(Snackbar)
