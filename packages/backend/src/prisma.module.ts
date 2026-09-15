import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * One PrismaClient for the whole application.
 *
 * A provider listed in several modules is instantiated once per module, and each
 * instance opens its own pg pool. With a module per feature that quietly multiplies the
 * connection count against a server whose default ceiling is 100 — a failure mode that
 * only appears under the concurrency the workshop is built for.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
