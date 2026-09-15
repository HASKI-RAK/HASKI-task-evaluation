import { AdminCredentials } from './admin-credentials.js';

describe('AdminCredentials', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  const withEnv = (username?: string, password?: string) => {
    if (username === undefined) delete process.env.ADMIN_USERNAME;
    else process.env.ADMIN_USERNAME = username;

    if (password === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = password;

    return new AdminCredentials();
  };

  it('is disabled when neither variable is set', () => {
    expect(withEnv(undefined, undefined).isEnabled()).toBe(false);
  });

  it('is disabled when only one variable is set', () => {
    expect(withEnv('admin', undefined).isEnabled()).toBe(false);
    expect(withEnv(undefined, 'secret').isEnabled()).toBe(false);
  });

  it('is disabled when a variable is present but empty', () => {
    expect(withEnv('admin', '').isEnabled()).toBe(false);
  });

  // AC-001
  it('accepts the configured credentials', () => {
    expect(withEnv('admin', 'secret').verify('admin', 'secret')).toBe(true);
  });

  // AC-002
  it('rejects a wrong password', () => {
    expect(withEnv('admin', 'secret').verify('admin', 'wrong')).toBe(false);
  });

  it('rejects a wrong username', () => {
    expect(withEnv('admin', 'secret').verify('root', 'secret')).toBe(false);
  });

  it('rejects everything while disabled, including empty input', () => {
    const credentials = withEnv(undefined, undefined);

    expect(credentials.verify('', '')).toBe(false);
    expect(credentials.verify('admin', 'secret')).toBe(false);
  });

  it('rejects non-string input rather than coercing it', () => {
    const credentials = withEnv('admin', 'secret');

    expect(credentials.verify(undefined, 'secret')).toBe(false);
    expect(credentials.verify({ toString: () => 'admin' }, 'secret')).toBe(false);
  });

  it('compares strings of differing length without throwing', () => {
    // timingSafeEqual rejects mismatched buffer lengths, which is why both sides are
    // hashed first.
    expect(() => withEnv('admin', 'secret').verify('a', 'b')).not.toThrow();
  });
});
