/* eslint-disable simple-import-sort/imports */
import prisma from '../client'
import {
  handleToolRegistration,
  isOpenIdConfigJson,
  isPayloadLtiLaunchValid,
  isSuccessfulToolRegistrationResponse,
  LtiLaunchRequest,
  ToolRegistrationRequest
} from '@haski/lti'
import { IncomingMessage, ServerResponse } from 'http'
import { log } from '../server'

export const handleLtiToolRegistration = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>
) => handleToolRegistration(request, response, savePlatformCallback)

const savePlatformCallback = async (
  toolRegistrationResponse: unknown,
  openIdConfigJson: unknown
) => {
  if (!isSuccessfulToolRegistrationResponse(toolRegistrationResponse)) {
    throw new Error('Invalid body parameter')
  }
  if (!isOpenIdConfigJson(openIdConfigJson)) {
    throw new Error('Invalid openIdConfigJson parameter')
  }
  await prisma.ltiPlatform
    .create({
      data: {
        clientId: toolRegistrationResponse.client_id,
        clientRegistration: {
          create: {
            clientId: toolRegistrationResponse.client_id,
            responseTypes: toolRegistrationResponse.response_types,
            jwksUri: toolRegistrationResponse.jwks_uri,
            initiateLoginUri: toolRegistrationResponse.initiate_login_uri,
            grantTypes: toolRegistrationResponse.grant_types,
            redirectUris: toolRegistrationResponse.redirect_uris,
            applicationType: toolRegistrationResponse.application_type,
            tokenEndpointAuthMethod: toolRegistrationResponse.token_endpoint_auth_method,
            clientName: toolRegistrationResponse.client_name,
            logoUri: toolRegistrationResponse.logo_uri,
            scope: toolRegistrationResponse.scope,
            ltiToolConfiguration: JSON.stringify(
              toolRegistrationResponse[
                'https://purl.imsglobal.org/spec/lti-tool-configuration'
              ]
            )
          }
        },
        issuer: openIdConfigJson.issuer,
        jwksUri: toolRegistrationResponse.jwks_uri,
        authorizationEndpoint: openIdConfigJson.authorization_endpoint,
        registrationEndpoint: openIdConfigJson.registration_endpoint,
        scopesSupported: toolRegistrationResponse.scopes_supported,
        responseTypesSupported: toolRegistrationResponse.response_types_supported,
        subjectTypesSupported: toolRegistrationResponse.subject_types_supported,
        idTokenSigningAlgValuesSupported:
          toolRegistrationResponse.id_token_signing_alg_values_supported,
        claimsSupported: toolRegistrationResponse.claims_supported,
        productFamilyCode:
          openIdConfigJson['https://purl.imsglobal.org/spec/lti-platform-configuration']
            .product_family_code,
        version:
          openIdConfigJson['https://purl.imsglobal.org/spec/lti-platform-configuration']
            .version,
        variables:
          openIdConfigJson['https://purl.imsglobal.org/spec/lti-platform-configuration']
            .variables
      }
    })
    .then((platform) => {
      log.info('Platform created: ', platform)
    })
    .catch((e) => {
      log.error(e)
    })
}

export const extractLtiLaunchRequest = (
  params: URLSearchParams
): LtiLaunchRequest | null => {
  const iss = params.get('iss')
  const target_link_uri = params.get('target_link_uri')
  const login_hint = params.get('login_hint')
  const lti_message_hint = params.get('lti_message_hint')
  const client_id = params.get('client_id')
  const lti_deployment_id = params.get('lti_deployment_id')

  if (
    iss &&
    target_link_uri &&
    login_hint &&
    lti_message_hint &&
    client_id &&
    lti_deployment_id
  ) {
    const payload = {
      iss,
      target_link_uri,
      login_hint,
      lti_message_hint,
      client_id,
      lti_deployment_id
    }

    if (isPayloadLtiLaunchValid(payload)) {
      return payload
    }
  }

  return null
}

export type { ToolRegistrationRequest }
