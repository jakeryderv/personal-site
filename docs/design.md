# jvs.sh — Design

Current-state design notes for the site. Describes what exists and why, not a build plan.

## Purpose

Professional online presence and portfolio for Jake Van Slyke: about, projects showcase,
and a markdown blog as a secondary feature. The primary audience is anyone evaluating
Jake professionally; the site should read as polished, fast, and technically tasteful.

## Stack and architecture

Astro 7 on Cloudflare Workers via `@astrojs/cloudflare` 14. Every page is prerendered to
static HTML at build time and served from Cloudflare's edge through the `ASSETS` binding.
The single server-rendered route is `POST /api/contact`, which runs as Worker code.

Authoring is markdown in the repo — `git push` publishes. No CMS, no admin UI.

The domain `jvs.sh` is canonical, bound as a custom domain route with `workers_dev`
disabled. `vanslyke.ai` stays parked and may 301 here later.

## Pages and content

| Route | Type | Content |
|-------|------|---------|
| `/` | static | Name, identity line, links, ASCII portrait, featured-project and recent-post teasers |
| `/projects/` | static | Portfolio grid from the `projects` collection |
| `/about/` | static | Bio, skills, education |
| `/blog/` | static | Post index from the `blog` collection |
| `/blog/[slug]/` | static | Individual posts, Shiki highlighting themed via CSS variables |
| `/rss.xml` | static | RSS feed |
| `/contact/` | static | Form posting to the endpoint below |
| `/contact/sent/` | static | No-JS success landing; `noindex`, excluded from the sitemap |
| `/api/contact` | server | The only on-demand route |
| `/404` | static | Custom 404 in site style |

Content collections use Zod schemas, so malformed frontmatter fails the build rather than
shipping:

- **`projects`** — title, description, tech tags, optional repo/live links, featured flag,
  sort order.
- **`blog`** — title, date, description, tags, draft flag.

## Design system

- **Colors**: carbonfox palette (from nightfox.nvim) as CSS custom properties in
  `src/styles/tokens.css`. Near-black `#161616` background, soft-white foreground,
  blue/teal/magenta accents. Dark only — no light theme, no toggle.
- **Typography**: 0xProto Nerd Font, self-hosted as woff2 subsets, monospace throughout.
  No third-party font CDN. The regular weight is preloaded; fonts are cached immutable.
- **Terminal flourishes, restrained**: `$` prompt motif in the nav brand (which reflects
  the current path as a working directory), blinking cursor on the homepage tagline,
  Nerd Font glyphs as icons. No icon library, no heavy animation.
- **ASCII portrait**: `src/assets/ascii-art-84x61.txt` rendered as inline SVG `<tspan>`
  lines by `AsciiHeadshot.astro`, so it scales without raster artifacts and inherits
  theme color. `ascii-art-100x72.txt` is an unused higher-resolution rendering of the
  same portrait, kept deliberately as an alternate — not dead weight to clean up.
- **JavaScript budget**: zero client-side JS on every page except the contact form's
  submit handler.

## Contact form

`POST /api/contact` validates name/email/message server-side, verifies a Cloudflare
Turnstile token, and sends to Jake's inbox through the Cloudflare Email Sending binding —
no third-party email service.

The logic is split so it can be tested without a Worker runtime: `src/lib/contact.ts`
holds pure validation and email composition, `src/lib/contact-endpoint.ts` holds the
request handler with its fetcher, sender, and logger injected, and
`src/pages/api/contact.ts` is a thin wrapper that supplies the real Worker bindings.

Progressive enhancement is real: the form posts natively and 303-redirects with
`?status=…` when JS is off; with JS it fetches with `Accept: application/json` and
updates a `role="status"` element in place.

Hardening: 16KB body cap, Turnstile token length cap, control-character rejection on the
name field (CRLF header injection), HTML escaping of all user content, siteverify behind
a 10s timeout with hostname and action pinning in production, and generic client-facing
error text with the specifics logged server-side.

Errors: 400 with field-level messages on validation failure, 403 on Turnstile failure,
500 with a generic message on send failure. User input is never echoed back unescaped.

## Delivery and security

`public/_headers` sets a CSP restricted to self plus `challenges.cloudflare.com` and
Cloudflare Insights, HSTS, `frame-ancestors 'none'`, `nosniff`, and a Permissions-Policy
lockdown. `style-src` allows `'unsafe-inline'` — effectively required by Astro's scoped
`<style>` output, and the accepted tradeoff.

## Social preview

`scripts/generate-og-image.mjs` builds `public/og-image.svg` from the same ASCII source as
the homepage portrait, laid out as a terminal window card. The committed
`public/og-image.png` is rendered from that SVG for crawlers that will not take vector.
Regenerate the SVG whenever the ASCII art changes, then re-render the PNG.

## Testing and verification

- Vitest over the contact library — validation paths, HTML escaping, and the full
  endpoint flow with Turnstile mocked, including the no-JS redirect path.
- `astro check` and `wrangler types --check` via `npm run check`.
- `npm run build` as the final gate.
- No E2E suite.

## Deployment

GitHub Actions on push to `main`: install, write a placeholder `.dev.vars` so
`wrangler types` can emit a complete `Env`, then types, test, check, and build. A gated
job runs `wrangler deploy` with the API token from repository secrets. Pull requests run
the test job only, and the deploy job is gated on both the event type and the branch, so
a pull request from a fork cannot deploy or reach repository secrets.

Two Worker secrets exist in production: `TURNSTILE_SECRET_KEY`, and `CONTACT_TO` — the
destination address is a secret rather than a plain var purely so it is not scraped out
of a public repo. Both are mirrored by name in a gitignored `.dev.vars` locally.
Turnstile sitekeys are public and switch between the test key and the live widget key on
`import.meta.env.DEV`.

## Known characteristics

Featured-project links on the homepage all point at `/projects/`. There are no
per-project detail routes, and that is intentional for now, not an oversight.

## Out of scope

- Light theme or theme toggle
- View counters, comments, GitHub API integration
- CMS or admin UI
- Per-project detail pages
- `vanslyke.ai` → `jvs.sh` redirect (trivial to add later)

---

Supersedes the original design spec (commit `d7e25d4`) and implementation plan (commit
`d7cf2cb`), both removed from the working tree once the site shipped.
