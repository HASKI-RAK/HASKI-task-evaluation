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
export class SuccessPercentageOutputNode extends LGraphNode {
  constructor() {
    super()
    this.addIn('number')
    this.title = 'success percentage'
  }

  // statics
  static title = 'success percentage'

  static path = 'output/success-percentage'

  static getPath(): string {
    return SuccessPercentageOutputNode.path
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
    const output: ServerEvent<'successPercentage'> = {
      eventName: 'successPercentage',
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
    this.inputs[0].label = 'Success Percentage'
  }

  //register in the system
  static register() {
    LiteGraph.registerNodeType(
      SuccessPercentageOutputNode.path,
      SuccessPercentageOutputNode
    )
  }
}
