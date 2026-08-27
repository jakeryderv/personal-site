import { describe, expect, it } from 'vitest';
import { selectFeatured, sortByOrder } from './projects';

const project = (id: string, order: number, featured = false) => ({ id, data: { order, featured } });

describe('sortByOrder', () => {
  it('orders ascending by the order field', () => {
    const projects = [project('third', 3), project('first', 1), project('second', 2)];
    expect(sortByOrder(projects).map((p) => p.id)).toEqual(['first', 'second', 'third']);
  });

  it('does not mutate the input array', () => {
    const projects = [project('b', 2), project('a', 1)];
    const original = projects.map((p) => p.id);
    sortByOrder(projects);
    expect(projects.map((p) => p.id)).toEqual(original);
  });
});

describe('selectFeatured', () => {
  it('keeps only featured projects, in order', () => {
    const projects = [project('b', 2, true), project('skip', 1), project('a', 0, true)];
    expect(selectFeatured(projects, 3).map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('caps the result at the limit', () => {
    const projects = [project('a', 1, true), project('b', 2, true), project('c', 3, true)];
    expect(selectFeatured(projects, 2).map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('returns an empty array when nothing is featured', () => {
    expect(selectFeatured([project('a', 1)], 3)).toEqual([]);
  });
});
