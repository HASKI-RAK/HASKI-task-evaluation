import { WebSocket } from 'ws'

import { ServerEvent, ServerEventPayload } from '@haski/lib'

/**
 * Send a message to the client on an established WebSocket connection
 * @param ws - WebSocket used to send the message
 * @param event - Event to send
 */
export const sendWs = <K extends keyof ServerEventPayload>(
  ws: WebSocket,
  event: ServerEvent<K>
): void => {
  ws.send(JSON.stringify(event))
}

/**
 * Register custom events on the websocket
 * @param ws websocket
 */
export const registerCustomEvents = (ws: WebSocket): void => {
  ws.on('message', function (message) {
    const parsed = JSON.parse(message.toString())
    const { eventName, payload } = parsed
    ws.emit(eventName, payload)
  })
}
