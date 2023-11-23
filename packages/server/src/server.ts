/* eslint-disable immutable/no-mutation */
import { ClientEventPayload, handleWsRequest, WebSocketEvent } from '@haski/lib'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'
import { ILogObj, Logger } from 'tslog'
import { parse } from 'url'
import { WebSocket, WebSocketServer } from 'ws'

import { setupGraphFromPath } from './Graph'
import { runGraph, saveGraph } from './WebsocketOperations'

// Init
export const log: Logger<ILogObj> = new Logger()
const server = createServer()
export const wss1 = new WebSocketServer({ noServer: true })
const wss2 = new WebSocketServer({ noServer: true })
// Database
export const prisma = new PrismaClient()

/**
 * * Handle websocket when on valid path
 */
wss1.on('connection', async function connection(ws: WebSocket, request) {
  ws.on('error', console.error) // TODO: Expand error handling
  const lgraph = await setupGraphFromPath(ws, request)

  // ! Register custom events
  log.debug('Registering custom events')
  ws.on('message', function (message) {
    const parsed: WebSocketEvent<ClientEventPayload> = JSON.parse(message.toString())
    handleWsRequest<ClientEventPayload>(parsed, {
      runGraph: (payload) => runGraph(payload, ws, lgraph),
      saveGraph: (payload) => saveGraph(payload, lgraph, request, ws)
    })
  })

  // ...
})
// TODO: For later use
wss2.on('connection', function connection(ws) {
  ws.on('error', console.error)

  // ...
})
/**
 ** Handle initial websocket connection on http server
 */
server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url ?? '', true)
  // Announce that we are going to handle this request
  log.trace('Handling request for ', pathname)

  if (pathname === '/ws/editor/ke.haski.app/2/2') {
    //TODO: check path
    wss1.handleUpgrade(request, socket, head, function done(ws) {
      wss1.emit('connection', ws, request)
    })
  } else if (pathname === '/bar') {
    wss2.handleUpgrade(request, socket, head, function done(ws) {
      wss2.emit('connection', ws, request)
    })
  } else {
    socket.destroy()
    log.warn('Invalid path')
  }
})

/**
 * ! Entry point
 * @async
 */
const main = async () => {
  log.info('Server listening on port: ', process.env.PORT ?? 5000)
  server.listen(process.env.PORT ?? 5000)
}

main().catch(async (e) => {
  log.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
