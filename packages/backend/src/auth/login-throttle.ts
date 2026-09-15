import { Injectable } from '@nestjs/common';
import { positiveNumber } from '../common/env.js';
import { SlidingWindow } from '../common/sliding-window.js';

export const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
export const DEFAULT_MAX_ATTEMPTS = 10;

/**
 * Sliding-window throttle for failed logins (SPEC-0013/FR-004).
 *
 * Only failures are recorded, so a facilitator logging in repeatedly is never locked out
 * by their own success.
 */
@Injectable()
export class LoginThrottle {
  private readonly window: SlidingWindow;

  // No constructor parameters: defaulted primitives still appear in design:paramtypes, so
  // Nest would try to resolve a `Number` provider and fail to instantiate the module.
  constructor() {
    this.window = new SlidingWindow(
      positiveNumber(process.env.ADMIN_LOGIN_WINDOW_MS, DEFAULT_WINDOW_MS),
      positiveNumber(
        process.env.ADMIN_LOGIN_MAX_ATTEMPTS,
        DEFAULT_MAX_ATTEMPTS,
      ),
    );
  }

  /** Milliseconds until the caller may try again, or 0 when it may try now. */
  retryAfterMs(key: string, now: number = Date.now()): number {
    return this.window.retryAfterMs(key, now);
  }

  isThrottled(key: string, now: number = Date.now()): boolean {
    return this.window.isThrottled(key, now);
  }

  recordFailure(key: string, now: number = Date.now()): void {
    this.window.record(key, now);
  }

  /** Clears the history for a key. Called on a successful login. */
  reset(key: string): void {
    this.window.reset(key);
  }
}
