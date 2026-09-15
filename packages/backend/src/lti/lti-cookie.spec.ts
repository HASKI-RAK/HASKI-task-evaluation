import { LtiCookie } from '../utils/LtiCookie.js';
import {
  LTI_COOKIE_NAME,
  parseCookieHeader,
  parseLtiCookie,
} from './lti-cookie.js';

const validCookie: LtiCookie = {
  user_id: 'user-1',
  timestamp: '2026-09-15T00:00:00.000Z',
  tool_consumer_instance_guid: 'moodle.example',
  isEditor: true,
  lis_person_name_full: 'Ada Lovelace',
  tool_consumer_instance_name: 'Example University',
  lis_person_contact_email_primary: 'ada@example.test',
};

describe('parseCookieHeader', () => {
  it('returns an empty record when the header is absent', () => {
    expect(parseCookieHeader(undefined)).toEqual({});
  });

  it('parses multiple cookies', () => {
    expect(parseCookieHeader('a=1; b=2')).toEqual({ a: '1', b: '2' });
  });

  it('keeps values containing "=" — base64 padding used to be dropped', () => {
    expect(parseCookieHeader('session=YWJjZA==')).toEqual({
      session: 'YWJjZA==',
    });
  });

  it('keeps a base64url token alongside other cookies', () => {
    const header = `other=1; ${LTI_COOKIE_NAME}=x; ngw=dG9rZW4=`;
    expect(parseCookieHeader(header).ngw).toBe('dG9rZW4=');
  });
});

describe('parseLtiCookie', () => {
  it('returns null when absent', () => {
    expect(parseLtiCookie(undefined)).toBeNull();
  });

  it('parses a URI encoded cookie', () => {
    const raw = encodeURIComponent(JSON.stringify(validCookie));
    expect(parseLtiCookie(raw)).toEqual(validCookie);
  });

  it('returns null for a structurally invalid cookie', () => {
    const raw = encodeURIComponent(JSON.stringify({ user_id: 'only-this' }));
    expect(parseLtiCookie(raw)).toBeNull();
  });

  it('returns null rather than throwing on malformed JSON', () => {
    expect(parseLtiCookie('not-json')).toBeNull();
  });

  it('rejects an oversized cookie', () => {
    const oversized = JSON.stringify({
      ...validCookie,
      lis_person_name_full: 'x'.repeat(10_001),
    });
    expect(parseLtiCookie(oversized)).toBeNull();
  });
});
