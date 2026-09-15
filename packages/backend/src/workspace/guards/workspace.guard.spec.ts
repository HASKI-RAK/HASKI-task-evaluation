import { ExecutionContext } from '@nestjs/common';
import type { ResolvedWorkspace } from '../workspace.service.js';
import { WorkspaceService } from '../workspace.service.js';
import { WorkspaceGuard, RequestWithWorkspace } from './workspace.guard.js';

const contextFor = (request: Partial<RequestWithWorkspace>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('WorkspaceGuard', () => {
  const workspace: ResolvedWorkspace = {
    id: 'ws-a',
    type: 'BROWSER',
    label: null,
    workshopId: null,
  };

  const guardWith = (resolved: ResolvedWorkspace | null) => {
    const resolveByToken = jest.fn().mockResolvedValue(resolved);
    const guard = new WorkspaceGuard({
      resolveByToken,
    } as unknown as WorkspaceService);
    return { guard, resolveByToken };
  };

  it('rejects a request with no Authorization header', async () => {
    const { guard, resolveByToken } = guardWith(workspace);

    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toMatchObject({ status: 401 });
    expect(resolveByToken).not.toHaveBeenCalled();
  });

  it('rejects a token that does not resolve', async () => {
    const { guard } = guardWith(null);

    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer ngw_whatever' } }),
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('attaches the resolved workspace to the request', async () => {
    const { guard } = guardWith(workspace);
    const request: Partial<RequestWithWorkspace> = {
      headers: { authorization: 'Bearer ngw_token' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.workspace).toEqual(workspace);
  });

  it('ignores a workspace id supplied by the caller (AC-007)', async () => {
    const { guard, resolveByToken } = guardWith(workspace);
    const request: Partial<RequestWithWorkspace> = {
      headers: { authorization: 'Bearer ngw_token-for-a' },
      params: { workspaceId: 'ws-b' },
      body: { workspaceId: 'ws-b' },
      query: { workspaceId: 'ws-b' },
    };

    await guard.canActivate(contextFor(request));

    expect(resolveByToken).toHaveBeenCalledWith('ngw_token-for-a');
    expect(request.workspace?.id).toBe('ws-a');
  });
});
