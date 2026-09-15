import { createHash, randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

export const SESSION_COOKIE_NAME = 'ng_admin_session';
export const CSRF_COOKIE_NAME = 'ng_admin_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** How long a session lives without being refreshed. */
const DEFAULT_TTL_HOURS = 8;
/** Sessions are only touched this often, to keep login-adjacent writes off the hot path. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export type IssuedSession = {
  token: string;
  csrfToken: string;
  expiresAt: Date;
};

export type ResolvedSession = {
  id: string;
  csrfHash: string;
  expiresAt: Date;
};

export const sha256 = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const opaqueToken = (): string => randomBytes(32).toString('base64url');

/**
 * Server-issued facilitator sessions (SPEC-0013/FR-003, FR-006).
 *
 * Stored in the database rather than in memory. `nest start --watch` restarts on every
 * file save, so in-process sessions would log the facilitator out roughly once a minute
 * while they are preparing workshop content — a far more frequent event than the server
 * restart the spec contemplates. Expiry is enforced either way.
 *
 * Only hashes are persisted, so a database dump cannot be replayed as a session.
 */
@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  private ttlMs(): number {
    const configured = Number(process.env.ADMIN_SESSION_TTL_HOURS);
    const hours =
      Number.isFinite(configured) && configured > 0
        ? configured
        : DEFAULT_TTL_HOURS;
    return hours * 60 * 60 * 1000;
  }

  async issue(now: Date = new Date()): Promise<IssuedSession> {
    const token = opaqueToken();
    const csrfToken = opaqueToken();
    const expiresAt = new Date(now.getTime() + this.ttlMs());

    await this.prisma.adminSession.create({
      data: {
        tokenHash: sha256(token),
        csrfHash: sha256(csrfToken),
        expiresAt,
        lastSeenAt: now,
      },
    });

    this.logger.log('Facilitator session issued');
    return { token, csrfToken, expiresAt };
  }

  /** Returns the session when the token is valid and unexpired, otherwise null. */
  async resolve(
    token: string | undefined,
    now: Date = new Date(),
  ): Promise<ResolvedSession | null> {
    // Guard before hashing: an empty token must never be turned into a lookup that could
    // match a row.
    if (!token || token.length < 16) return null;

    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: sha256(token) },
      select: { id: true, csrfHash: true, expiresAt: true, lastSeenAt: true },
    });

    if (!session) return null;
    if (session.expiresAt.getTime() <= now.getTime()) return null;

    await this.touch(session.id, session.lastSeenAt, now);

    return {
      id: session.id,
      csrfHash: session.csrfHash,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Slides the expiry, at most once every few minutes. Conditional on lastSeenAt so it
   * needs no preceding read and cannot race with a concurrent request.
   */
  private async touch(id: string, lastSeenAt: Date, now: Date): Promise<void> {
    if (now.getTime() - lastSeenAt.getTime() < TOUCH_INTERVAL_MS) return;

    await this.prisma.adminSession.updateMany({
      where: {
        id,
        lastSeenAt: { lt: new Date(now.getTime() - TOUCH_INTERVAL_MS) },
      },
      data: {
        lastSeenAt: now,
        expiresAt: new Date(now.getTime() + this.ttlMs()),
      },
    });
  }

  async revoke(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.adminSession.deleteMany({
      where: { tokenHash: sha256(token) },
    });
    this.logger.log('Facilitator session revoked');
  }

  /** Removes expired rows. Folded into the retention sweep once that exists. */
  async sweepExpired(now: Date = new Date()): Promise<number> {
    const { count } = await this.prisma.adminSession.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    return count;
  }

  /**
   * CSRF is bound to the session rather than relying on cookie/header equality, which is
   * weak against an attacker who can write cookies on a sibling subdomain.
   */
  matchesCsrf(session: ResolvedSession, presented: unknown): boolean {
    if (typeof presented !== 'string' || presented.length === 0) return false;
    return sha256(presented) === session.csrfHash;
  }
}
