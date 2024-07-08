/* eslint-disable immutable/no-mutation */
import {
  AnswerInputNode,
  ClientEventPayload,
  LGraph,
  sendWs,
  SerializedGraph
} from '@haski/ta-lib'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import { WebSocket } from 'ws'

import prisma from '../client'
import { runLgraph, sendQuestion } from './Graph'
import { log } from './server'
import { prismaGraphCreateOrUpdate } from './utils/prismaOperations'

export function runGraph(
  payload: ClientEventPayload['runGraph'],
  ws: WebSocket,
  lgraph: LGraph
): void {
  log.debug('event: runGraph')
  const timeItStart = Date.now()
  lgraph.configure(payload.graph)
  // set answer for nodes
  lgraph.findNodesByClass<AnswerInputNode>(AnswerInputNode).forEach((node) => {
    node.properties.value = payload.answer
  })
  // RUN GRAPH ITERATION
  runLgraph(lgraph, (percentage) => {
    // only send every 10%
    sendWs(ws, {
      eventName: 'processingPercentageUpdate',
      payload: Number(percentage.toFixed(2)) * 100
    })
  }).then(() => {
    log.debug('Finished running graph')
    sendWs(ws, {
      eventName: 'graphFinished',
      payload: lgraph.serialize<SerializedGraph>()
    })
  })
  const timeItEnd = Date.now()
  log.info('Time it took to run graph: ', timeItEnd - timeItStart)
}

export async function saveGraph(
  payload: ClientEventPayload['saveGraph'],
  lgraph: LGraph,
  request: IncomingMessage,
  ws: WebSocket
): Promise<void> {
  log.debug('event: saveGraph')
  lgraph.configure(payload.graph)
  const name = payload.name ?? parse(request.url ?? '', true).pathname
  await prismaGraphCreateOrUpdate(prisma, name, lgraph)
  sendWs(ws, {
    eventName: 'graphSaved',
    payload: lgraph.serialize<SerializedGraph>()
  })
  sendQuestion(lgraph, ws)
}
