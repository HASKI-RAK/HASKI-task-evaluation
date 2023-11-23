/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
import { WebSocket } from 'ws'

import { LGraphNode, LiteGraph } from './litegraph-extensions'

export class LLMNode extends LGraphNode {
  constructor() {
    super()
    this.addInput('prompt', 'string')
    this.addInput('max_tokens', 'number')
    this.addInput('temperature', 'number')
    this.addInput('top_p', 'number')
    this.addInput('top_k', 'number')
    this.addInput('presence_penalty', 'number')
    this.addInput('repetition_penalty', 'number')
    this.addInput('repetition_penalty_range', 'number')
    this.addInput('guidance_scale', 'number')
    this.addInput('model_path', 'string')
    this.addOutput('string', 'string')
    this.properties = { value: '' }
    this.title = 'LLM'
  }

  //name of the node
  static title = 'LLM'
  static path = 'models/llm'
  static getPath(): string {
    return LLMNode.path
  }

  setWebSocket(_ws: WebSocket): void {
    this.ws = _ws
  }

  //name of the function to call when executing
  async onExecute() {
    //get inputs
    const prompt = this.getInputData<string>(0).toString()
    const max_tokens = this.getInputData<number>(1)
    const temperature = this.getInputData<number>(2)
    const top_p = this.getInputData<number>(3)
    const top_k = this.getInputData<number>(4)
    const presence_penalty = this.getInputData<number>(5)
    const repetition_penalty = this.getInputData<number>(6)
    const repetition_penalty_range = this.getInputData<number>(7)
    const guidance_scale = this.getInputData<number>(8)
    const model = this.getInputData<string>(9).toString()
    const input = {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful chatbot. You are helping a user with a problem.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens,
      temperature,
      top_p,
      top_k,
      presence_penalty,
      repetition_penalty,
      repetition_penalty_range,
      guidance_scale
    }

    // TODO: sanity check input
    const required_input = JSON.stringify(input)
    console.log(required_input)
    // fetch from server
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: required_input
    })
    console.log(response)

    // get response
    const data = await response.json()
    const choices = data.choices
    console.log(choices)
    //send output to the output
    this.setOutputData(0, choices[0].message.content)
    console.log(choices[0].message.content)
  }

  //register in the system
  static register() {
    LiteGraph.registerNodeType(LLMNode.path, LLMNode)
  }
}
