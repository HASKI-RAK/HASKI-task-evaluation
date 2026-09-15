import { resolveCorsOrigins } from './cors.js';

describe('resolveCorsOrigins', () => {
  it('falls back to the production origin when unset', () => {
    expect(resolveCorsOrigins(undefined)).toEqual([
      'https://nodegrade.haski.app',
    ]);
  });

  it('falls back when the variable is empty', () => {
    expect(resolveCorsOrigins('')).toEqual(['https://nodegrade.haski.app']);
  });

  it('splits on commas and trims whitespace', () => {
    expect(resolveCorsOrigins('http://a.test, http://b.test')).toEqual([
      'http://a.test',
      'http://b.test',
    ]);
  });

  it('strips wrapping quotes left over from shell quoting', () => {
    expect(resolveCorsOrigins('"http://a.test","http://b.test"')).toEqual([
      'http://a.test',
      'http://b.test',
    ]);
  });

  it('drops empty entries produced by a trailing comma', () => {
    expect(resolveCorsOrigins('http://a.test,')).toEqual(['http://a.test']);
  });

  it('falls back when every entry is empty', () => {
    expect(resolveCorsOrigins(' , ')).toEqual(['https://nodegrade.haski.app']);
  });
});
