/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
import { WebSocket } from 'ws'

import { LGraphNode, LiteGraph } from './litegraph-extensions'
import { InOut } from './types/NodeLinkMessage'

/**
 * Cosine Similaritys
 */
export class CosineSimilarity extends LGraphNode {
  env: Record<string, unknown>
  constructor() {
    super()
    // https://platform.openai.com/docs/api-reference/chat/create

    this.addInput('string', 'string')
    this.addInput('string', 'string')

    this.addOut('number')
    this.properties = {
      value: -1
    }
    this.title = 'Cosine Similarity'
    this.env = {}
  }

  //name of the node
  static title = 'Cosine Similarity'
  static path = 'models/cosine-similarity'
  static getPath(): string {
    return CosineSimilarity.path
  }

  setWebSocket(_ws: WebSocket): void {
    this.ws = _ws
  }

  setEnv(_env: Record<string, unknown>): void {
    this.env = _env
  }

  //name of the function to call when executing
  async onExecute() {
    //get inputs
    const input = {
      sentence_one: this.getInputData(0),
      sentence_two: this.getInputData(1)
    }

    // TODO: sanity check input
    const required_input = JSON.stringify(input)
    console.log(required_input)
    // fetch from server
    console.log(this.env.SIMILARITY_WORKER_URL)
    const url =
      (this.env.SIMILARITY_WORKER_URL ?? 'http://localhost:8002') + '/cosine_similarity'
    console.log(url)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: required_input
    })
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    // get response
    const data = await response.json()

    //send output to the output
    this.setOutputData(0, data)
  }

  //register in the system
  static register() {
    LiteGraph.registerNodeType(CosineSimilarity.path, CosineSimilarity)
  }
}
