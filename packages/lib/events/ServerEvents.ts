import {
  LGraphNode,
  serializedLGraph,
  SerializedLGraphGroup,
  SerializedLGraphNode
} from 'litegraph.js'

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
}

export type ServerEvent<K extends keyof ServerEventPayload, P = ServerEventPayload[K]> = {
  eventName: K
  payload: P
}

// // test
// const event: ServerEvent<'server:ready'> = {
//   eventName: 'server:ready',
//   payload:
// }
