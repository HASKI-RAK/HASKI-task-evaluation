import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ContentMigrationService } from './content-migration.service.js';

@Module({
  providers: [ContentMigrationService, PrismaService],
  exports: [ContentMigrationService],
})
export class ContentMigrationModule {}
