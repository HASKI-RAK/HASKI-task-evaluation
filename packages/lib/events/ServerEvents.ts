import {
  serializedLGraph,
  SerializedLGraphGroup,
  SerializedLGraphNode
} from 'litegraph.js'

import { LGraphNode } from '../nodes/litegraph-extensions'

export type SerializedGraph = serializedLGraph<
  SerializedLGraphNode<LGraphNode>,
  [number, number, number, number, number, string],
  SerializedLGraphGroup
>

// type that matches ServerEventName with payload
export type ServerEventPayload = {
  graphFinished: SerializedGraph // graph
  nodeExecuting: number // node id
  nodeExecuted: number // node id
  graphSaved: SerializedGraph // graph
  feedback: string // string from the feedback node
  successPercentage: number // can be used for cosine similarity and is indicated by a progress bar in the frontend. used by successPercentageNode
  nodeError: {
    nodeId: number
    error: string
  }
}

export type ClientEventPayload = {
  saveGraph: SerializedGraph
  runGraph: {
    answer: string
    graph: SerializedGraph
  }
}

export type ServerEvent<K extends keyof ServerEventPayload, P = ServerEventPayload[K]> = {
  eventName: K
  payload: P
}

export type ClientEvent<K extends keyof ClientEventPayload, P = ClientEventPayload[K]> = {
  eventName: K
  payload: P
}

export type WebSocketEvent<E extends ServerEventPayload | ClientEventPayload> = {
  eventName: keyof E
  payload: E[keyof E]
}
// // test
// const event: ServerEvent<'server:ready'> = {
//   eventName: 'server:ready',
//   payload:
// }
