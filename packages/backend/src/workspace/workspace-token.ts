import { createHash, randomBytes } from 'node:crypto';

/**
 * Marks a string as a NodeGrade workspace token. Not a security measure: it exists so a
 * leaked token is recognisable in a log or a secret scanner, and so a caller sending the
 * admin session cookie as a bearer token fails cleanly instead of hitting the database.
 */
export const WORKSPACE_TOKEN_PREFIX = 'ngw_';

/** 256 bits, per SPEC-0004's "opaque and high-entropy" constraint. */
const TOKEN_BYTES = 32;

/** 32 bytes of base64url are 43 characters. */
const TOKEN_BODY_LENGTH = 43;

export type IssuedWorkspaceToken = {
  /** Returned to the caller exactly once; never stored. */
  token: string;
  tokenHash: string;
};

/**
 * SHA-256 rather than bcrypt or argon2 (ADR-0001). Those exist to slow the guessing of
 * low-entropy secrets and would add ~100 ms to every autosave and every socket handshake
 * for no gain against 256 bits of randomness.
 */
export const hashWorkspaceToken = (token: string): string =>
  createHash('sha256').update(token, 'utf8').digest('hex');

export function issueWorkspaceToken(): IssuedWorkspaceToken {
  const token =
    WORKSPACE_TOKEN_PREFIX + randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashWorkspaceToken(token) };
}

/**
 * Shape check only. A well-formed token still has to be looked up; this guard is what
 * keeps a stray empty or truncated value from becoming a database round trip.
 */
export function isWorkspaceTokenShape(value: string | undefined): boolean {
  if (!value || !value.startsWith(WORKSPACE_TOKEN_PREFIX)) return false;
  const body = value.slice(WORKSPACE_TOKEN_PREFIX.length);
  return body.length === TOKEN_BODY_LENGTH && /^[A-Za-z0-9_-]+$/.test(body);
}

/** Extracts the credential from an `Authorization: Bearer <token>` header. */
export function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer[ \t]+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}
