import { Module } from '@nestjs/common';
import { GraphGateway } from './graph.gateway.js';
import { GraphService } from '../graph/graph.service.js';
import { GraphHandlerService } from './graph-handler.service.js';
import { PrismaService } from '../prisma.service.js';
import { XapiService } from '../xapi.service.js';

@Module({
  providers: [
    GraphGateway,
    GraphService,
    GraphHandlerService,
    PrismaService,
    XapiService,
  ],
})
export class GraphModule {}
