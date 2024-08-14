import { IncomingMessage, ServerResponse } from 'http'

import { extractLtiLaunchRequest } from '../handlers/handleLti'
import { handlers } from '../handlers/RequestHandlers'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type RestRequestHandler<T> = (
  request: IncomingMessage,
  response: ServerResponse,
  payload?: T
) => void | Promise<void>

export type RestHandlerMap<T> = {
  [K in HttpMethod]?: {
    [route: string]: RestRequestHandler<T>
  }
}

export type RestRequest<T> = {
  method: HttpMethod
  route: string
  payload?: T
}

export const handleRestRequest = <T>(
  request: IncomingMessage,
  response: ServerResponse,
  restRequest: RestRequest<T>,
  handlers: RestHandlerMap<T>
): void => {
  const { method, route, payload } = restRequest
  const methodHandlers = handlers[method]

  if (methodHandlers) {
    const handler = methodHandlers[route]
    if (handler) {
      handler(request, response, payload)
    } else {
      response.writeHead(404)
      response.end('Not Found')
    }
  } else {
    response.writeHead(405)
    response.end('Method Not Allowed')
  }
}
export function handleRestRequestWithPayload(
  request: IncomingMessage,
  method: HttpMethod,
  route: string,
  response: import('http').ServerResponse<import('http').IncomingMessage> & {
    req: import('http').IncomingMessage
  }
) {
  const requestBody: Buffer[] = []
  request.on('data', (chunk) => requestBody.push(chunk))
  request.on('end', () => {
    const payload = JSON.parse(Buffer.concat(requestBody).toString())
    const restRequest: RestRequest<typeof payload> = {
      method,
      route,
      payload
    }
    handleRestRequest(request, response, restRequest, handlers)
  })
}

export const handleRestRequestWithFormData = (
  request: IncomingMessage,
  method: HttpMethod,
  route: string,
  response: ServerResponse
) => {
  const requestBody: Buffer[] = []
  request.on('data', (chunk) => requestBody.push(chunk))
  request.on('end', () => {
    const payload = Buffer.concat(requestBody).toString()
    // parse form data
    const parsedPayload = new URLSearchParams(payload)
    const ltiLaunchRequest = extractLtiLaunchRequest(parsedPayload)
    if (!ltiLaunchRequest) {
      response.writeHead(400)
      response.end('Invalid LTI Launch Request at conversion')
      return
    }
    const restRequest: RestRequest<typeof ltiLaunchRequest> = {
      method,
      route,
      payload: ltiLaunchRequest
    }
    console.log('payload', payload)
    console.log('restRequest', restRequest)
    handleRestRequest(request, response, restRequest, handlers)
  })
}
