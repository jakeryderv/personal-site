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
That command also needs `.dev.vars` to exist so each secret's *name* lands in `Env`. It
holds `TURNSTILE_SECRET_KEY` (Cloudflare's always-pass test secret) and `CONTACT_TO`; CI
writes placeholders for both. Adding a new secret means adding it in three places:
`.dev.vars`, the CI step that writes it, and `wrangler secret put` for production.

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
  The real secrets are `TURNSTILE_SECRET_KEY` and `CONTACT_TO` — the latter is a secret
  rather than a var only to keep the address out of a public repo.
- **Regenerating the ASCII portrait means regenerating the OG card too** — run
  `node scripts/generate-og-image.mjs` for the SVG, then re-render the PNG from it.
  `sharp` is already in `node_modules`, and its librsvg backend keeps DejaVu Sans Mono
  instead of substituting a fallback:
  ```
  node -e "require('sharp')(require('fs').readFileSync('public/og-image.svg'))
    .resize(1200,630,{fit:'fill'}).png().toFile('public/og-image.png')"
  ```
  Always eyeball the result — a font substitution is silent and only visible in the image.

## Commit conventions

No `Co-Authored-By` lines, no agent attribution in commit messages.
