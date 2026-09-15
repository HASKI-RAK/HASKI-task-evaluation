import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  AdminAuthService,
  CSRF_HEADER_NAME,
  ResolvedSession,
  SESSION_COOKIE_NAME,
} from '../admin-auth.service.js';
import { AdminCredentials } from '../admin-credentials.js';

export type RequestWithAdminSession = Request & {
  adminSession?: ResolvedSession;
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Guards every administrative route (SPEC-0013/FR-001, FR-003, FR-007).
 *
 * Also enforces CSRF, because the two are inseparable: the check needs the resolved
 * session's hash, and splitting them into two guards would mean resolving the session
 * twice per request.
 */
@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(
    private readonly adminAuth: AdminAuthService,
    private readonly credentials: AdminCredentials,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 503 rather than 401 when the deployment has no credentials at all: the frontend
    // should say "administration is disabled here", not offer an unusable login form.
    if (!this.credentials.isEnabled()) {
      throw new ServiceUnavailableException({
        code: 'admin_disabled',
        message:
          'Administrative features are not configured on this deployment.',
      });
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithAdminSession>();
    const token = (request.cookies as Record<string, string> | undefined)?.[
      SESSION_COOKIE_NAME
    ];

    const session = await this.adminAuth.resolve(token);
    if (!session) {
      throw new UnauthorizedException({
        code: 'unauthorized',
        message: 'A facilitator session is required.',
      });
    }

    if (!SAFE_METHODS.has(request.method)) {
      const presented = request.headers[CSRF_HEADER_NAME];
      if (!this.adminAuth.matchesCsrf(session, presented)) {
        throw new ForbiddenException({
          code: 'csrf_invalid',
          message: 'A valid CSRF token is required for this request.',
        });
      }
    }

    request.adminSession = session;
    return true;
  }
}
