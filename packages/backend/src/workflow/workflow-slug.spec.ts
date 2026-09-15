import { FALLBACK_SLUG, dedupeSlug, slugify } from './workflow-slug.js';

describe('slugify', () => {
  it.each([
    ['Rubric Assessment', 'rubric-assessment'],
    ['  padded  ', 'padded'],
    ['Already-Slugged', 'already-slugged'],
    ['lots!!!of???punctuation', 'lots-of-punctuation'],
    ['Aufgabe für die Prüfung', 'aufgabe-fur-die-prufung'],
    ['trailing---', 'trailing'],
  ])('turns %j into %j', (name, expected) => {
    expect(slugify(name)).toBe(expected);
  });

  it.each([['   '], ['!!!'], ['—'], ['']])(
    'falls back for %j, which has nothing sluggable in it',
    (name) => {
      expect(slugify(name)).toBe(FALLBACK_SLUG);
    },
  );

  it('bounds the length without leaving a trailing separator', () => {
    const slug = slugify(`${'a'.repeat(59)} tail`);

    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('dedupeSlug', () => {
  it('leaves a free slug alone', () => {
    expect(dedupeSlug('report', ['other'])).toBe('report');
  });

  it('starts at -2, matching how a person would number a second copy', () => {
    expect(dedupeSlug('report', ['report'])).toBe('report-2');
  });

  it('skips over gaps rather than reusing a number', () => {
    expect(dedupeSlug('report', ['report', 'report-2', 'report-4'])).toBe(
      'report-3',
    );
  });

  it('does not confuse a prefix match for a collision', () => {
    expect(dedupeSlug('report', ['reporting', 'report-card'])).toBe('report');
  });

  it('terminates even when a thousand slugs are taken', () => {
    const taken = [
      'report',
      ...Array.from({ length: 1200 }, (_, i) => `report-${i + 2}`),
    ];

    const slug = dedupeSlug('report', taken);

    expect(slug.startsWith('report-')).toBe(true);
    expect(taken).not.toContain(slug);
  });
});
