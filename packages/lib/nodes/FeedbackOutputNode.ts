/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
import { WebSocket } from 'ws'

import { LGraphNode, LiteGraph } from './litegraph-extensions'

interface FeedbackOutputNodeProperties {
  precision: number
  value: number
}
/**
 * * This node is used to send data to the client into the TA form
 * path: output/feedback
 */
export class FeedbackOutputNode extends LGraphNode {
  properties: FeedbackOutputNodeProperties
  constructor() {
    super()
    this.addInput('value', '*')
    this.properties = { precision: 1, value: 0 }
    this.title = 'feedback output'
  }

  // statics
  static title = 'feedback output'

  static path = 'output/feedback'

  static getPath(): string {
    return FeedbackOutputNode.path
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static stringyfy = function (o: string | number | Array<any> | null): string {
    if (o == null) {
      return 'null'
    } else if (o.constructor === Number) {
      return o.toFixed(3)
    } else if (o.constructor === Array) {
      let str = '['
      for (let i = 0; i < o.length; ++i) {
        str += FeedbackOutputNode.stringyfy(o.at(i)) + (i + 1 != o.length ? ',' : '')
      }
      str += ']'
      return str
    } else {
      return String(o)
    }
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

  onDrawBackground = () => {
    //show the current value
    this.inputs[0].label = FeedbackOutputNode.stringyfy(this.properties.value)
  }

  //register in the system
  static register() {
    LiteGraph.registerNodeType(FeedbackOutputNode.path, FeedbackOutputNode)
  }
}
