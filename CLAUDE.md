# jvs.sh

Personal site and portfolio. Astro 7 on Cloudflare Workers via `@astrojs/cloudflare` 14.
See `docs/design.md` for the design rationale and what is deliberately out of scope.

## Commands

```
npm run dev       # astro dev
npm run test      # vitest run
npm run check     # astro check + wrangler types --check
npm run build     # astro build
npm run preview   # build, then wrangler dev against the Worker runtime
npm run deploy    # build + wrangler deploy (CI does this on push to main)
```

`npm run check` needs `worker-configuration.d.ts`, which is gitignored — regenerate it
with `npx wrangler types` after a fresh clone or any `wrangler.jsonc` binding change.
That command also needs `.dev.vars` to exist so the secret's name lands in `Env`; locally
it holds Cloudflare's always-pass Turnstile test secret, and CI writes the same value.

## Invariants

- **Static-first.** Every route prerenders. `POST /api/contact` is the only on-demand
  route and the only file carrying `export const prerender = false`. Keep it that way.
- **Zero client JS** except the contact form handler in `public/scripts/contact.js`.
- **Dark only.** Colors come from the carbonfox tokens in `src/styles/tokens.css` — use
  the variables, never raw hex.
- **The contact form must keep working with JS disabled.** It posts natively and
  303-redirects with `?status=…`; the fetch path is an enhancement layered on top.
- Touching anything under `src/lib/` means running `npm run test`. The endpoint is
  dependency-injected specifically so it tests without a Worker runtime.

## Gotchas

These have each broken a build or a deploy before:

- **Astro 7 removed `locals.runtime.env`.** Access bindings with
  `import { env } from 'cloudflare:workers'`.
- **`import { z } from 'astro:content'` is deprecated** in Astro 7 — import from
  `astro/zod`. Likewise `z.string().url()` is deprecated; use `z.url()`.
- **`main` is intentionally omitted from `wrangler.jsonc`.** The adapter emits a
  generated config that Wrangler redirects to; build output is `dist/client` (static)
  plus `dist/server` (on-demand). Do not add a `main` field.
- **Turnstile sitekeys in `src/consts.ts` are public and switch on `import.meta.env.DEV`.**
  Only `TURNSTILE_SECRET_KEY` is a real secret.
- **Regenerating the ASCII portrait means regenerating the OG card too** — run
  `node scripts/generate-og-image.mjs`, then re-render `public/og-image.png` from the SVG.

## Commit conventions

No `Co-Authored-By` lines, no agent attribution in commit messages.
