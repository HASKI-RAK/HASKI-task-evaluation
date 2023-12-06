// import { INodeOutputSlot } from 'litegraph.js'
export type PromptMessageType = {
  role: string
  content: string
}

export type InOut = 'string' | 'number' | 'boolean' | 'message' | 'any'
