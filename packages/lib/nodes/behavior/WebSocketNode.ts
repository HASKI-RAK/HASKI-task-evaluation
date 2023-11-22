import { WebSocket } from 'ws'

export interface WebSocketNode {
  ws: WebSocket | undefined
  setWebSocket?(ws: WebSocket): void
}
export default WebSocketNode
