# Design: jvs.sh — Personal Portfolio Site

**Date:** 2026-07-14
**Status:** Approved

## Purpose

Professional online presence and portfolio for Jake Van Slyke: info/about, projects showcase, with a markdown blog as a secondary feature. Primary audience is anyone evaluating Jake professionally; the site should read as polished, fast, and technically tasteful.

## Decisions (from brainstorming)

- **Domain:** `jvs.sh` (canonical). `vanslyke.ai` stays parked; may 301 to jvs.sh later.
- **Stack:** Astro 5 on Cloudflare Workers via `@astrojs/cloudflare` adapter.
- **Authoring:** Markdown files in the repo; `git push` + deploy to publish. No CMS, no admin UI.
- **Dynamic features:** Contact form only (v1). View counters, GitHub activity, etc. deferred.
- **Style:** Dark-only terminal aesthetic — carbonfox colorscheme, 0xProto Nerd Font (self-hosted).

## Architecture

Every page is pre-rendered to static HTML at build time and served from Cloudflare's edge. The single server-rendered route is `POST /api/contact`, which runs as Worker code. Deployment is `wrangler deploy`; the Worker binds to the `jvs.sh` custom domain.

Cloudflare account facts: account ID `d4e3fe7d69a3ac8f446d4c3de2ca051b`, OAuth wrangler login working, both domains active on free plan. R2 is not enabled (not needed for this design).

## Pages & Content

| Route | Type | Content |
|-------|------|---------|
| `/` | static | Name, one-line identity, short intro, links (GitHub, LinkedIn, contact), teaser of selected projects and recent posts |
| `/projects` | static | Portfolio grid from `projects` content collection |
| `/about` | static | Longer bio, skills, experience |
| `/blog` | static | Post index from `blog` content collection |
| `/blog/[slug]` | static | Individual posts, Shiki syntax highlighting with a carbonfox-matching theme |
| `/rss.xml` | static | RSS feed for the blog |
| `/contact` | static page + server endpoint | Form (name, email, message) posting to `/api/contact` |

Content collections:

- **`projects`**: frontmatter — title, description, tech tags, links (repo/live), optional image, sort order/featured flag.
- **`blog`**: frontmatter — title, date, description, tags, draft flag.

Both collections use Astro content-collection schemas (zod) so malformed frontmatter fails the build rather than shipping.

## Design System

- **Colors:** carbonfox palette as CSS custom properties in a single file (near-black `#161616` background, soft-white foreground, carbonfox blue/teal/magenta accents). Verify exact hex values against the nightfox.nvim carbonfox palette during implementation.
- **Typography:** 0xProto Nerd Font self-hosted as woff2 subsets; monospace throughout. Body ~15–16px with generous line-height. No third-party font CDN.
- **Terminal flourishes (restrained):** `$`-style prompt motif in headings/nav, blinking cursor on the homepage tagline, Nerd Font glyphs as icons. No icon library, no heavy animation.
- **JavaScript budget:** zero client-side JS on every page except the contact form's submit handler.

## Contact Form

- `POST /api/contact` — Astro server endpoint running on the Worker.
- Validates name/email/message server-side.
- Sends the message to Jake's inbox (jakervanslyke@gmail.com) via a **Cloudflare Email Sending binding** (no third-party email service).
- Spam protection via **Cloudflare Turnstile** (account token already has `challenge-widgets.write` to create the widget).
- Progressive enhancement: works as a plain HTML POST when JS is disabled; with JS, inline success/error states.
- Setup dependency: one-time Email Sending DNS records on jvs.sh authorizing Cloudflare to send from the domain.

## Error Handling

- Contact endpoint: 400 with field-level messages on validation failure, 403 on Turnstile failure, 500 with a generic message (details logged) on send failure. Never echo user input back unescaped.
- Custom 404 page in the site's style.
- Build fails on schema-invalid content — that is the intended safety net for authoring mistakes.

## Testing & Verification

- Vitest for contact endpoint logic (validation paths; Turnstile verification mocked).
- `astro check` and `wrangler types --check` as part of the build.
- Manual `wrangler dev` pass before deploys.
- No E2E suite in v1.

## Build Order

1. Scaffold Astro + Cloudflare adapter; deploy skeleton to jvs.sh (live on day one).
2. Design system: carbonfox tokens, 0xProto fonts, base layout/nav.
3. Static pages: home, about, projects (+ collection).
4. Blog: collection, index, post layout, RSS.
5. Contact form: Turnstile widget, Email Sending DNS setup, endpoint + tests.

## Out of Scope (v1)

- Light theme / theme toggle
- View counters, comments, GitHub API integration
- CMS or admin UI
- vanslyke.ai redirect (trivial to add later)
