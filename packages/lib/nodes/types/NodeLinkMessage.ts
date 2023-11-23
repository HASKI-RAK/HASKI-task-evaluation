export type PromptMessageType = {
  role: string
  content: string
}

export enum InOut {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  MESSAGE = 'message'
}
