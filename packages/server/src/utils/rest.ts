import { IncomingMessage, ServerResponse } from 'http'

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
