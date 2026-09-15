import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { cookiesInsecure, sessionCookieOptions } from '../config/cookies.js';
import {
  AdminAuthService,
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from './admin-auth.service.js';
import { AdminCredentials } from './admin-credentials.js';
import { LoginDto } from './dto/login.dto.js';
import { Facilitator } from './decorators/facilitator.decorator.js';
import { LoginThrottle } from './login-throttle.js';
import type { RequestWithAdminSession } from './guards/admin-session.guard.js';

@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(
    private readonly adminAuth: AdminAuthService,
    private readonly credentials: AdminCredentials,
    private readonly throttle: LoginThrottle,
  ) {}

  /**
   * Unauthenticated on purpose: the frontend needs to know whether an admin surface
   * exists at all before it can decide to render a login form.
   */
  @Get('session')
  async session(@Req() request: Request) {
    const enabled = this.credentials.isEnabled();
    if (!enabled) return { enabled: false, authenticated: false };

    const token = (request.cookies as Record<string, string> | undefined)?.[
      SESSION_COOKIE_NAME
    ];
    const session = await this.adminAuth.resolve(token);

    return session
      ? {
          enabled: true,
          authenticated: true,
          expiresAt: session.expiresAt.toISOString(),
        }
      : { enabled: true, authenticated: false };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!this.credentials.isEnabled()) {
      // Never 401 here: that would imply credentials exist and were wrong.
      throw new ServiceUnavailableException({
        code: 'admin_disabled',
        message:
          'Administrative features are not configured on this deployment.',
      });
    }

    const key = request.ip ?? 'unknown';
    const retryAfterMs = this.throttle.retryAfterMs(key);
    if (retryAfterMs > 0) {
      const retryAfter = Math.ceil(retryAfterMs / 1000);
      response.setHeader('Retry-After', String(retryAfter));
      // @nestjs/common has no TooManyRequestsException.
      throw new HttpException(
        {
          code: 'too_many_requests',
          message: `Too many failed login attempts. Try again in ${retryAfter} seconds.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!this.credentials.verify(body.username, body.password)) {
      this.throttle.recordFailure(key);
      // The attempted username is deliberately not logged.
      this.logger.warn('Rejected facilitator login attempt');
      throw new UnauthorizedException({
        code: 'invalid_credentials',
        message: 'Invalid username or password.',
      });
    }

    this.throttle.reset(key);
    const { token, csrfToken, expiresAt } = await this.adminAuth.issue();
    const maxAge = expiresAt.getTime() - Date.now();

    response.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(maxAge));
    // Readable by script on purpose — this is the half of the double submit the client
    // has to echo back in a header.
    response.cookie(CSRF_COOKIE_NAME, csrfToken, {
      ...sessionCookieOptions(maxAge),
      httpOnly: false,
    });

    // Also returned in the body so a client can hold it in memory instead of reading
    // the cookie back.
    return { csrfToken, expiresAt: expiresAt.toISOString() };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Facilitator()
  async logout(
    @Req() request: RequestWithAdminSession,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = (request.cookies as Record<string, string> | undefined)?.[
      SESSION_COOKIE_NAME
    ];
    await this.adminAuth.revoke(token);

    const clear = {
      path: '/',
      secure: !cookiesInsecure(),
      sameSite: 'lax' as const,
    };
    response.clearCookie(SESSION_COOKIE_NAME, { ...clear, httpOnly: true });
    response.clearCookie(CSRF_COOKIE_NAME, { ...clear, httpOnly: false });
  }
}
