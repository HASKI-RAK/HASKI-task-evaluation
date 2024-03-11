import { LGraph, LGraphNode, LiteGraph, sendWs } from '@haski/lib'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import { WebSocket } from 'ws'

import prisma from '../client'
import { log } from './server'
import * as demoGraphJson from './utils/demoGraph.json'

/**
 * Sends a graph from a given path to a WebSocket.
 *
 * @param ws - The WebSocket to send the graph to.
 * @param request - The IncomingMessage object representing the request.
 * @returns The LiteGraph instance representing the graph.
 */
export async function setupGraphFromPath(ws: WebSocket, request: IncomingMessage) {
  log.debug('Setup graph from path')
  const { pathname } = parse(request.url ?? '', true)
  // TODO: get graph from path
  const lgraph = new LiteGraph.LGraph()
  log.debug('Loading graph from DB for route: ', pathname)
  const loaded_graph = await prisma.graph.findFirst({
    where: {
      path: pathname ?? ''
    }
  })

  // This is persisted even trough network serialization
  // eslint-disable-next-line immutable/no-mutation
  lgraph.onNodeAdded = function (node: LGraphNode) {
    node.setWebSocket?.(ws) // register websocket if node uses it
    node.setEnv?.(process.env)
    const onExecute = node.onExecute
    // eslint-disable-next-line immutable/no-mutation
    node.onExecute = async function () {
      log.trace(`Executing node: ${node.title}`)
      // tell client that we are executing this node
      sendWs(ws, { eventName: 'nodeExecuting', payload: node.id })

      //! Set node properties
      // await new Promise((resolve) => setTimeout(resolve, 200))
      // eslint-disable-next-line immutable/no-mutation
      node.color = LiteGraph.NODE_DEFAULT_COLOR
      await onExecute?.call(node).catch((error) => {
        log.error(error)
        // TODO set node color to red
        // eslint-disable-next-line immutable/no-mutation
        node.color = '#ff0000'
        sendWs(ws, {
          eventName: 'nodeError',
          payload: {
            nodeId: node.id,
            error:
              "Error while executing node: '" +
              node.title +
              "' with error: " +
              JSON.stringify(error.message)
          }
        })
      })

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
    const test = testGraph(lgraph, ws)
    test.clear()
    return test
    return testGraph(lgraph, ws)
  }
}

// TODO: Remove this function
function testGraph(lgraph: LGraph, ws: WebSocket) {
  lgraph.configure(demoGraphJson)
  sendWs(ws, { eventName: 'graphFinished', payload: lgraph.serialize() })
  return lgraph
}

/**
 * Run the graph in order
 * first compute the execution order
 * then run each node
 * @async
 * @param lgraph - graph to run
 */
export async function runLgraph(lgraph: LGraph, onlyOnExecute = false) {
  const execorder = lgraph.computeExecutionOrder<LGraphNode[]>(onlyOnExecute, true)
  for (const node of execorder) {
    try {
      await node.onExecute?.()
    } catch (error) {
      log.error(error)
      // TODO reset node green states
    }
  }
}
