import { LGraph, LGraphNode, LiteGraph, sendWs } from '@haski/lib'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import { WebSocket } from 'ws'

import { log, prisma } from './server'

/**
 * Sends a graph from a given path to a WebSocket.
 *
 * @param ws - The WebSocket to send the graph to.
 * @param request - The IncomingMessage object representing the request.
 * @returns The LiteGraph instance representing the graph.
 */
export async function sendGraphFromPath(ws: WebSocket, request: IncomingMessage) {
  log.debug('Sending graph from path')
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
    node.setWebSocket?.(ws) // register websocket if node uses it
    const onExecute = node.onExecute
    // eslint-disable-next-line immutable/no-mutation
    node.onExecute = async function () {
      log.trace(`Executing node: ${node.title}`)
      // tell client that we are executing this node
      sendWs(ws, { eventName: 'nodeExecuting', payload: node.id })

      //! Set node properties
      // await new Promise((resolve) => setTimeout(resolve, 200))
      await onExecute?.call(node)

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
    return testGraph(lgraph, ws)
  }
}

// TODO: Remove this function
function testGraph(lgraph: LGraph, ws: WebSocket) {
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
