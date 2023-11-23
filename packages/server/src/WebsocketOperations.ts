/* eslint-disable immutable/no-mutation */
import {
  AnswerInputNode,
  ClientEventPayload,
  LGraph,
  sendWs,
  SerializedGraph
} from '@haski/lib'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import { WebSocket } from 'ws'

import { runLgraph } from './Graph'
import { log, prisma } from './server'
import { prismaGraphCreateOrUpdate } from './utils/prismaOperations'

export function runGraph(
  payload: ClientEventPayload['runGraph'],
  ws: WebSocket,
  lgraph: LGraph
): void {
  log.debug('event: runGraph')
  lgraph.configure(payload.graph)
  // set answer for nodes
  lgraph.findNodesByClass<AnswerInputNode>(AnswerInputNode).forEach((node) => {
    node.properties.value = payload.answer
  })
  // RUN GRAPH ITERATION
  runLgraph(lgraph).then(() => {
    log.debug('Finished running graph')
    sendWs(ws, {
      eventName: 'graphFinished',
      payload: lgraph.serialize<SerializedGraph>()
    })
  })
}

export function saveGraph(
  payload: ClientEventPayload['saveGraph'],
  lgraph: LGraph,
  request: IncomingMessage,
  ws: WebSocket
): void {
  log.debug('event: saveGraph')
  lgraph.configure(payload)
  const { pathname } = parse(request.url ?? '', true)
  prismaGraphCreateOrUpdate(prisma, pathname, lgraph)
  sendWs(ws, {
    eventName: 'graphSaved',
    payload: lgraph.serialize<SerializedGraph>()
  })
}
