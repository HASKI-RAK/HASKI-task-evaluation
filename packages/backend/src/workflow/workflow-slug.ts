const MAX_SLUG_LENGTH = 60;
const MAX_DEDUPE_ATTEMPTS = 1000;

export const FALLBACK_SLUG = 'workflow';

/**
 * Derives the stored slug from the user-visible name (resolution 8 in the wave plan).
 *
 * Slugs are never shown or typed: the wire identifier is the workflow id. This exists
 * only so the @@unique([workspaceId, slug]) constraint has something stable to hold, and
 * so legacy rows keep a readable key.
 */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    // Strip combining marks left behind by the decomposition, so "Prüfung" becomes
    // "prufung" rather than "pr-fung".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');

  return slug || FALLBACK_SLUG;
}

/**
 * Appends -2, -3, … until the slug is free within its workspace.
 *
 * Advisory only: two concurrent creates can still pick the same candidate, which the
 * unique constraint catches and the service retries. This just keeps the common case
 * from costing a failed insert.
 */
export function dedupeSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;

  for (let suffix = 2; suffix < MAX_DEDUPE_ATTEMPTS; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }

  // A workspace with a thousand identically named workflows is past the point where a
  // readable slug matters; the cap is here so the loop cannot run away.
  return `${base}-${Date.now().toString(36)}`;
}
