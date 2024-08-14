/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-let */
// FILEPATH: /c:/Development/HASKI-task-evaluation/packages/server/tests/WebsocketOperations.test.ts

import { AnswerInputNode, ClientEventPayload, LGraph } from '@haski/ta-lib'
import { IncomingMessage } from 'http'
import { WebSocket } from 'ws'

import { server } from '@/server'

import * as demoGraphJson from '../src/utils/demoGraph.json'
import { runGraph, saveGraph } from '../src/WebsocketOperations'

jest.mock('ws')
jest.mock('../src/utils/prismaOperations')

describe('runGraph', () => {
  let payload: ClientEventPayload['runGraph']
  let ws: WebSocket
  let lgraph: LGraph
  const request: IncomingMessage = new IncomingMessage({} as any)
  let node: AnswerInputNode
  const send = jest.fn()
  const configure = jest.fn()
  const serialize = jest.fn()

  beforeEach(() => {
    payload = {
      graph: {
        last_node_id: 0,
        last_link_id: 0,
        nodes: [],
        links: [],
        groups: [],
        config: {},
        version: 0
      },
      answer: 'test answer'
    }
    node = new AnswerInputNode()
    lgraph = new LGraph()
    ws = new WebSocket('ws://anotherfakedomain.org:8080')
    jest.spyOn(ws, 'send').mockImplementation(send)

    jest.spyOn(lgraph, 'findNodesByClass').mockReturnValue([node])
    jest.spyOn(lgraph, 'serialize').mockImplementation(serialize)
  })

  afterAll(() => {
    jest.restoreAllMocks()
    server.close()
  })

  it('should configure the graph', async () => {
    jest.spyOn(lgraph, 'configure').mockImplementation(configure)
    runGraph(payload, ws, lgraph)
    expect(lgraph.configure).toHaveBeenCalledWith(payload.graph)
  })

  it('should set answer for nodes', async () => {
    runGraph(payload, ws, lgraph)
    expect(node.properties.value).toBe(payload.answer)
  })

  it('should send a WebSocket message when the graph finishes running', async () => {
    runGraph(payload, ws, lgraph)
    expect(send).toHaveBeenCalled()
  })

  it('should configure the graph', async () => {
    lgraph.configure(demoGraphJson)
    await saveGraph(lgraph.serialize(), lgraph, request, ws)
    expect(send).toHaveBeenCalled()
  })

  it('should call prismaGraphCreateOrUpdate with the correct arguments', () => {
    // Mock the prismaGraphCreateOrUpdate function and assert that it is called with the correct arguments
  })

  it('should send a WebSocket message with the serialized graph', () => {
    // Mock the sendWs function and assert that it is called with the correct arguments
  })
})
