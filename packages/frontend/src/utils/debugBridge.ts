import { LGraph, LiteGraph } from '@haski/ta-lib'
import { LGraphCanvas } from 'litegraph.js'
import { Socket } from 'socket.io-client'

type DebugEvent = {
  name: string
  payload: unknown
  timestamp: string
}

type DebugNode = {
  id: number
  title: string
  type: string | null
  pos: [number, number]
  size: [number, number]
  properties: unknown
}

export type NodeGradeDebugBridge = {
  readonly version: 1
  graphSnapshot(): unknown
  listNodes(): DebugNode[]
  getNode(id: number): DebugNode | undefined
  selectNode(id: number): boolean
  addNode(type: string, position?: [number, number]): DebugNode
  connectNodes(
    sourceId: number,
    sourceSlot: number | string,
    targetId: number,
    targetSlot: number | string
  ): boolean
  setNodeProperty(id: number, property: string, value: unknown): boolean
  socketState(): { connected: boolean; id?: string }
  recentEvents(): DebugEvent[]
  clearEvents(): void
  waitForEvent(eventName: string, timeoutMs?: number): Promise<unknown>
  runGraph(answer?: string): boolean
  saveGraph(name: string): boolean
}

declare global {
  interface Window {
    __NODEGRADE_DEBUG__?: NodeGradeDebugBridge
  }
}

const eventLimit = 200
const events: DebugEvent[] = []
let debugSocket: Socket | undefined
let eventListener: ((eventName: string, ...args: unknown[]) => void) | undefined

const enabled = import.meta.env.DEV && import.meta.env.VITE_DEBUG_BRIDGE === 'true'
const sensitiveKey =
  /(authorization|api[-_]?key|bearer|credential|password|secret|token)/i

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'
  seen.add(value)

  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen))

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKey.test(key) ? '[Redacted]' : sanitize(item, seen)
    ])
  )
}

function appendEvent(name: string, payload: unknown) {
  events.push({ name, payload: sanitize(payload), timestamp: new Date().toISOString() })
  if (events.length > eventLimit) events.splice(0, events.length - eventLimit)
}

function toDebugNode(
  node: ReturnType<LGraph['serialize']>['nodes'][number],
  fallbackTitle = ''
): DebugNode {
  const pos = Array.from(node.pos).slice(0, 2) as [number, number]
  const size = Array.from(node.size).slice(0, 2) as [number, number]
  return {
    id: node.id,
    title: node.title ?? fallbackTitle,
    type: node.type,
    pos,
    size,
    properties: sanitize(node.properties)
  }
}

export function attachDebugSocket(socket: Socket) {
  if (!enabled) return
  if (debugSocket && eventListener) debugSocket.offAny(eventListener)

  debugSocket = socket
  eventListener = (eventName, ...args) => appendEvent(eventName, args[0])
  socket.onAny(eventListener)
}

export function detachDebugSocket(socket: Socket) {
  if (debugSocket !== socket || eventListener === undefined) return
  socket.offAny(eventListener)
  debugSocket = undefined
  eventListener = undefined
}

export function createDebugBridge(
  graph: LGraph,
  canvas: LGraphCanvas
): NodeGradeDebugBridge {
  const nodes = () =>
    graph
      .serialize()
      .nodes.map((node) => toDebugNode(node, graph.getNodeById(node.id)?.title))
  const waitForEvent = (eventName: string, timeoutMs = 5_000) =>
    new Promise<unknown>((resolve, reject) => {
      const existing = events.findLast((event) => event.name === eventName)
      if (existing) {
        resolve(existing.payload)
        return
      }

      const startedAt = Date.now()
      const timer = window.setInterval(() => {
        const event = events.findLast((candidate) => candidate.name === eventName)
        if (event) {
          window.clearInterval(timer)
          resolve(event.payload)
        } else if (Date.now() - startedAt >= timeoutMs) {
          window.clearInterval(timer)
          reject(new Error(`Timed out waiting for Socket.IO event: ${eventName}`))
        }
      }, 25)
    })

  return {
    version: 1,
    graphSnapshot: () => sanitize(graph.serialize()),
    listNodes: nodes,
    getNode: (id) => nodes().find((node) => node.id === id),
    selectNode(id) {
      const node = graph.getNodeById(id)
      if (node === undefined) return false
      canvas.selectNode(node)
      canvas.centerOnNode(node)
      graph.setDirtyCanvas(true, true)
      return true
    },
    addNode(type, position = [100, 100]) {
      const node = LiteGraph.createNode(type)
      node.pos = position
      graph.add(node)
      graph.setDirtyCanvas(true, true)
      return toDebugNode(node.serialize(), node.title)
    },
    connectNodes(sourceId, sourceSlot, targetId, targetSlot) {
      const source = graph.getNodeById(sourceId)
      const target = graph.getNodeById(targetId)
      if (source === undefined || target === undefined) return false
      const link = source.connect(sourceSlot, target, targetSlot)
      graph.setDirtyCanvas(true, true)
      return link !== null
    },
    setNodeProperty(id, property, value) {
      const node = graph.getNodeById(id)
      if (node === undefined) return false
      node.properties[property] = value
      graph.setDirtyCanvas(true, true)
      return true
    },
    socketState: () => ({
      connected: debugSocket?.connected ?? false,
      id: debugSocket?.id
    }),
    recentEvents: () => events.map((event) => ({ ...event })),
    clearEvents: () => events.splice(0, events.length),
    waitForEvent,
    runGraph(answer = 'Deterministic debug answer') {
      if (!debugSocket?.connected) return false
      debugSocket.emit('runGraph', {
        answer,
        graph: JSON.stringify(graph.serialize()),
        xapi: {}
      })
      return true
    },
    saveGraph(name) {
      if (!debugSocket?.connected) return false
      debugSocket.emit('saveGraph', { name, graph: JSON.stringify(graph.serialize()) })
      return true
    }
  }
}

export function installDebugBridge(graph: LGraph, canvas: LGraphCanvas) {
  if (!enabled) return
  window.__NODEGRADE_DEBUG__ = createDebugBridge(graph, canvas)
}
