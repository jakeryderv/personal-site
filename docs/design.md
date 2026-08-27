# jvs.sh — Design

Current-state design notes for the site. Describes what exists and why, not a build plan.

## Purpose

Professional online presence and portfolio for Jake Van Slyke: about and a projects
showcase. The primary audience is anyone evaluating
Jake professionally; the site should read as polished, fast, and technically tasteful.

## Stack and architecture

Astro 7 on Cloudflare Workers via `@astrojs/cloudflare` 14. Every page is prerendered to
static HTML at build time and served from Cloudflare's edge through the `ASSETS` binding.
There is no server-rendered route — the Worker serves static assets and nothing else.

Authoring is markdown in the repo — `git push` publishes. No CMS, no admin UI.

The domain `jvs.sh` is canonical, bound as a custom domain route with `workers_dev`
disabled. `vanslyke.ai` stays parked and may 301 here later.

## Pages and content

| Route | Type | Content |
|-------|------|---------|
| `/` | static | Name, identity line, links, ASCII portrait, featured-project teasers |
| `/projects/` | static | Portfolio grid from the `projects` collection |
| `/about/` | static | Bio, skills, education |
| `/contact/` | static | Email address and profile links |
| `/404` | static | Custom 404 in site style |

Content collections use Zod schemas, so malformed frontmatter fails the build rather than
shipping:

- **`projects`** — title, description, tech tags, optional repo/live links, featured flag,
  sort order.

Markdown bodies render through Shiki with `theme: 'css-variables'`, themed by the
`--astro-code-*` tokens in `src/styles/tokens.css`. No project write-up currently contains
a code block; the config stays so that adding one renders in the site palette rather than
Shiki's default light theme.

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
- **JavaScript budget**: zero client-side JS. No page ships a `<script>` tag and no
  third-party script is embedded.

## Contact

`/contact/` is a static page listing `contact@jvs.sh` as a `mailto:` link alongside the
GitHub and LinkedIn profiles. The address is a Cloudflare Email Routing alias forwarding
to Jake's personal inbox, so the real address is never published and the alias can be
retired if it attracts spam.

This replaced a Worker-backed form (Turnstile + Cloudflare Email Sending) in August 2026.
The form worked, but it was the site's only server route, only client-side JavaScript,
only third-party embed, and only reason the account needed a paid Workers plan — a large
surface for a personal site whose contact volume is a handful of messages a year.

## Delivery and security

`public/_headers` sets a CSP restricted to `'self'`, HSTS, `frame-ancestors 'none'`,
`nosniff`, and a Permissions-Policy lockdown. Because the site ships no JavaScript, the
policy sets `script-src 'none'`, `frame-src 'none'`, and `form-action 'none'` outright.
`style-src` allows `'unsafe-inline'` — effectively required by Astro's scoped `<style>`
output, and the accepted tradeoff.

## Social preview

`scripts/generate-og-image.mjs` builds `public/og-image.svg` from the same ASCII source as
the homepage portrait, laid out as a terminal window card. The committed
`public/og-image.png` is rendered from that SVG for crawlers that will not take vector.
Regenerate the SVG whenever the ASCII art changes, then re-render the PNG.

## Testing and verification

- Vitest over `src/lib/projects.ts` — featured filtering and sort ordering. Pure logic is
  kept in modules free of `astro:*` imports so it tests without the Astro runtime.
- `astro check` and `wrangler types --check` via `npm run check`.
- `npm run build` as the final gate.
- No E2E suite.

## Deployment

GitHub Actions on push to `main`: install, then types, test, check, and build. A gated
job runs `wrangler deploy` with the API token from repository secrets. Pull requests run
the test job only, and the deploy job is gated on both the event type and the branch, so
a pull request from a fork cannot deploy or reach repository secrets.

No Worker secrets or `.dev.vars` are needed — the site has no runtime configuration.

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
