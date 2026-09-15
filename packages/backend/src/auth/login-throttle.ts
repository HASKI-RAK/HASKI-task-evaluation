import { Injectable } from '@nestjs/common';

export const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
export const DEFAULT_MAX_ATTEMPTS = 10;

const positiveNumber = (raw: string | undefined, fallback: number): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Sliding-window throttle for failed logins (SPEC-0013/FR-004).
 *
 * Hand-rolled rather than @nestjs/throttler: the current release peer-depends on
 * @nestjs/common 11 or lower while this repo is on 12, with non-overlapping ranges.
 *
 * In-memory on purpose. Throttling is per-process best-effort, and writing a row per
 * failed attempt would turn the login endpoint into a database amplifier for exactly the
 * traffic it is meant to dampen.
 *
 * Only failures are recorded, so a facilitator logging in repeatedly is never locked out
 * by their own success.
 */
@Injectable()
export class LoginThrottle {
  private readonly failures = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxAttempts: number;

  // No constructor parameters: defaulted primitives still appear in design:paramtypes, so
  // Nest would try to resolve a `Number` provider and fail to instantiate the module.
  constructor() {
    this.windowMs = positiveNumber(
      process.env.ADMIN_LOGIN_WINDOW_MS,
      DEFAULT_WINDOW_MS,
    );
    this.maxAttempts = positiveNumber(
      process.env.ADMIN_LOGIN_MAX_ATTEMPTS,
      DEFAULT_MAX_ATTEMPTS,
    );
  }

  /** Milliseconds until the caller may try again, or 0 when it may try now. */
  retryAfterMs(key: string, now: number = Date.now()): number {
    const recent = this.recent(key, now);
    if (recent.length < this.maxAttempts) return 0;
    return recent[0] + this.windowMs - now;
  }

  isThrottled(key: string, now: number = Date.now()): boolean {
    return this.retryAfterMs(key, now) > 0;
  }

  recordFailure(key: string, now: number = Date.now()): void {
    const recent = this.recent(key, now);
    recent.push(now);
    this.failures.set(key, recent);
  }

  /** Clears the history for a key. Called on a successful login. */
  reset(key: string): void {
    this.failures.delete(key);
  }

  private recent(key: string, now: number): number[] {
    const cutoff = now - this.windowMs;
    const kept = (this.failures.get(key) ?? []).filter(
      (attempt) => attempt > cutoff,
    );

    // Drop keys whose window has emptied, so a stream of one-off addresses cannot grow
    // the map without bound.
    if (kept.length === 0) this.failures.delete(key);
    else this.failures.set(key, kept);

    return kept;
  }
}
