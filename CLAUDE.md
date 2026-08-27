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
The site has no secrets and no `.dev.vars`. If one is ever added it goes in three places:
`.dev.vars`, a CI step that writes a placeholder, and `wrangler secret put` for production.

## Invariants

- **Fully static.** Every route prerenders. There is no on-demand route and no
  `export const prerender = false` anywhere. Adding one means re-introducing a server
  surface — do it deliberately, not by accident.
- **Zero client JS.** No `<script>` on any page, no third-party embeds. Literally none.
- **Dark only.** Colors come from the carbonfox tokens in `src/styles/tokens.css` — use
  the variables, never raw hex.
- Touching anything under `src/lib/` means running `npm run test`. Pure logic lives in
  modules free of `astro:*` imports (see `projects.ts`) so it tests without the Astro or
  Worker runtime; pages do the `getCollection` call and pass the result in.

## Gotchas

These have each broken a build or a deploy before:

- **Astro 7 removed `locals.runtime.env`.** Access bindings with
  `import { env } from 'cloudflare:workers'`.
- **`import { z } from 'astro:content'` is deprecated** in Astro 7 — import from
  `astro/zod`. Likewise `z.string().url()` is deprecated; use `z.url()`.
- **`main` is intentionally omitted from `wrangler.jsonc`.** The adapter emits a
  generated config that Wrangler redirects to; build output is `dist/client` (static)
  plus `dist/server` (on-demand). Do not add a `main` field.
- **Regenerating the ASCII portrait means regenerating the OG card too** — run
  `node scripts/generate-og-image.mjs` for the SVG, then re-render the PNG from it.
  `sharp` is already in `node_modules`, and its librsvg backend keeps DejaVu Sans Mono
  instead of substituting a fallback:
  ```
  node -e "require('sharp')(require('fs').readFileSync('public/og-image.svg'))
    .resize(1200,630,{fit:'fill'}).png().toFile('public/og-image.png')"
  ```
  Always eyeball the result — a font substitution is silent and only visible in the image.
- **Changing the OG card also means bumping a query param in another repo.** The
  `jakeryderv/jakeryderv` profile README embeds `https://jvs.sh/og-image.png?v=N`. GitHub
  serves it through the Camo proxy, which caches by URL forever, so the profile keeps
  showing the old card until `?v=N` changes. Bump it and push that repo too.

## Commit conventions

No `Co-Authored-By` lines, no agent attribution in commit messages.
