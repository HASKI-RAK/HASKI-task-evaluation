// src/toolRegistration.ts

import { randomBytes } from 'crypto'

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

// Dummy storage for registered tools
const registeredTools: { [key: string]: ToolRegistrationResponse } = {}

export const handleToolRegistration = (
  request: ToolRegistrationRequest,
  existingTools: { [key: string]: ToolRegistrationResponse } = registeredTools
): [ToolRegistrationResponse, { [key: string]: ToolRegistrationResponse }] => {
  const clientSecret = generateClientSecret()

  const registrationResponse: ToolRegistrationResponse = {
    registration_status: 'success',
    client_id: request.client_id,
    client_secret: clientSecret
  }

  const updatedTools = {
    ...existingTools,
    [request.client_id]: registrationResponse
  }

  return [registrationResponse, updatedTools]
}

const generateClientSecret = (): string => {
  // Generate a secure random string for the client secret
  return randomBytes(32).toString('hex')
}
