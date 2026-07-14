import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://jvs.sh',
  adapter: cloudflare(),
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
});
