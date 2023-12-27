/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
import { WebSocket } from 'ws'

import { ServerEvent } from '../events'
import { LGraphNode, LiteGraph } from './litegraph-extensions'

/**
 * * This node is used to send data to the client into the TA form
 * path: output/feedback
 */
export class FeedbackOutputNode extends LGraphNode {
  properties: Record<string, string>
  constructor() {
    super()
    this.addIn('*')
    this.title = 'feedback output'
    this.properties = { value: '' }
  }

  // statics
  static title = 'feedback output'

  static path = 'output/feedback'

  static getPath(): string {
    return FeedbackOutputNode.path
  }

  // this node uses the websocket
  setWebSocket(ws: WebSocket) {
    this.ws = ws
  }

  //name of the function to call when executing
  async onExecute() {
    if (this.inputs[0]) {
      this.properties.value = this.getInputData(0)
    }
    const output: ServerEvent<'feedback'> = {
      eventName: 'feedback',
      payload: this.properties.value
    }
    this.ws?.send(JSON.stringify(output))
  }

  getTitle(): string {
    if (this.flags.collapsed) {
      return this.inputs[0].label ?? this.title
    }
    return this.title
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDrawBackground = (ctx: CanvasRenderingContext2D) => {
    //show the current value
    this.inputs[0].label =
      'feedback: ' + (this.properties.value.substring(0, 10) ?? this.title)
  }

  //register in the system
  static register() {
    LiteGraph.registerNodeType(FeedbackOutputNode.path, FeedbackOutputNode)
  }
}
