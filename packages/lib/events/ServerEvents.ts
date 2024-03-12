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

export type OutputType = 'text' | 'score' | 'classifications'

// type that matches ServerEventName with payload
export type ServerEventPayload = {
  graphFinished: SerializedGraph // graph
  nodeExecuting: number // node id
  nodeExecuted: number // node id
  graphSaved: SerializedGraph // graph
  output: {
    uniqueId: string
    type: OutputType
    label: string
    value: string | number | string[]
  }
  //feedback: string // string from the feedback node
  //successPercentage: number // can be used for cosine similarity and is indicated by a progress bar in the frontend. used by successPercentageNode
  maxInputChars: number // used by maxInputCharsNode. Can be used to limit how many characters a user can input. Default is 300
  nodeError: {
    nodeId: number
    error: string
  }
}

export type ServerBenchmarkPostPayload = (string | number | string[])[]

export type ClientEventPayload = {
  saveGraph: SerializedGraph
  runGraph: {
    answer: string
    graph: SerializedGraph
  }
}

export type ClientBenchmarkPostPayload = {
  path: string
  data: {
    question: string
    realAnswer: string
    answer: string
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
