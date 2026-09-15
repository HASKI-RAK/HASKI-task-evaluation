import { parseIfMatch, versionToEtag } from './workflow-etag.js';

describe('versionToEtag', () => {
  it('emits a weak validator', () => {
    expect(versionToEtag(5)).toBe('W/"5"');
  });

  it('round-trips through parseIfMatch', () => {
    expect(parseIfMatch(versionToEtag(42))).toEqual({
      kind: 'versions',
      versions: [42],
    });
  });
});

describe('parseIfMatch', () => {
  it.each([
    ['no header', undefined],
    ['an empty header', ''],
    ['whitespace', '   '],
  ])('reports %s as absent', (_label, header) => {
    expect(parseIfMatch(header)).toEqual({ kind: 'absent' });
  });

  it('accepts the wildcard', () => {
    expect(parseIfMatch('*')).toEqual({ kind: 'any' });
  });

  it.each([
    ['weak', 'W/"7"'],
    ['strong', '"7"'],
    ['bare, as a hand-written client might send it', '7'],
  ])('accepts a %s validator', (_label, header) => {
    expect(parseIfMatch(header)).toEqual({ kind: 'versions', versions: [7] });
  });

  it('accepts a list, as RFC 9110 allows', () => {
    expect(parseIfMatch('W/"3", W/"4"')).toEqual({
      kind: 'versions',
      versions: [3, 4],
    });
  });

  it.each([
    ['a non-numeric tag', 'W/"abc"'],
    ['an unquoted mess', 'W/7'],
    ['a negative version', '"-1"'],
    ['a fractional version', '"1.5"'],
    ['one bad entry in a list', 'W/"3", garbage'],
  ])('rejects %s', (_label, header) => {
    expect(parseIfMatch(header)).toEqual({ kind: 'invalid' });
  });
});
