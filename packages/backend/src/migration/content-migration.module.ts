import { Module } from '@nestjs/common';
import { ContentMigrationService } from './content-migration.service.js';

@Module({
  providers: [ContentMigrationService],
  exports: [ContentMigrationService],
})
export class ContentMigrationModule {}
