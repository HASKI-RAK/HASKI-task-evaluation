/* eslint-disable immutable/no-mutation */
import { LiteGraph, SerializedGraph } from '@haski/lib'
import { PrismaClient } from '@prisma/client'
import { createServer, IncomingMessage } from 'http'
import { LGraph, LGraphNode } from 'litegraph.js'
import { ILogObj, Logger } from 'tslog'
import { parse } from 'url'
import { WebSocket, WebSocketServer } from 'ws'

import { registerCustomEvents, sendWs } from '@/utils/websocket'

import { prismaGraphCreateOrUpdate } from './utils/prismaOperations'

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
  const lgraph = await sendGraphFromPath(ws, request)

  log.debug('Registering custom events')
  registerCustomEvents(ws)

  // Here we can register custom events that re sent by the client
  ws.on('runGraph', function (message) {
    log.debug('event: runGraph')
    lgraph.configure(JSON.parse(message.toString()))
    const { pathname } = parse(request.url ?? '', true)
    prismaGraphCreateOrUpdate(prisma, pathname, lgraph)

    // ! RUN GRAPH ITERATION
    runLgraph(lgraph).then(() => {
      log.debug('Finished running graph')
      sendWs(ws, {
        eventName: 'graphFinished',
        payload: lgraph.serialize<SerializedGraph>()
      })
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

export async function sendGraphFromPath(ws: WebSocket, request: IncomingMessage) {
  const { pathname } = parse(request.url ?? '', true)
  // TODO: get graph from path
  const lgraph = new LiteGraph.LGraph()
  const loaded_graph = await prisma.graph.findFirst({
    where: {
      path: pathname ?? ''
    }
  })

  // This is persisted even trough network serialization
  // eslint-disable-next-line immutable/no-mutation
  lgraph.onNodeAdded = function (node: LGraphNode) {
    const onExecute = node.onExecute
    // eslint-disable-next-line immutable/no-mutation
    node.onExecute = async function () {
      log.trace(`Executing node: ${node.title}`)
      // tell client that we are executing this node
      sendWs(ws, { eventName: 'nodeExecuting', payload: node.id })
      //! await timer for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onExecute?.call(node)
      log.trace(`Executed node: ${node.title}`)
      sendWs(ws, { eventName: 'nodeExecuted', payload: node.id })
    }
  }
  if (loaded_graph) {
    lgraph.configure(JSON.parse(loaded_graph.graph))
    log.debug('Loaded graph from DB for route: ', pathname)
    sendWs(ws, { eventName: 'graphFinished', payload: lgraph.serialize() })
    return lgraph
  } else {
    // ? test graph
    const my_sum = LiteGraph.createNode('basic/sum', 'sum', { pos: [500, 600] })

    const node_const = LiteGraph.createNode('basic/const', 'const', { pos: [200, 200] })
    const node_out = LiteGraph.createNode('basic/watch', 'watch', { pos: [800, 200] })
    const node_out2 = LiteGraph.createNode('basic/watch', 'watch', { pos: [800, 400] })
    const node_text = LiteGraph.createNode('basic/textfield', 'textfield', {
      pos: [500, 400]
    })
    node_const.setValue(4.5)

    lgraph.add(node_const)
    lgraph.add(node_out)
    lgraph.add(my_sum)
    lgraph.add(node_text)
    lgraph.add(node_out2)

    node_const.connect(0, my_sum, 0)
    node_const.connect(0, my_sum, 1)
    my_sum.connect(0, node_out, 0)

    node_text.connect(0, node_out2, 0)
    sendWs(ws, { eventName: 'graphFinished', payload: lgraph.serialize() })
    return lgraph
  }
}

/**
 * Run the graph in order
 * first compute the execution order
 * then run each node
 * @async
 * @param lgraph - graph to run
 */
export async function runLgraph(lgraph: LGraph, onlyOnExecute = false) {
  const execorder = lgraph.computeExecutionOrder(onlyOnExecute, true)
  for (const node of execorder) {
    await node.onExecute()
  }
}
