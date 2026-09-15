const DEFAULT_ALLOWED_ORIGINS = ['https://nodegrade.haski.app'];

/**
 * Parses the comma separated CORS_ORIGIN variable into a list of origins.
 *
 * The HTTP bootstrap, the WebSocket gateway and the graph controller each used to
 * carry their own copy of this logic. The gateway evaluates its origins while the
 * decorator is applied, so this stays a plain function reading process.env rather
 * than an injectable provider.
 */
export function resolveCorsOrigins(
  raw: string | undefined = process.env.CORS_ORIGIN,
): string[] {
  if (!raw) return [...DEFAULT_ALLOWED_ORIGINS];

  const origins = raw
    .split(',')
    .map((origin) => origin.trim().replace(/^"|"$/g, ''))
    .filter((origin) => origin.length > 0);

  return origins.length > 0 ? origins : [...DEFAULT_ALLOWED_ORIGINS];
}
