/* eslint-disable immutable/no-mutation */
import {
  AnswerInputNode,
  ClientBenchmarkPostPayload,
  LiteGraph,
  OutputNode,
  QuestionNode,
  ServerBenchmarkPostPayload
} from '@haski/lib'
import { SampleSolutionNode } from '@haski/lib/nodes/SampleSolutionNode'

import prisma from '../client'
import { addOnNodeAdded, runLgraph } from './Graph'
import { log } from './server'
import { RestHandlerMap } from './utils/rest'

// Define your REST handlers
export const handlers: RestHandlerMap<ClientBenchmarkPostPayload | undefined> = {
  POST: {
    '/v1/benchmark': async (_, response, payload) => {
      if (!payload) {
        response.writeHead(400)
        response.end('Bad Request')
        return
      }
      const benchmarkPayload = payload
      const { path, data } = benchmarkPayload

      const graph = await prisma.graph.findFirst({
        where: {
          path
        }
      })

      if (!graph) {
        response.writeHead(404)
        response.end()
        return
      }

      const lgraph = new LiteGraph.LGraph()
      addOnNodeAdded(lgraph, undefined, true)
      lgraph.configure(JSON.parse(graph.graph))

      // Fill in the answer and question
      lgraph.findNodesByClass(AnswerInputNode).forEach((node) => {
        node.properties.value = data.answer
      })
      lgraph.findNodesByClass(QuestionNode).forEach((node) => {
        node.properties.value = data.question
      })
      lgraph.findNodesByClass(SampleSolutionNode).forEach((node) => {
        node.properties.value = data.realAnswer
      })

      // Run the graph
      runLgraph(lgraph).then(() => {
        const output: ServerBenchmarkPostPayload = lgraph
          .findNodesByClass(OutputNode)
          .map((node) => {
            return node.properties.value
          })
        log.debug('Benchmark post response: ', output)
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.write(JSON.stringify(output))
        response.end()
      })
    }
  }
}
