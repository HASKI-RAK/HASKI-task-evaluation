import { LGraphNode as LGN } from 'litegraph.js'
import { WebSocket } from 'ws'

import WebSocketNode from '../behavior/WebSocketNode'

interface ILGraphNode extends LGN {
  onExecute(): Promise<void>
}

// extend the LGraphNode class by adding a new method
export abstract class LGraphNode extends LGN implements ILGraphNode, WebSocketNode {
  ws: WebSocket | undefined
  static path: string
  static getPath(): string {
    throw new Error('getPath() not implemented')
  }
  async onExecute(): Promise<void> {
    throw new Error('onExecute() not implemented')
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setWebSocket?(_ws: WebSocket): void {
    throw new Error('setWebSocket() not implemented')
  }
}

export default LGraphNode
