# jvs.sh

Personal site and portfolio. Built with Astro on Cloudflare Workers, live at https://jvs.sh.

Design notes and scope decisions live in [`docs/design.md`](docs/design.md).

## Development

1. Install dependencies:
   ```
   npm install
   ```

2. Generate Wrangler types:
   ```
   npx wrangler types
   ```
   This creates the gitignored `worker-configuration.d.ts` file.

3. Create `.dev.vars` file with Turnstile test secret:
   ```
   TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
   ```
   This is Cloudflare's documented Turnstile test secret (not a real credential).

4. Start local dev server:
   ```
   npm run dev
   ```

5. Run verification:
   ```
   npm run test
   npm run check
   ```

6. Deploy to production:
   ```
   npm run deploy
   ```
