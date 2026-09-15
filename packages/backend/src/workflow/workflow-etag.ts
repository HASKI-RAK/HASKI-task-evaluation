/**
 * Optimistic concurrency for workflow saves, expressed as HTTP's own mechanism
 * (SPEC-0004/FR-012, FR-013 — ADR-0002).
 *
 * Weak validators: the ETag tracks the version counter, not a byte-for-byte hash of a
 * representation, which is exactly what RFC 9110 says a weak validator is for.
 */

export const versionToEtag = (version: number): string => `W/"${version}"`;

export type IfMatch =
  | { kind: 'absent' }
  /** `If-Match: *` — "whatever is stored now", i.e. overwrite if it still exists. */
  | { kind: 'any' }
  | { kind: 'versions'; versions: number[] }
  | { kind: 'invalid' };

const ENTRY = /^(?:W\/)?"(\d+)"$|^(\d+)$/;

/**
 * Accepts `W/"5"`, `"5"`, a bare `5`, a comma-separated list of those, or `*`.
 *
 * The bare form is not RFC-legal, but a hand-written client that echoes back the number
 * it was given should not get a 400 it cannot diagnose.
 */
export function parseIfMatch(header: string | undefined): IfMatch {
  if (header === undefined) return { kind: 'absent' };

  const trimmed = header.trim();
  if (trimmed.length === 0) return { kind: 'absent' };
  if (trimmed === '*') return { kind: 'any' };

  const versions: number[] = [];
  for (const raw of trimmed.split(',')) {
    const match = ENTRY.exec(raw.trim());
    if (!match) return { kind: 'invalid' };

    const version = Number(match[1] ?? match[2]);
    if (!Number.isSafeInteger(version) || version < 0)
      return { kind: 'invalid' };
    versions.push(version);
  }

  return versions.length > 0
    ? { kind: 'versions', versions }
    : { kind: 'invalid' };
}
