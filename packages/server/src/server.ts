/* eslint-disable immutable/no-mutation */
import {
  AnswerInputNode,
  ClientBenchmarkPostPayload,
  ClientEventPayload,
  handleWsRequest,
  LiteGraph,
  OutputNode,
  QuestionNode,
  ServerBenchmarkPostPayload,
  WebSocketEvent
} from '@haski/lib'
import { createServer } from 'http'
import { ILogObj, Logger } from 'tslog'
import { parse } from 'url'
import { WebSocket, WebSocketServer } from 'ws'

import prisma from '../client'
import { runLgraph, setupGraphFromPath } from './Graph'
import { runGraph, saveGraph } from './WebsocketOperations'

// Init
export const log: Logger<ILogObj> = new Logger()
export const server = createServer()
export const wss1 = new WebSocketServer({ noServer: true })
const wss2 = new WebSocketServer({ noServer: true })

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

  // ...
  const timeItEnd = Date.now()
  log.info('Time it took to setup graph: ', timeItEnd - timeItStart)
})
// TODO: For later use
wss2.on('connection', function connection(ws) {
  ws.on('error', console.error)

  // ...
})
/**
 * Handle get, post, put, delete requests
 */
server.on('request', async (request, response) => {
  const { pathname } = parse(request.url ?? '', true)
  // Announce that we are going to handle this request
  log.trace('Handling request for ', pathname)
  if (request.method === 'GET') {
    if (pathname === '/editor/ke.haski.app/2/2') {
      response.writeHead(404)
      response.end()
    } else if (pathname === '/bar') {
      response.writeHead(404)
      response.end()
    }
  } else if (request.method === 'POST') {
    if (pathname === '/editor/ke.haski.app/2/2') {
      response.writeHead(404)
      response.end()
    } else if (pathname === '/bar') {
      response.writeHead(404)
      response.end()
    } else if (pathname === '/v1/benchmark') {
      //! TODO: clean up
      // load graph from db based on post request
      const body: Uint8Array[] = []
      request.on('data', (chunk) => {
        body.push(chunk)
      })
      request.on('end', async () => {
        const parsedBody: ClientBenchmarkPostPayload = JSON.parse(
          Buffer.concat(body).toString()
        )
        log.debug('Benchmark post request: ', parsedBody)
        const graph = await prisma.graph.findFirst({
          where: {
            path: parsedBody.path
          }
        })
        if (!graph) {
          response.writeHead(404)
          response.end()
          return
        }
        const lgraph = new LiteGraph.LGraph()
        lgraph.configure(JSON.parse(graph.graph))
        // Fill in the answer and question
        lgraph.findNodesByClass(AnswerInputNode).forEach((node) => {
          node.properties.value = parsedBody.data.answer
        })
        lgraph.findNodesByClass(QuestionNode).forEach((node) => {
          node.properties.value = parsedBody.data.question
        })
        // Run the graph
        runLgraph(lgraph).then(() => {
          const output: ServerBenchmarkPostPayload = lgraph
            .findNodesByClass(OutputNode)
            .map((node) => {
              return node.properties.value
            })
          log.debug('Benchmark post response: ', output)
          response.writeHead(200, { 'Content-Type': 'application/json' })
          response.write(JSON.stringify(output))
          response.end()
        })
      })
    }
  } else {
    response.writeHead(404)
    response.end()
  }
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
  } else if (pathname === '/v1/chat/completions') {
    // send mock model response
    socket.write(
      JSON.stringify({
        id: 'mock',
        model: 'mock',
        created: new Date().toISOString(),
        choices: [
          {
            text: 'mock',
            index: 0,
            logprobs: null,
            finish_reason: 'length'
          }
        ]
      })
    )
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
