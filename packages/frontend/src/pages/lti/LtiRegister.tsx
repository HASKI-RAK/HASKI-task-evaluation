import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const LtiRegister = () => {
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
        import.meta.env.VITE_BACKEND_URL + '?' + searchParams.toString(),

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
