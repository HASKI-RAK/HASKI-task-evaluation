/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
import { WebSocket } from 'ws'

import { LGraphNode, LiteGraph } from './litegraph-extensions'
import { PromptMessageType } from './types/NodeLinkMessage'
import { OpenAiApiResponse, OpenAiModel } from './types/OpenAiApi'

// record with all models
// const models = [
//   {
//     name: 'zephir',
//     path: 'D:\\Development\\python\\text-generation-webui-main\\models\\zephir-7b-beta'
//   },
//   {
//     name: 'zephir-7b-beta',
//     path: 'D:\\Development\\python\\text-generation-webui-main\\models\\zephir-7b-beta'
//   },
//   {
//     name: 'SUS-Chat-34B',
//     path: 'SUS-Chat-34B'
//   }
// ]

/**
 * Language Model node
 */
export class LLMNode extends LGraphNode {
  env: Record<string, unknown>
  models: { [key: string]: string }

  constructor() {
    super()
    // https://platform.openai.com/docs/api-reference/chat/create
    this.models = {}
    // both inputs are optional. if message is not set, messages will be used
    this.addIn('message')
    // both inputs are optional
    this.addIn('*', 'messages')
    this.addWidget(
      'number',
      'max_tokens',
      this.properties.max_tokens ?? 64,
      (value: number) => {
        this.properties.max_tokens = value
      },
      { min: 0, max: 2048, step: 1, precision: 0 }
    )
    this.addWidget(
      'slider',
      'temperature',
      this.properties.temperature ?? 0.4,
      function (value, widget, node) {
        node.properties.temperature = value
      },
      { min: 0, max: 1, step: 0.01, precision: 2 }
    )
    this.addWidget(
      'slider',
      'top_p',
      this.properties.top_p ?? 1,
      function (value, widget, node) {
        node.properties.top_p = value
      },
      { min: 0, max: 1, step: 0.01, precision: 2 }
    )
    this.addWidget(
      'slider',
      'top_k',
      this.properties.top_k ?? 50,
      function (value, widget, node) {
        node.properties.top_k = value
      },
      { min: 1, max: 200, step: 1, precision: 0 }
    )
    this.addWidget(
      'slider',
      'presence_penalty',
      this.properties.presence_penalty ?? 0,
      function (value, widget, node) {
        node.properties.presence_penalty = value
      },
      { min: -2.0, max: 2.0, step: 0.1, precision: 1 }
    )
    this.addWidget(
      'slider',
      'repetition_penalty',
      this.properties.repetition_penalty ?? 0,
      function (value, widget, node) {
        node.properties.repetition_penalty = value
      },
      { min: -2.0, max: 2.0, step: 0.1, precision: 1 }
    )
    this.addWidget(
      'number',
      'repetition_penalty_range',
      this.properties.repetition_penalty_range ?? 512,
      (value, widget, node) => {
        node.properties.repetition_penalty_range = value
      },
      { min: 0, max: 2048, step: 1, precision: 0 }
    )
    this.addWidget(
      'slider',
      'guidance_scale',
      this.properties.guidance_scale ?? 1,
      (value, widget, node) => {
        node.properties.guidance_scale = value
      },
      { min: 0, max: 2, step: 0.1, precision: 1 }
    )
    this.addWidget(
      'combo',
      'model',
      this.properties.model ?? this.models[0],
      (value, widget, node) => {
        node.properties.model =
          this.models[Object.keys(this.models)[value]] ?? this.models[0]
      },
      {
        values: Object.keys(this.models)
      }
    )
    this.serialize_widgets = true
    this.addOut('string')
    this.properties = {
      value: '',
      model: '',
      temperature: 0.4,
      max_tokens: 64,
      top_p: 1,
      top_k: 1,
      presence_penalty: 0,
      repetition_penalty: 0,
      repetition_penalty_range: 512,
      guidance_scale: 1
    }
    this.title = 'LLM'
    this.env = {}
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

  init(_env: Record<string, unknown>): void {
    this.env = _env
    this.fetchModels(this.env.MODEL_WORKER_URL + '/v1/models').then((models) => {
      this.models = models
    })
  }

  async fetchModels(endpoint: string): Promise<{ [key: string]: string }> {
    try {
      // Fetch the data from the specified endpoint
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: OpenAiApiResponse = await response.json()

      // Ensure the data format is as expected
      if (data.object !== 'list' || !Array.isArray(data.data)) {
        throw new Error('Invalid data format')
      }

      // Process the data to create a key-value list
      const result = data.data.reduce(
        (acc: { [key: string]: string }, model: OpenAiModel) => {
          const key = `${model.owned_by}/${model.id}`
          // Assuming the unique identifier for selection is the model id itself
          const value = model.id
          acc[key] = value
          return acc
        },
        {}
      )

      return result
    } catch (error) {
      console.error('Failed to fetch models:', error)
      return {}
    }
  }

  //name of the function to call when executing
  async onExecute() {
    //get inputs
    const message = this.getInputData<PromptMessageType | undefined>(0)
    const messages = this.getInputData<PromptMessageType[] | undefined>(1)
    const input = {
      model: this.properties.model,
      messages: message ? [message] : messages,
      max_tokens: this.properties.max_tokens,
      temperature: this.properties.temperature,
      top_p: this.properties.top_p,
      top_k: this.properties.top_k,
      presence_penalty: this.properties.presence_penalty,
      repetition_penalty: this.properties.repetition_penalty,
      repetition_penalty_range: this.properties.repetition_penalty_range,
      guidance_scale: this.properties.guidance_scale
    }

    // TODO: sanity check input
    const required_input = JSON.stringify(input)
    console.log(required_input)
    // fetch from server
    console.log(this.env.MODEL_WORKER_URL)
    const response = await fetch(
      (this.env.MODEL_WORKER_URL ?? 'http://localhost:8000') + '/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: required_input
      }
    )
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

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
