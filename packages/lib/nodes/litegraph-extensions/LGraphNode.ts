import { INodeOutputSlot, LGraphNode as LGN } from 'litegraph.js'
import { WebSocket } from 'ws'

import WebSocketNode from '../behavior/WebSocketNode'
import { InOut } from '../types/NodeLinkMessage'

interface ILGraphNode extends LGN {
  onExecute(): Promise<void>
  setEnv?(env: Record<string, unknown>): void
  env?: Record<string, unknown>
  addOut<T extends InOut>(
    type: T,
    name?: string,
    extra_info?: Partial<INodeOutputSlot>
  ): INodeOutputSlot
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
  addOut<T extends InOut>(
    type: T,
    name?: string,
    extra_info?: Partial<INodeOutputSlot>
  ): INodeOutputSlot {
    const _name = name ?? type
    switch (type) {
      case 'boolean':
        return super.addOutput(_name, type, {
          ...extra_info,
          color_off: '#4400FF60',
          color_on: '#1900FF'
        })
      case 'number':
        return super.addOutput(_name, type, {
          ...extra_info,
          color_off: '#FF000060',
          color_on: '#FF0000'
        })
      case 'string':
        return super.addOutput(_name, type, {
          ...extra_info,
          color_off: '#00FF0060',
          color_on: '#00FF00'
        })
      case 'message':
        return super.addOutput(_name, type, {
          ...extra_info,
          color_off: '#D9FF0060',
          color_on: '#D9FF00'
        })
      case 'any':
        return super.addOutput(_name, type, {
          ...extra_info,
          color_off: '#FF00FF60',
          color_on: '#FF00FF'
        })
    }
    return super.addOutput(_name, type, extra_info)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setWebSocket?(_ws: WebSocket): void
  setEnv?(env: Record<string, unknown>): void
}

export default LGraphNode
