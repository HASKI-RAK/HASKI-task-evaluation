/* eslint-disable immutable/no-mutation */
import { ClientEventPayload, handleWsRequest, WebSocketEvent } from '@haski/lib'
import { createServer } from 'http'
import { ILogObj, Logger } from 'tslog'
import { parse } from 'url'
import { WebSocket, WebSocketServer } from 'ws'

import prisma from '../client'
import { setupGraphFromPath } from './Graph'
import { handlers } from './handlers'
import { handleRestRequest, HttpMethod, RestRequest } from './utils/rest'
import { runGraph, saveGraph } from './WebsocketOperations'

// Init
export const log: Logger<ILogObj> = new Logger()
export const server = createServer()
export const wss1 = new WebSocketServer({ noServer: true })

/**
 * * Handle websocket when on valid path
 */
wss1.on('connection', async function connection(ws: WebSocket, request) {
  const timeItStart = Date.now()
  ws.on('error', console.error) // TODO: Expand error handling
  const lgraph = await setupGraphFromPath(ws, request.url ?? '')

  // ! Register custom events
  log.debug('Registering custom events')
  ws.on('message', async function (message) {
    const timeItStartMessage = Date.now()
    const parsed: WebSocketEvent<ClientEventPayload> = JSON.parse(message.toString())
    handleWsRequest<ClientEventPayload>(parsed, {
      runGraph: (payload) => runGraph(payload, ws, lgraph),
      saveGraph: async (payload) => saveGraph(payload, lgraph, request, ws)
    })
      .then((handled) => {
        if (!handled) {
          log.warn('Unhandled event: ', parsed.eventName)
        }
      })
      .finally(() => {
        const timeItEndMessage = Date.now()
        log.info(
          'Time it took to handle message: ',
          timeItEndMessage - timeItStartMessage
        )
      })
  })
  const timeItEnd = Date.now()
  log.info('Time it took to setup graph: ', timeItEnd - timeItStart)
})

/**
 ** Handle get, post, put, delete requests
 */
server.on('request', (request, response) => {
  const { pathname } = parse(request.url ?? '', true)
  const method = request.method as HttpMethod
  const route = pathname ?? '/'

  if (request.method === 'POST' || request.method === 'PUT') {
    // Parse the request body as needed
    // For example, if the payload is JSON:
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
  } else {
    const restRequest: RestRequest<undefined> = {
      method,
      route
    }
    handleRestRequest(request, response, restRequest, handlers)
  }
})
/**
 ** Handle initial websocket connection on http server
 */
server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url ?? '', true)
  // Announce that we are going to handle this request
  log.trace('Handling request for ', pathname)

  wss1.handleUpgrade(request, socket, head, function done(ws) {
    wss1.emit('connection', ws, request)
  })
})

/**
 * ! Entry point
 * @async
 */
const main = async () => {
  log.info('Server listening on port: ', process.env.PORT ?? 5000)
  if (process.env.NODE_ENV !== 'test') {
    // https://stackoverflow.com/questions/60803230/node-eaddrinuse-address-already-in-use-3000-when-testing-with-jest-and-super
    server.listen(process.env.PORT ?? 5000)
  }
}

main().catch(async (e) => {
  log.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
