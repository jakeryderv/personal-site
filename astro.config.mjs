import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jvs.sh',
  trailingSlash: 'always',
  adapter: cloudflare(),
  integrations: [sitemap({ filter: (page) => !page.endsWith('/contact/sent/') })],
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
});
