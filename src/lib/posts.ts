import { getCollection } from 'astro:content';
import { selectPublished } from './post-order';

/** Published (non-draft) blog posts, newest first. */
export async function getPublishedPosts() {
  return selectPublished(await getCollection('blog'));
}
