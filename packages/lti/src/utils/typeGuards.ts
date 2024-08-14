import {
  LtiLaunchRequest,
  OpenIdConfigJson,
  SuccessfulToolRegistrationResponse,
  ToolRegistrationRequest
} from '@haski/lti'
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

export const isPayloadLtiLaunchValid = (
  payload: unknown
): payload is LtiLaunchRequest => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'iss' in payload &&
    'target_link_uri' in payload &&
    'login_hint' in payload &&
    'lti_message_hint' in payload &&
    'client_id' in payload &&
    'lti_deployment_id' in payload
  )
}

export function isSuccessfulToolRegistrationResponse(
  payload: unknown
): payload is SuccessfulToolRegistrationResponse {
  if (typeof payload !== 'object' || payload === null) return false
  const requiredFields = [
    'client_id',
    'response_types',
    'jwks_uri',
    'initiate_login_uri',
    'grant_types',
    'redirect_uris',
    'application_type',
    'token_endpoint_auth_method',
    'client_name',
    'https://purl.imsglobal.org/spec/lti-tool-configuration'
  ]
  return requiredFields.every((field) => field in payload)
}
export function isOpenIdConfigJson(payload: unknown): payload is OpenIdConfigJson {
  if (typeof payload !== 'object' || payload === null) return false
  const requiredFields = [
    'issuer',
    'https://purl.imsglobal.org/spec/lti-platform-configuration'
  ]
  return requiredFields.every((field) => field in payload)
}
