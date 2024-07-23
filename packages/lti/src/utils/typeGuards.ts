import { ToolRegistrationRequest } from '@haski/lti'
export const isPayloadToolRegistrationValid = (
  payload: unknown
): payload is ToolRegistrationRequest => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'client_id' in payload &&
    'initiate_login_uri' in payload &&
    'redirect_uris' in payload &&
    'jwks_uri' in payload
  )
}
