/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
import { WebSocket } from 'ws'

import { LGraphNode, LiteGraph } from './litegraph-extensions'

/**
 * * This node is used to send data to the client into the TA form
 * path: output/feedback
 */
export class FeedbackOutputNode extends LGraphNode {
  constructor() {
    super()
    this.addInput('value', '*')
    this.title = 'feedback output'
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
    this.ws?.send(
      JSON.stringify({ eventName: 'feedback', payload: this.properties.value })
    )
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
    this.inputs[0].label = 'Feedback Output'
  }

  //register in the system
  static register() {
    LiteGraph.registerNodeType(FeedbackOutputNode.path, FeedbackOutputNode)
  }
}
