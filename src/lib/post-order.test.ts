import { describe, expect, it } from 'vitest';
import { selectPublished } from './post-order';

const post = (slug: string, date: string, draft?: boolean) => ({
  slug,
  data: { date: new Date(date), ...(draft === undefined ? {} : { draft }) },
});

describe('selectPublished', () => {
  it('orders posts newest first', () => {
    const posts = [
      post('older', '2026-01-01'),
      post('newest', '2026-08-01'),
      post('middle', '2026-04-01'),
    ];
    expect(selectPublished(posts).map((p) => p.slug)).toEqual(['newest', 'middle', 'older']);
  });

  it('omits drafts', () => {
    const posts = [post('published', '2026-01-01'), post('wip', '2026-08-01', true)];
    expect(selectPublished(posts).map((p) => p.slug)).toEqual(['published']);
  });

  it('keeps posts that never set a draft flag', () => {
    expect(selectPublished([post('no-flag', '2026-01-01')])).toHaveLength(1);
  });

  it('does not mutate the input array', () => {
    const posts = [post('a', '2026-01-01'), post('b', '2026-08-01')];
    const order = posts.map((p) => p.slug);
    selectPublished(posts);
    expect(posts.map((p) => p.slug)).toEqual(order);
  });

  it('returns an empty array when everything is a draft', () => {
    expect(selectPublished([post('wip', '2026-01-01', true)])).toEqual([]);
  });
});
