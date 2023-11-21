export * from 'ws/index.mjs'
import { WebSocket as WS } from 'ws/index.mjs'
export type WebSocket = WS & {
  sendEvent<K extends keyof ServerEventPayload>(event: ServerEvent<K>): void
}
