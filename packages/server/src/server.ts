/* eslint-disable immutable/no-mutation */
import { createServer } from 'http'
import { ILogObj, Logger } from 'tslog'
import { WebSocketServer } from 'ws'

import prisma from './client'
import addListeners from './ServerEventListener'

// Init
export const log: Logger<ILogObj> = new Logger()
const server = createServer()
export type serverType = ReturnType<typeof createServer>
const wss = new WebSocketServer({ noServer: true })
export type wssType = WebSocketServer

// Add listeners
addListeners(wss, server)

/**
 * ! Entry point
 * @async
 */
const main = async () => {
  log.info('Server listening on port: ', process.env.PORT ?? 5000)
  if (process.env.NODE_ENV !== 'test') {
    // https://stackoverflow.com/questions/60803230/node-eaddrinuse-address-already-in-use-3000-when-testing-with-jest-and-super
    server.listen(process.env.PORT ?? 5000)
  }
}

main().catch(async (e) => {
  log.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
