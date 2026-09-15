import {
  ExecutionContext,
  InternalServerErrorException,
  UseGuards,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { WorkspaceGuard } from '../guards/workspace.guard.js';
import type { RequestWithWorkspace } from '../guards/workspace.guard.js';
import type { ResolvedWorkspace } from '../workspace.service.js';

/** Marks a controller or handler as requiring a valid workspace access token. */
export const WorkspaceScoped = () => applyDecorators(UseGuards(WorkspaceGuard));

/**
 * The workspace the guard derived from the access token — the only workspace a handler
 * is ever allowed to act on.
 */
export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ResolvedWorkspace => {
    const request = context.switchToHttp().getRequest<RequestWithWorkspace>();

    if (!request.workspace) {
      // Reached only if a handler uses the decorator without the guard. Failing loudly
      // beats handing a route an undefined workspace it would then scope queries by.
      throw new InternalServerErrorException(
        'CurrentWorkspace used on a route that is not workspace-scoped',
      );
    }

    return request.workspace;
  },
);
