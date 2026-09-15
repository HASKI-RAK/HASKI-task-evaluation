import { ExecutionContext } from '@nestjs/common';
import { AdminAuthService, sha256 } from '../admin-auth.service.js';
import { AdminCredentials } from '../admin-credentials.js';
import { AdminSessionGuard, RequestWithAdminSession } from './admin-session.guard.js';

const contextFor = (request: Partial<RequestWithAdminSession>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('AdminSessionGuard', () => {
  const session = {
    id: 'session-1',
    csrfHash: sha256('csrf-token'),
    expiresAt: new Date('2099-01-01'),
  };

  const guardWith = (
    enabled: boolean,
    resolved: typeof session | null = session,
  ) => {
    const adminAuth = {
      resolve: jest.fn().mockResolvedValue(resolved),
      matchesCsrf: new AdminAuthService({} as never).matchesCsrf,
    } as unknown as AdminAuthService;

    const credentials = { isEnabled: () => enabled } as AdminCredentials;
    return new AdminSessionGuard(adminAuth, credentials);
  };

  it('reports 503 rather than 401 when administration is not configured', async () => {
    const guard = guardWith(false);

    await expect(
      guard.canActivate(contextFor({ method: 'GET', cookies: {} })),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('rejects a request with no session', async () => {
    const guard = guardWith(true, null);

    await expect(
      guard.canActivate(contextFor({ method: 'GET', cookies: {} })),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('allows a safe method without a CSRF token', async () => {
    const guard = guardWith(true);
    const request = {
      method: 'GET',
      cookies: { ng_admin_session: 'a'.repeat(43) },
      headers: {},
    } as Partial<RequestWithAdminSession>;

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.adminSession).toMatchObject({ id: 'session-1' });
  });

  // AC-006
  it('rejects a mutation without a valid CSRF token', async () => {
    const guard = guardWith(true);

    await expect(
      guard.canActivate(
        contextFor({
          method: 'POST',
          cookies: { ng_admin_session: 'a'.repeat(43) },
          headers: {},
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      guard.canActivate(
        contextFor({
          method: 'POST',
          cookies: { ng_admin_session: 'a'.repeat(43) },
          headers: { 'x-csrf-token': 'wrong' },
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('allows a mutation carrying the session CSRF token', async () => {
    const guard = guardWith(true);

    await expect(
      guard.canActivate(
        contextFor({
          method: 'POST',
          cookies: { ng_admin_session: 'a'.repeat(43) },
          headers: { 'x-csrf-token': 'csrf-token' },
        }),
      ),
    ).resolves.toBe(true);
  });
});
