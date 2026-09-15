import { LoginThrottle } from './login-throttle.js';

describe('LoginThrottle', () => {
  const windowMs = 1000;
  const maxAttempts = 3;
  const original = { ...process.env };
  let throttle: LoginThrottle;

  beforeEach(() => {
    process.env.ADMIN_LOGIN_WINDOW_MS = String(windowMs);
    process.env.ADMIN_LOGIN_MAX_ATTEMPTS = String(maxAttempts);
    throttle = new LoginThrottle();
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('falls back to the defaults when the environment is unset', () => {
    delete process.env.ADMIN_LOGIN_WINDOW_MS;
    delete process.env.ADMIN_LOGIN_MAX_ATTEMPTS;
    const defaulted = new LoginThrottle();

    for (let i = 0; i < maxAttempts; i++) defaulted.recordFailure('ip', i);

    // Still well under the default threshold of 10.
    expect(defaulted.isThrottled('ip', 10)).toBe(false);
  });

  it('allows attempts below the threshold', () => {
    throttle.recordFailure('ip', 0);
    throttle.recordFailure('ip', 10);

    expect(throttle.isThrottled('ip', 20)).toBe(false);
  });

  // AC-004
  it('throttles once the threshold is exceeded', () => {
    for (let i = 0; i < maxAttempts; i++) throttle.recordFailure('ip', i);

    expect(throttle.isThrottled('ip', 10)).toBe(true);
  });

  it('reports how long the caller must wait', () => {
    throttle.recordFailure('ip', 100);
    throttle.recordFailure('ip', 200);
    throttle.recordFailure('ip', 300);

    // The window is measured from the oldest attempt still inside it.
    expect(throttle.retryAfterMs('ip', 400)).toBe(700);
  });

  it('lets attempts through again once the window slides past', () => {
    for (let i = 0; i < maxAttempts; i++) throttle.recordFailure('ip', i);

    expect(throttle.isThrottled('ip', windowMs + 1)).toBe(false);
  });

  it('throttles each key independently', () => {
    for (let i = 0; i < maxAttempts; i++) throttle.recordFailure('first', i);

    expect(throttle.isThrottled('first', 10)).toBe(true);
    expect(throttle.isThrottled('second', 10)).toBe(false);
  });

  it('forgets a key after a successful login', () => {
    for (let i = 0; i < maxAttempts; i++) throttle.recordFailure('ip', i);
    throttle.reset('ip');

    expect(throttle.isThrottled('ip', 10)).toBe(false);
  });
});
