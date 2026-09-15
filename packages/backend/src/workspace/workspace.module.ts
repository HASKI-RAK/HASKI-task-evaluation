import { Module } from '@nestjs/common';
import { RetentionService } from './retention.service.js';
import { WorkspaceController } from './workspace.controller.js';
import { WorkspaceCreationThrottle } from './workspace-creation-throttle.js';
import { WorkspaceGuard } from './guards/workspace.guard.js';
import { WorkspaceService } from './workspace.service.js';

@Module({
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceGuard,
    WorkspaceCreationThrottle,
    RetentionService,
  ],
  // Exported so the workflow, workshop and LTI modules can apply @WorkspaceScoped()
  // without re-declaring the guard's dependencies.
  exports: [WorkspaceService, WorkspaceGuard],
})
export class WorkspaceModule {}
