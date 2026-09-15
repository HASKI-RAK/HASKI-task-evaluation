import { parse } from 'cookie';
import { LtiCookie } from '../utils/LtiCookie.js';

export const LTI_COOKIE_NAME = 'lti_nodegrade_cookie';

/** Guards against a hostile client sending a multi-megabyte cookie value. */
const MAX_COOKIE_LENGTH = 10000;

/**
 * Parses a Cookie header.
 *
 * The previous hand-rolled implementation split each pair on "=" and kept it only when
 * exactly two parts came back, so any cookie whose value contained "=" was silently
 * dropped. Base64 padding produces exactly that, which would have discarded the session
 * and workspace tokens introduced by SPEC-0013 and SPEC-0004.
 */
export function parseCookieHeader(
  header: string | undefined,
): Record<string, string> {
  if (!header) return {};

  const parsed = parse(header);
  const cookies: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed)) {
    if (typeof value === 'string') cookies[name] = value;
  }
  return cookies;
}

const isLtiCookie = (value: unknown): value is LtiCookie => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.user_id === 'string' &&
    typeof candidate.timestamp === 'string' &&
    typeof candidate.tool_consumer_instance_guid === 'string' &&
    typeof candidate.isEditor === 'boolean' &&
    typeof candidate.lis_person_name_full === 'string' &&
    typeof candidate.tool_consumer_instance_name === 'string' &&
    typeof candidate.lis_person_contact_email_primary === 'string'
  );
};

/**
 * Turns the raw LTI cookie value into a typed cookie, or null when it is absent,
 * oversized, unparseable or structurally wrong. Never throws: a malformed cookie means
 * an unauthenticated visitor, not a failed request.
 */
export function parseLtiCookie(raw: string | undefined): LtiCookie | null {
  if (!raw) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  if (decoded.length > MAX_COOKIE_LENGTH) return null;

  try {
    const parsed: unknown = JSON.parse(decoded);
    return isLtiCookie(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
