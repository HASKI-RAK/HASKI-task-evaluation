/* eslint-disable immutable/no-let */
// FILEPATH: /c:/Development/HASKI-task-evaluation/packages/server/tests/Graph.test.ts

import { IncomingMessage } from 'http'
import { WebSocket } from 'ws'

import prisma from '../client'
import { runLgraph, setupGraphFromPath } from '../src/Graph'
import * as demoGraphJson from '../src/utils/demoGraph.json'

jest.mock('ws')
jest.mock('../src/utils/prismaOperations')

describe('Graph', () => {
  let ws: WebSocket
  let request: IncomingMessage
  const send = jest.fn()

  beforeEach(() => {
    ws = new WebSocket('ws://localhost:8080')
    jest.spyOn(ws, 'send').mockImplementation(send)
    request = new IncomingMessage({} as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('setupGraphFromPath', () => {
    it('should load graph from DB if exists', async () => {
      const mockGraph = {
        id: 1,
        path: '/path/to/graph',
        graph: JSON.stringify(demoGraphJson)
      }
      jest.spyOn(prisma.graph, 'findFirst').mockResolvedValue(mockGraph)

      await setupGraphFromPath(ws, request)

      expect(prisma.graph.findFirst).toHaveBeenCalled()
      expect(send).toHaveBeenCalledWith({
        eventName: 'graphFinished',
        payload: demoGraphJson
      })
    })

    it('should load test graph if DB graph does not exist', async () => {
      jest.spyOn(prisma.graph, 'findFirst').mockResolvedValue(null)

      await setupGraphFromPath(ws, request)

      expect(prisma.graph.findFirst).toHaveBeenCalled()
      expect(send).toHaveBeenCalledWith({
        eventName: 'graphFinished',
        payload: demoGraphJson
      })
    })
  })

  describe('runLgraph', () => {
    it('should run all nodes in the graph', async () => {
      const mockNode = { onExecute: jest.fn() }
      const mockGraph = { computeExecutionOrder: jest.fn().mockReturnValue([mockNode]) }

      await runLgraph(mockGraph as any)

      expect(mockNode.onExecute).toHaveBeenCalled()
    })
  })
})
