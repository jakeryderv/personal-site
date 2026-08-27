import { defineConfig, sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jvs.sh',
  trailingSlash: 'always',
  adapter: cloudflare(),
  // The Cloudflare adapter defaults to KV-backed sessions and provisions a SESSION
  // KV namespace at deploy time. Nothing on this site uses sessions — every route is
  // prerendered — so an in-memory driver keeps that binding out of the generated
  // Wrangler config. Swap this out if a server-rendered route ever needs real sessions.
  session: { driver: sessionDrivers.lruCache() },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
});
