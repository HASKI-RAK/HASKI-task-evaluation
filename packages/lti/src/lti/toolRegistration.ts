// src/toolRegistration.ts

import { IncomingMessage, ServerResponse } from 'http'

export interface ToolRegistrationRequest {
  client_id: string
  initiate_login_uri: string
  redirect_uris: string[]
  jwks_uri: string
}

export interface ToolRegistrationResponse {
  registration_status: string
  client_id: string
  client_secret: string
}

// https://www.imsglobal.org/spec/lti-dr/v1p0#successful-registration
export interface SuccessfulToolRegistrationResponse {
  client_id: string
  response_types: string[]
  jwks_uri: string
  initiate_login_uri: string
  grant_types: string[]
  redirect_uris: string[]
  application_type: string
  token_endpoint_auth_method: string
  client_name: string
  logo_uri: string
  scope: string
  'https://purl.imsglobal.org/spec/lti-tool-configuration': LtiToolConfiguration
  scopes_supported: string[]
  response_types_supported: string[]
  subject_types_supported: string[]
  id_token_signing_alg_values_supported: string[]
  claims_supported: string[]
}

// sub-interface of LtiToolConfiguration
interface LtiToolConfiguration {
  version: string
  deployment_id: string
  target_link_uri: string
  domain: string
  description: string
  claims: string[]
}

export interface OpenIdConfigJson {
  issuer: string
  authorization_endpoint: string
  registration_endpoint: string
  'https://purl.imsglobal.org/spec/lti-platform-configuration': {
    product_family_code: string
    version: string
    variables: string[]
  }
}

export interface LtiLaunchRequest {
  iss: string
  target_link_uri: string
  login_hint: string
  lti_message_hint: string
  client_id: string
  lti_deployment_id: string
}

// Dummy storage for registered tools

export async function handleToolRegistration(
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
  savePlatformCallback: (
    toolRegistrationData: SuccessfulToolRegistrationResponse,
    openIdConfigJson: unknown
  ) => Promise<void>
) {
  try {
    const params = new URLSearchParams(request.url?.split('?')[1])
    const openid_configuration = params.get('openid_configuration') // https://www.imsglobal.org/spec/lti-dr/v1p0#openid-configuration
    const registration_token = params.get('registration_token')
    // visit with get request openID configuration endpoint to retreieve registration endpoint:
    const { registrationResponse, openIdConfigJson } = await getRegistrationEndpoint(
      openid_configuration,
      registration_token
    )
    const toolRegistrationResponseBody: SuccessfulToolRegistrationResponse =
      await registrationResponse.json()
    // write platform registration to database
    savePlatformCallback(toolRegistrationResponseBody, openIdConfigJson).then(() => {
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
      response.end(JSON.stringify(toolRegistrationResponseBody))
    })
  } catch (error) {
    response.writeHead(400, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })
    response.end('Invalid Tool Registration Request')
  }
}

const getRegistrationEndpoint = async (
  openid_configuration: string | null,
  registration_token: string | null
) => {
  // visit with get request openID configuration endpoint to retreieve registration endpoint:
  if (openid_configuration) {
    const registration_endpoint = await fetch(openid_configuration)
    const registration_endpoint_json = await registration_endpoint.json()
    const registration_endpoint_url = registration_endpoint_json.registration_endpoint
    // visit registration_endpoint with post request to register the tool
    const registration_response = await fetch(registration_endpoint_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${registration_token}`
      },
      body: JSON.stringify({
        application_type: 'web',
        grant_types: ['client_credentials', 'implicit'],
        response_types: ['id_token'],
        client_name: 'Task Assessment',
        'client_name#de': 'Aufgabenbewertung',
        redirect_uris: [
          'http://anotherfakedomain.org:5000',
          'http://anotherfakedomain.org:5173/ws/editor/lol/1/2'
        ], // testen ob das so geht oder auch ohne url am ende
        initiate_login_uri: 'http://anotherfakedomain.org:5000/v1/lti/login',
        jwks_uri: 'http://anotherfakedomain.org:5000/.well-known/jwks',
        token_endpoint_auth_method: 'private_key_jwt',
        scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/score',
        'https://purl.imsglobal.org/spec/lti-tool-configuration': {
          domain: 'http://anotherfakedomain.org:5000',
          description: 'Automated short answer assessment',
          target_link_uri: 'http://anotherfakedomain.org:5000/v1/lti/login',
          claims: ['iss', 'sub', 'name']
        }
      })
    })
    return {
      registrationResponse: registration_response,
      openIdConfigJson: registration_endpoint_json
    }
  } else {
    throw new Error('Invalid OpenID Configuration')
  }
}
