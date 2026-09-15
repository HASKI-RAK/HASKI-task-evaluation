import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '../config/configuration.js';
import { GraphModule } from '../graphgateway/graph.module.js';
import { ContentMigrationModule } from '../migration/content-migration.module.js';
import { PrismaService } from '../prisma.service.js';
import { GraphController } from '../graph/graph.controller.js';
import { GraphService } from '../graph/graph.service.js';
import { BenchmarkController } from '../benchmark/benchmark.controller.js';
import { BenchmarkService } from '../benchmark/benchmark.service.js';
import { LtiController } from '../lti/lti.controller.js';
import { LtiService } from '../lti/lti.service.js';
import { XapiService } from '../xapi.service.js';
import { HealthController } from '../health/health.controller.js';
import { HealthService } from '../health/health.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
    GraphModule,
    ContentMigrationModule,
  ],
  controllers: [
    GraphController,
    BenchmarkController,
    LtiController,
    HealthController,
  ],
  providers: [
    GraphService,
    PrismaService,
    BenchmarkService,
    LtiService,
    XapiService,
    HealthService,
  ],
})
export class AppModule {}
