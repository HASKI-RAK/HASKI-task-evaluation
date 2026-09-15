import {
  WORKSPACE_TOKEN_PREFIX,
  hashWorkspaceToken,
  isWorkspaceTokenShape,
  issueWorkspaceToken,
  parseBearerToken,
} from './workspace-token.js';

describe('workspace tokens', () => {
  describe('issueWorkspaceToken', () => {
    it('issues a prefixed, well-formed token', () => {
      const { token } = issueWorkspaceToken();

      expect(token.startsWith(WORKSPACE_TOKEN_PREFIX)).toBe(true);
      expect(isWorkspaceTokenShape(token)).toBe(true);
    });

    it('never repeats a token', () => {
      const tokens = new Set(
        Array.from({ length: 500 }, () => issueWorkspaceToken().token),
      );
      expect(tokens.size).toBe(500);
    });

    it('returns the hash of the token it issued', () => {
      const { token, tokenHash } = issueWorkspaceToken();
      expect(tokenHash).toBe(hashWorkspaceToken(token));
    });

    it('does not store anything the token can be recovered from', () => {
      const { token, tokenHash } = issueWorkspaceToken();
      expect(tokenHash).toHaveLength(64);
      expect(tokenHash).not.toContain(token.slice(WORKSPACE_TOKEN_PREFIX.length));
    });
  });

  describe('isWorkspaceTokenShape', () => {
    it.each([
      ['undefined', undefined],
      ['empty', ''],
      ['unprefixed', 'a'.repeat(43)],
      ['truncated', `${WORKSPACE_TOKEN_PREFIX}abc`],
      ['overlong', `${WORKSPACE_TOKEN_PREFIX}${'a'.repeat(44)}`],
      ['non-base64url characters', `${WORKSPACE_TOKEN_PREFIX}${'!'.repeat(43)}`],
    ])('rejects %s', (_label, value) => {
      expect(isWorkspaceTokenShape(value)).toBe(false);
    });
  });

  describe('parseBearerToken', () => {
    it('extracts the credential', () => {
      expect(parseBearerToken('Bearer ngw_abc')).toBe('ngw_abc');
    });

    it('is case-insensitive on the scheme and tolerates extra whitespace', () => {
      expect(parseBearerToken('  bearer   ngw_abc  ')).toBe('ngw_abc');
    });

    it.each([
      ['no header', undefined],
      ['empty header', ''],
      ['wrong scheme', 'Basic ngw_abc'],
      ['scheme only', 'Bearer'],
      ['no credential', 'Bearer '],
    ])('returns null for %s', (_label, header) => {
      expect(parseBearerToken(header)).toBeNull();
    });
  });
});
