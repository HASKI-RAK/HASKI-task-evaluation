import {
  createTheme,
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  useMediaQuery
} from '@mui/material'
import { createContext, useEffect, useMemo, useState } from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  useSearchParams
} from 'react-router-dom'

import ErrorBoundary from '@/components/ErrorBoundary'
import Editor from '@/pages/Editor'

const ColorModeContext = createContext({ toggleColorMode: () => {} })
const LtiRegister = () => {
  const [searchParams] = useSearchParams()
  useEffect(() => {
    // check if searchparams has openid_configuration and registration_token
    // if so, send a request to the registration endpoint,
    // and then send a post message to the parent window
    if (
      searchParams.get('openid_configuration') &&
      searchParams.get('registration_token')
    ) {
      // send request to registration endpoint
      fetch(
        'http://localhost:5000/v1/lti/register?' + searchParams.toString(),

        {
          method: 'GET'
        }
      )
        // send post message to parent window
        // (window.opener || window.parent).postMessage({subject:'org.imsglobal.lti.close'}, '*');
        .then((response) => {
          if (!response.ok) {
            throw new Error('Could not register tool: ' + response.statusText)
          }
          return response.json()
        })
        .then((data) => {
          console.log(data)
        })
        .finally(() => {
          ;(window.opener || window.parent).postMessage(
            { subject: 'org.imsglobal.lti.close' },
            '*'
          )
        })
    }
  })

  return (
    <div>
      <h1>Please wait while we register your tool...</h1>
    </div>
  )
}
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* /ke.moodle/2/2 */}
      <Route
        path="ws/editor/:domain/:courseId/:elementId"
        element={
          <ErrorBoundary>
            <Editor />
          </ErrorBoundary>
        }
      />
      <Route path="lti/register" element={<LtiRegister />} />
      {/* ... etc. */}
      <Route path="*" element={<div>Not found</div>} />
      {/* <Route path="dashboard" element={<Dashboard />} /> */}
      {/* ... etc. */}
      <Route path="*" element={<div>Not found</div>} />
    </Route>
  )
)
export const BasicApp = () => {
  return <RouterProvider router={router} />
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
