import { LGraph, ServerEvent, ServerEventPayload } from '@haski/lib'
import { WebSocket } from 'ws'

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

// Define a mapping of event names to handler functions
export type EventHandlerMap = {
  [K in keyof ServerEventPayload]: (payload: ServerEventPayload[K]) => void
}

/**
 * Handles a WebSocket server request.
 *
 * @template T - The type of the server event payload.
 * @param WsEvent - The server event object.
 * @param lgraph - The LGraph object.
 * @param handlers - The map of event handlers.
 * @returns A boolean indicating whether the event was handled successfully.
 */
export const handleWsServerRequest = <T extends keyof ServerEventPayload>(
  WsEvent: ServerEvent<T>,
  handlers: Partial<EventHandlerMap>
): boolean => {
  // Utility function to safely handle events
  function handleEvent<K extends keyof ServerEventPayload>(
    eventName: K,
    payload: ServerEventPayload[K]
  ) {
    const handler = handlers[eventName]
    if (handler) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(handler as any)(payload) // Cast is safe here because of the mapped types
      return true
    } else return false
  }
  const isHandled = handleEvent(WsEvent.eventName, WsEvent.payload)
  console.log('isHandled', isHandled)
  return isHandled
}
