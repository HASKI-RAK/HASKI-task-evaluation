/**
 * Sliding-window counter shared by the request throttles.
 *
 * Hand-rolled rather than @nestjs/throttler: the current release peer-depends on
 * @nestjs/common 11 or lower while this repo is on 12, with non-overlapping ranges.
 *
 * In-memory on purpose. Throttling is per-process best-effort, and writing a row per
 * attempt would turn the throttled endpoint into a database amplifier for exactly the
 * traffic it is meant to dampen.
 *
 * Deliberately not @Injectable: it takes constructor primitives, which Nest cannot
 * resolve. The injectable throttles wrap it and read their own configuration.
 */
export class SlidingWindow {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly maxAttempts: number,
  ) {}

  /** Milliseconds until the caller may try again, or 0 when it may try now. */
  retryAfterMs(key: string, now: number = Date.now()): number {
    const recent = this.recent(key, now);
    if (recent.length < this.maxAttempts) return 0;
    return recent[0] + this.windowMs - now;
  }

  isThrottled(key: string, now: number = Date.now()): boolean {
    return this.retryAfterMs(key, now) > 0;
  }

  record(key: string, now: number = Date.now()): void {
    const recent = this.recent(key, now);
    recent.push(now);
    this.attempts.set(key, recent);
  }

  /** Clears the history for a key. */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  private recent(key: string, now: number): number[] {
    const cutoff = now - this.windowMs;
    const kept = (this.attempts.get(key) ?? []).filter(
      (attempt) => attempt > cutoff,
    );

    // Drop keys whose window has emptied, so a stream of one-off addresses cannot grow
    // the map without bound.
    if (kept.length === 0) this.attempts.delete(key);
    else this.attempts.set(key, kept);

    return kept;
  }
}
