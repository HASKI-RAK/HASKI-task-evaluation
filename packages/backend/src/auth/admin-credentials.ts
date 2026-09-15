import { createHash, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';

/**
 * The single facilitator identity, configured entirely through the environment
 * (SPEC-0013/FR-001). There is no user account system and no registration.
 */
@Injectable()
export class AdminCredentials {
  private readonly logger = new Logger(AdminCredentials.name);
  private readonly username: string;
  private readonly password: string;

  constructor() {
    this.username = process.env.ADMIN_USERNAME ?? '';
    this.password = process.env.ADMIN_PASSWORD ?? '';

    if (!this.isEnabled()) {
      // Never log the values themselves, set or not (FR-008).
      this.logger.warn(
        'Administrative features are disabled: ADMIN_USERNAME and ADMIN_PASSWORD are not both configured.',
      );
    }
  }

  isEnabled(): boolean {
    return this.username.length > 0 && this.password.length > 0;
  }

  /**
   * Compares both fields in constant time.
   *
   * Each side is hashed first so the buffers are always the same length —
   * `timingSafeEqual` throws on a length mismatch, and that throw would itself leak the
   * length of the configured secret. The two results are combined without
   * short-circuiting so a wrong username costs the same as a wrong password.
   */
  verify(username: unknown, password: unknown): boolean {
    if (!this.isEnabled()) return false;
    if (typeof username !== 'string' || typeof password !== 'string')
      return false;

    const usernameMatches = constantTimeEquals(username, this.username);
    const passwordMatches = constantTimeEquals(password, this.password);

    return usernameMatches && passwordMatches;
  }
}

export function constantTimeEquals(a: string, b: string): boolean {
  const left = createHash('sha256').update(a, 'utf8').digest();
  const right = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(left, right);
}
