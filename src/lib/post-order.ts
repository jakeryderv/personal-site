interface PostLike {
  data: { draft?: boolean; date: Date };
}

/**
 * Drop drafts and order newest first. Kept free of `astro:content` imports so the
 * ordering rules stay testable without the Astro content runtime.
 */
export function selectPublished<T extends PostLike>(posts: T[]): T[] {
  return posts
    .filter(({ data }) => !data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
