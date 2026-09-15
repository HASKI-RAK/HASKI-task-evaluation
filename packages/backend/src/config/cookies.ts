import type { CookieOptions } from 'express';

/**
 * Cookies are marked Secure unless the deployment explicitly opts out.
 *
 * The opt-out exists because the debug stack serves plain HTTP on localhost, where a
 * Secure cookie is silently discarded by the browser — which is why the LTI cookie has
 * never worked against `yarn debug:up`.
 */
export const cookiesInsecure = (): boolean =>
  process.env.COOKIE_INSECURE === 'true' || process.env.COOKIE_INSECURE === '1';

/**
 * SameSite=Lax is correct for the split frontend/backend ports: "site" is scheme plus
 * registrable domain, so localhost:5173 -> localhost:5000 is same-site and the cookie is
 * sent. Serving the API from a different registrable domain would require
 * SameSite=None together with Secure.
 */
export function sessionCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: !cookiesInsecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}
