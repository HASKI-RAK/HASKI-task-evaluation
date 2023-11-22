import {
  createTheme,
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  useMediaQuery
} from '@mui/material'
import { createContext, useMemo, useState } from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from 'react-router-dom'

import ErrorBoundary from '@/components/ErrorBoundary'
import { Editor } from '@/pages/Editor'

const ColorModeContext = createContext({ toggleColorMode: () => {} })

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Editor />}>
      {/* /ke.moodle/2/2 */}
      <Route path="/editor/:domain/:courseId/:elementId" element={<Editor />} />
      {/* <Route path="dashboard" element={<Dashboard />} /> */}
      {/* ... etc. */}
    </Route>
  )
)
export const BasicApp = () => {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export const App = () => {
  const [mode, setMode] = useState<'light' | 'dark' | null>(null)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
      }
    }),
    []
  )

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark'
        }
      }),
    [mode, prefersDarkMode]
  )

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            '.lgraphcanvas': {
              color: '#121212'
            }
          }}
        />
        <BasicApp />
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
