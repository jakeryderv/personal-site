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

3. Start local dev server:
   ```
   npm run dev
   ```

4. Run verification:
   ```
   npm run test
   npm run check
   ```

5. Deploy to production:
   ```
   npm run deploy
   ```

## License

Code is MIT licensed — see [LICENSE](LICENSE).

Site content under `src/content/` — the blog posts and project write-ups — is
© Jake Van Slyke, all rights reserved, and is not covered by the MIT grant.
