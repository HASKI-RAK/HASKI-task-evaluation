import { LGraph } from 'litegraph.js'
import { prisma, log } from '../server'

export function prismaGraphCreateOrUpdate(pathname: string | null, lgraph: LGraph) {
  prisma.graph
    .findFirstOrThrow({
      where: {
        path: pathname ?? ''
      }
    })
    .then(() => {
      prisma.graph
        .update({
          where: {
            path: pathname ?? ''
          },
          data: {
            graph: JSON.stringify(lgraph.serialize())
          }
        })
        .then(() => {
          log.debug('Saved graph')
        })
        .catch((e) => {
          log.error(e)
        })
    })
    .catch(() => {
      log.info('Creating new graph')
      prisma.graph
        .create({
          data: {
            path: pathname ?? '',
            graph: JSON.stringify(lgraph.serialize())
          }
        })
        .then(() => {
          log.debug('Saved graph')
        })
        .catch((e) => {
          log.error(e)
        })
    })
}
