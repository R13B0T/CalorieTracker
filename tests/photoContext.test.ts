import { describe, expect, it } from 'vitest';
import { buildPhotoContext } from '@/features/log/photo/context';

describe('photo analysis context', () => {
  it('includes known ingredients and an optional note', () => {
    expect(buildPhotoContext(['olive oil', 'feta'], '', 'large bowl')).toContain(
      'Confirmed ingredients from the user: olive oil, feta.',
    );
    expect(buildPhotoContext(['olive oil'], '', 'large bowl')).toContain(
      'Additional context: large bowl',
    );
  });

  it('includes an uncommitted ingredient and removes case-insensitive duplicates', () => {
    const context = buildPhotoContext(['Pesto'], ' pesto ', '');
    expect(context.match(/pesto/gi)).toHaveLength(1);
  });

  it('returns an empty string when no context was supplied', () => {
    expect(buildPhotoContext([], ' ', ' ')).toBe('');
  });
});
