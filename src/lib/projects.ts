interface ProjectLike {
  data: { order: number; featured?: boolean };
}

/**
 * Project collection ordering. Kept free of `astro:*` imports so the rules stay
 * testable without the Astro content runtime.
 */
export function sortByOrder<T extends ProjectLike>(projects: T[]): T[] {
  return [...projects].sort((a, b) => a.data.order - b.data.order);
}

/** Featured projects in display order, capped at `limit`. */
export function selectFeatured<T extends ProjectLike>(projects: T[], limit: number): T[] {
  return sortByOrder(projects.filter(({ data }) => data.featured)).slice(0, limit);
}
