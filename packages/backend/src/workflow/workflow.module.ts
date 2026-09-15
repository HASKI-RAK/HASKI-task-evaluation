import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { WorkflowController } from './workflow.controller.js';
import { WorkflowService } from './workflow.service.js';

@Module({
  imports: [WorkspaceModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  // The template and workshop modules create workflows from revisions.
  exports: [WorkflowService],
})
export class WorkflowModule {}
