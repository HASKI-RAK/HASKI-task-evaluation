/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */

import { LGraphNode, LiteGraph } from './litegraph-extensions'

/**
 * * This node is used to limit the amount of characters a user can input
 * * It is used in the frontend to limit the amount of characters a user can input
 */
export class NumberNode extends LGraphNode {
  constructor() {
    super()
    this.properties.value = 0
    this.addWidget(
      'number',
      'value',
      this.properties.value ?? 0,
      (v) => {
        this.properties.value = v
      },
      {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
        step: 1,
        precision: 5
      }
    )
    this.addOut('number')
    this.serialize_widgets = true
    this.title = 'number'
  }

  // statics
  static title = 'number'

  static path = 'basic/number'

  static getPath(): string {
    return NumberNode.path
  }

  //name of the function to call when executing
  async onExecute() {
    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Hello, how can I help you today?'
        }
      ],
      max_tokens: 50,
      temperature: 0.5,
      top_p: 1,
      top_k: 40,
      presence_penalty: 0,
      repetition_penalty: 1,
      repetition_penalty_range: 1,
      guidance_scale: 0
    }
    const response = await fetch('http://193.174.195.36:8000' + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    if (!response.ok) {
      // console log the error
      console.log(response.statusText)
      // throw new Error('Network response was not ok')
    }
    this.setOutputData(0, this.properties.value)
  }

  getTitle(): string {
    if (this.flags.collapsed) {
      return this.properties.value.toString() ?? this.title
    }
    return this.title
  }

  //register in the system
  static register() {
    LiteGraph.registerNodeType(NumberNode.path, NumberNode)
  }
}
