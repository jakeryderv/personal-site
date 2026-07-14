# jvs.sh Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Jake Van Slyke's portfolio site (projects + about + markdown blog + Turnstile-protected contact form) to Cloudflare Workers at jvs.sh.

**Architecture:** Astro (latest, v6.x at plan time) with the `@astrojs/cloudflare` adapter. Every page is prerendered static HTML served from Cloudflare's edge; the single on-demand route is `POST /api/contact`, which runs as Worker code and sends email via a Cloudflare Email Sending binding. Content lives in typed Astro content collections (markdown in the repo).

**Tech Stack:** Astro, TypeScript, Cloudflare Workers (wrangler 4.110+), Cloudflare Email Sending (`send_email` binding), Cloudflare Turnstile, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-14-personal-site-design.md` (spec says "Astro 5"; latest stable is now v6 — use latest).

## Global Constraints

- Domain: `jvs.sh` (canonical). Account ID `d4e3fe7d69a3ac8f446d4c3de2ca051b`. Contact destination: `jakervanslyke@gmail.com`.
- Dark-only carbonfox palette; exact hex values are defined once in `src/styles/tokens.css` (Task 2) — never hardcode colors elsewhere; always use the CSS variables.
- Typography: 0xProto Nerd Font, self-hosted woff2 subsets in `public/fonts/`. No third-party font/CDN requests anywhere.
- Zero client-side JavaScript on every page except `/contact` (form enhancement + Turnstile script).
- All commands run from the repo root: `/home/jake/dev/projects/personal-site`.
- Commit at the end of every task (plus intermediate commits where marked). Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Never print or commit the Turnstile secret. `.dev.vars` is gitignored.

## Open Inputs (Jake-supplied content — sample copy ships first)

The plan ships with clearly-marked sample copy that Jake will edit later by changing markdown/Astro files. Real values already known: GitHub is `https://github.com/jakeryderv`. LinkedIn URL, bio text, and real project entries are Jake's to fill in — the structure this plan builds is the deliverable.

---

### Task 1: Scaffold Astro + Cloudflare and deploy a skeleton to jvs.sh

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `wrangler.jsonc`, `.gitignore`, `src/pages/index.astro`, `public/.assetsignore`

**Interfaces:**
- Produces: a deployable Astro project; `npm run build` → `dist/`; `npm run deploy` → live at `https://jvs.sh`. Later tasks add pages under `src/pages/` and rely on scripts `dev`, `build`, `deploy`, `test`, `check`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "jvs-sh",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro build && wrangler dev",
    "deploy": "astro build && wrangler deploy",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Install dependencies (latest versions)**

Run: `npm install astro @astrojs/cloudflare @astrojs/rss && npm install -D wrangler @astrojs/check typescript vitest`
Expected: exit 0; `package.json` gains dependencies (astro ^6.x, @astrojs/cloudflare, wrangler ^4.x).

- [ ] **Step 3: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://jvs.sh',
  adapter: cloudflare(),
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
});
```

(Output stays `static` — the default. Only routes that set `export const prerender = false` render on demand.)

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*", "worker-configuration.d.ts"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Write `wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jvs-sh",
  "main": "dist/_worker.js/index.js",
  "compatibility_date": "2026-07-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  "observability": { "enabled": true },
  "workers_dev": false,
  "routes": [{ "pattern": "jvs.sh", "custom_domain": true }]
}
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
.astro/
.wrangler/
.dev.vars
worker-configuration.d.ts
```

- [ ] **Step 7: Write `public/.assetsignore`**

```
_worker.js
_routes.json
```

(Prevents the compiled Worker bundle from also being uploaded as a public static asset.)

- [ ] **Step 8: Write skeleton `src/pages/index.astro`**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>jvs.sh</title>
  </head>
  <body>
    <h1>jvs.sh — under construction</h1>
  </body>
</html>
```

- [ ] **Step 9: Build**

Run: `npm run build`
Expected: exit 0; `dist/index.html` and `dist/_worker.js/index.js` exist. Verify: `ls dist/index.html dist/_worker.js/index.js`

- [ ] **Step 10: Deploy**

Run: `npx wrangler deploy`
Expected: exit 0; output lists `jvs.sh (custom domain)`. First-time custom-domain cert provisioning can take a few minutes.

- [ ] **Step 11: Verify live**

Run: `curl -s https://jvs.sh | grep 'under construction'`
Expected: prints the h1 line. If it 404s/526s, wait ~2 minutes for cert/DNS and retry (max ~10 min).

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json wrangler.jsonc .gitignore public/.assetsignore src/pages/index.astro
git commit -m "feat: scaffold Astro on Cloudflare Workers, live at jvs.sh

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Design system — fonts, carbonfox tokens, base layout, 404

**Files:**
- Create: `public/fonts/0xproto-regular.woff2`, `public/fonts/0xproto-bold.woff2`, `public/fonts/0xproto-italic.woff2`, `public/fonts/0xproto-icons.woff2` (generated, committed as binaries)
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/consts.ts`, `src/pages/404.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `BaseLayout.astro` with `interface Props { title: string; description?: string }` and a default `<slot />` — every later page wraps content in `<BaseLayout title="..." description="...">`. `src/consts.ts` exports `SITE_TITLE: string`, `SITE_DESCRIPTION: string`, `GITHUB_URL: string`, `TURNSTILE_SITEKEY: string`. CSS variables (`--bg0..--bg4`, `--fg0..--fg3`, `--red --green --yellow --blue --magenta --cyan --orange --pink --white --comment --sel0 --sel1`) available globally. Icon glyphs render via `class="icon"` + HTML entities: GitHub `&#xf09b;`, RSS `&#xf09e;`, envelope `&#xf0e0;`, LinkedIn `&#xf0e1;`.

- [ ] **Step 1: Download 0xProto Nerd Font and build woff2 subsets**

Uses a throwaway venv because system Python has no fonttools (PEP 668 blocks global pip). Text faces are subset to Latin + punctuation (small files); icons get their own 4-glyph face loaded only when used, via `unicode-range`.

```bash
SCRATCH=/tmp/claude-1000/-home-jake-dev-projects-personal-site/909ede3e-1c80-4eb6-ad22-f2c2499f8097/scratchpad
mkdir -p "$SCRATCH/fonts" public/fonts
python3 -m venv "$SCRATCH/fontenv"
"$SCRATCH/fontenv/bin/pip" -q install fonttools brotli
curl -sL -o "$SCRATCH/fonts/0xProto.zip" https://github.com/ryanoasis/nerd-fonts/releases/latest/download/0xProto.zip
unzip -o -q "$SCRATCH/fonts/0xProto.zip" -d "$SCRATCH/fonts"
TEXT_UNICODES="U+0000-00FF,U+2010-2027,U+2030-205E,U+20AC,U+2190-21FF,U+2500-257F,U+25A0-25FF,U+276F,U+FB01-FB02"
"$SCRATCH/fontenv/bin/pyftsubset" "$SCRATCH/fonts/0xProtoNerdFont-Regular.ttf" --output-file=public/fonts/0xproto-regular.woff2 --flavor=woff2 --layout-features='*' --unicodes="$TEXT_UNICODES"
"$SCRATCH/fontenv/bin/pyftsubset" "$SCRATCH/fonts/0xProtoNerdFont-Bold.ttf" --output-file=public/fonts/0xproto-bold.woff2 --flavor=woff2 --layout-features='*' --unicodes="$TEXT_UNICODES"
"$SCRATCH/fontenv/bin/pyftsubset" "$SCRATCH/fonts/0xProtoNerdFont-Italic.ttf" --output-file=public/fonts/0xproto-italic.woff2 --flavor=woff2 --layout-features='*' --unicodes="$TEXT_UNICODES"
"$SCRATCH/fontenv/bin/pyftsubset" "$SCRATCH/fonts/0xProtoNerdFont-Regular.ttf" --output-file=public/fonts/0xproto-icons.woff2 --flavor=woff2 --unicodes="U+F09B,U+F09E,U+F0E0,U+F0E1"
ls -lh public/fonts/
```

Expected: four `.woff2` files; text faces roughly 15–40 KB each, icons < 5 KB. If the exact `.ttf` filenames differ, run `ls "$SCRATCH/fonts"/*.ttf` and use the `0xProtoNerdFont-{Regular,Bold,Italic}.ttf` (not `Mono`/`Propo`) names found there.

- [ ] **Step 2: Write `src/styles/tokens.css`** (values verified against `EdenEast/nightfox.nvim` carbonfox palette source)

```css
:root {
  /* carbonfox — https://github.com/EdenEast/nightfox.nvim */
  --bg0: #0c0c0c;
  --bg1: #161616; /* default background */
  --bg2: #252525;
  --bg3: #353535;
  --bg4: #535353;
  --fg0: #f9fbff;
  --fg1: #f2f4f8; /* default foreground */
  --fg2: #b6b8bb;
  --fg3: #7b7c7e;
  --sel0: #2a2a2a;
  --sel1: #525253;
  --comment: #6e6f70;
  --red: #ee5396;
  --green: #25be6a;
  --yellow: #08bdba;
  --blue: #78a9ff;
  --magenta: #be95ff;
  --cyan: #33b1ff;
  --orange: #3ddbd9;
  --pink: #ff7eb6;
  --white: #dfdfe0;

  /* Shiki (shikiConfig theme: 'css-variables') */
  --astro-code-foreground: var(--fg1);
  --astro-code-background: var(--bg0);
  --astro-code-token-constant: var(--orange);
  --astro-code-token-string: var(--green);
  --astro-code-token-comment: var(--comment);
  --astro-code-token-keyword: var(--magenta);
  --astro-code-token-parameter: var(--cyan);
  --astro-code-token-function: var(--blue);
  --astro-code-token-string-expression: var(--green);
  --astro-code-token-punctuation: var(--fg2);
  --astro-code-token-link: var(--cyan);
}
```

- [ ] **Step 3: Write `src/styles/global.css`**

```css
@import './tokens.css';

@font-face {
  font-family: '0xProto';
  src: url('/fonts/0xproto-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: '0xProto';
  src: url('/fonts/0xproto-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: '0xProto';
  src: url('/fonts/0xproto-italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: '0xProto Icons';
  src: url('/fonts/0xproto-icons.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+E000-F8FF;
}

* { box-sizing: border-box; margin: 0; }

html { color-scheme: dark; }

body {
  background: var(--bg1);
  color: var(--fg1);
  font-family: '0xProto', '0xProto Icons', ui-monospace, monospace;
  font-size: 15px;
  line-height: 1.7;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  width: min(72ch, 100% - 2rem);
  margin-inline: auto;
  padding-block: 2rem;
}

h1, h2, h3 { line-height: 1.3; color: var(--fg0); margin-block: 1.5rem 0.75rem; }
h1::before, h2::before { content: '\276F '; color: var(--green); }

a { color: var(--blue); text-decoration-color: var(--bg4); text-underline-offset: 3px; }
a:hover { color: var(--cyan); }

p { margin-block: 0.75rem; }
ul, ol { padding-inline-start: 1.5rem; }

code {
  background: var(--bg2);
  padding: 0.1em 0.35em;
  border-radius: 4px;
  font-size: 0.95em;
}
pre {
  background: var(--astro-code-background);
  border: 1px solid var(--bg3);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin-block: 1rem;
}
pre code { background: none; padding: 0; }

header nav {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  width: min(72ch, 100% - 2rem);
  margin-inline: auto;
  padding-block: 1.25rem;
}
.brand { color: var(--green); text-decoration: none; font-weight: 700; }
.brand .path { color: var(--fg3); font-weight: 400; }
header nav ul { display: flex; gap: 1.25rem; list-style: none; padding: 0; margin-left: auto; }
header nav a[aria-current='page'] { color: var(--pink); }

footer {
  display: flex;
  gap: 1rem;
  align-items: center;
  width: min(72ch, 100% - 2rem);
  margin-inline: auto;
  padding-block: 1.5rem;
  color: var(--fg3);
  border-top: 1px solid var(--bg2);
}
footer .copyright { margin-left: auto; font-size: 0.85em; }
footer a { color: var(--fg3); text-decoration: none; }
footer a:hover { color: var(--cyan); }
.icon { font-family: '0xProto Icons', '0xProto', monospace; }

.cursor {
  display: inline-block;
  width: 0.6em;
  height: 1.1em;
  background: var(--green);
  vertical-align: text-bottom;
  animation: blink 1.1s steps(1) infinite;
}
@keyframes blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .cursor { animation: none; } }

time { color: var(--fg3); }
```

- [ ] **Step 4: Write `src/consts.ts`**

```ts
export const SITE_TITLE = 'jvs.sh';
export const SITE_DESCRIPTION = 'Jake Van Slyke — projects and writing';
export const GITHUB_URL = 'https://github.com/jakeryderv';

// Turnstile sitekeys are public (not secrets). The DEV key is Cloudflare's
// documented always-pass test key so `astro dev` works on localhost.
// The production value is set in Task 7 Step 2 — until then the test key
// is used everywhere, which is fine because /contact ships in Task 7.
export const TURNSTILE_SITEKEY = import.meta.env.DEV
  ? '1x00000000000000000000AA'
  : '1x00000000000000000000AA';
```

- [ ] **Step 5: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import { GITHUB_URL, SITE_DESCRIPTION, SITE_TITLE } from '../consts';

interface Props {
  title: string;
  description?: string;
}

const { title, description = SITE_DESCRIPTION } = Astro.props;
const pageTitle = title === SITE_TITLE ? title : `${title} · ${SITE_TITLE}`;
const current = Astro.url.pathname;
const nav = [
  { href: '/projects', label: 'projects' },
  { href: '/blog', label: 'blog' },
  { href: '/about', label: 'about' },
  { href: '/contact', label: 'contact' },
];
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="/rss.xml" />
    <link rel="preload" href="/fonts/0xproto-regular.woff2" as="font" type="font/woff2" crossorigin />
  </head>
  <body>
    <header>
      <nav>
        <a class="brand" href="/">jake@jvs.sh<span class="path">:~$</span></a>
        <ul>
          {nav.map(({ href, label }) => (
            <li>
              <a href={href} aria-current={current.startsWith(href) ? 'page' : undefined}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
    <main><slot /></main>
    <footer>
      <a href={GITHUB_URL} aria-label="GitHub"><span class="icon">&#xf09b;</span> github</a>
      <a href="/contact" aria-label="Contact"><span class="icon">&#xf0e0;</span> contact</a>
      <a href="/rss.xml" aria-label="RSS feed"><span class="icon">&#xf09e;</span> rss</a>
      <span class="copyright">© 2026 Jake Van Slyke</span>
    </footer>
  </body>
</html>
```

- [ ] **Step 6: Write `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="404">
  <h1>404: no such file or directory</h1>
  <p>That page doesn't exist. <a href="/">cd ~</a></p>
</BaseLayout>
```

- [ ] **Step 7: Rewrite `src/pages/index.astro` to use the layout (interim — full home page ships in Task 5)**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { SITE_TITLE } from '../consts';
---

<BaseLayout title={SITE_TITLE}>
  <p class="ps1">jake@jvs.sh:~$ whoami</p>
  <h1>Jake Van Slyke</h1>
  <p>Site under construction.<span class="cursor"></span></p>
</BaseLayout>
<style>
  .ps1 { color: var(--fg3); }
  h1::before { content: none; }
</style>
```

- [ ] **Step 8: Verify in dev**

Run: `npm run dev` in the background, then `curl -s http://localhost:4321/ | grep -c 'jake@jvs.sh'` and `curl -s http://localhost:4321/definitely-missing | grep '404: no such file'`
Expected: first prints `2` (nav brand + ps1 line contains one each — any count ≥ 1 passes), second prints the 404 heading. Also load http://localhost:4321/ in a browser if available: dark carbonfox background, 0xProto rendering, blinking green cursor, glyph icons visible in the footer. Stop the dev server after.

- [ ] **Step 9: Build check**

Run: `npm run check && npm run build`
Expected: 0 errors; build exits 0.

- [ ] **Step 10: Commit**

```bash
git add public/fonts src/styles src/layouts src/consts.ts src/pages/404.astro src/pages/index.astro
git commit -m "feat: carbonfox design system, 0xProto fonts, base layout, 404

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Projects collection and /projects page

**Files:**
- Create: `src/content.config.ts`, `src/content/projects/personal-site.md`, `src/components/ProjectCard.astro`, `src/pages/projects.astro`

**Interfaces:**
- Consumes: `BaseLayout.astro` (Task 2).
- Produces: `projects` collection with schema `{ title: string, description: string, tech: string[], repo?: url, live?: url, featured: boolean (default false), order: number (default 99) }`. Task 5's home page calls `getCollection('projects', ({ data }) => data.featured)`. `ProjectCard.astro` takes `Props { project: CollectionEntry<'projects'> }`.

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    repo: z.string().url().optional(),
    live: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
  }),
});

export const collections = { projects };
```

- [ ] **Step 2: Write sample entry `src/content/projects/personal-site.md`** (real project — this site)

```md
---
title: jvs.sh
description: This site — Astro on Cloudflare Workers, carbonfox-themed, with a Worker-powered contact form.
tech: [Astro, TypeScript, Cloudflare Workers]
live: https://jvs.sh
featured: true
order: 1
---

Static-first Astro site deployed to Cloudflare Workers. Markdown content
collections, self-hosted 0xProto Nerd Font, and a single server endpoint
that sends contact-form email through Cloudflare Email Sending.
```

- [ ] **Step 3: Write `src/components/ProjectCard.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  project: CollectionEntry<'projects'>;
}

const { project } = Astro.props;
const { title, description, tech, repo, live } = project.data;
---

<article class="card">
  <h2>{title}</h2>
  <p>{description}</p>
  <ul class="tech">
    {tech.map((t) => <li>{t}</li>)}
  </ul>
  <div class="links">
    {repo && <a href={repo}><span class="icon">&#xf09b;</span> repo</a>}
    {live && <a href={live}>live ↗</a>}
  </div>
</article>

<style>
  .card {
    border: 1px solid var(--bg3);
    border-radius: 6px;
    background: var(--bg0);
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
  }
  .card h2 { font-size: 1.1rem; margin-block: 0 0.5rem; }
  .card h2::before { content: '/'; color: var(--magenta); }
  .card p { margin-block: 0; color: var(--fg2); flex: 1; }
  .tech {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin-block: 0.75rem;
  }
  .tech li {
    font-size: 0.8em;
    color: var(--yellow);
    background: var(--bg2);
    padding: 0.1em 0.6em;
    border-radius: 999px;
  }
  .links { display: flex; gap: 1.25rem; }
</style>
```

- [ ] **Step 4: Write `src/pages/projects.astro`**

```astro
---
import { getCollection } from 'astro:content';
import ProjectCard from '../components/ProjectCard.astro';
import BaseLayout from '../layouts/BaseLayout.astro';

const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
---

<BaseLayout title="projects" description="Projects by Jake Van Slyke">
  <h1>projects</h1>
  <div class="grid">
    {projects.map((project) => <ProjectCard project={project} />)}
  </div>
</BaseLayout>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: 1rem;
    margin-block: 1rem;
  }
</style>
```

- [ ] **Step 5: Verify schema enforcement (the safety net works)**

Temporarily add a bad file, expect the build to FAIL, then remove it:

```bash
printf -- '---\ntitle: broken\n---\nno description\n' > src/content/projects/broken.md
npm run build; echo "exit: $?"
rm src/content/projects/broken.md
```

Expected: build fails with a zod/content-collection error naming `description`. Exit code non-zero.

- [ ] **Step 6: Verify the page builds**

Run: `npm run build && grep -o 'jvs.sh' dist/projects/index.html | head -1`
Expected: build exits 0; grep prints `jvs.sh`.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/content/projects src/components/ProjectCard.astro src/pages/projects.astro
git commit -m "feat: projects content collection and /projects page

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Blog collection, index, post pages, RSS

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/blog/hello-world.md`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/rss.xml.js`

**Interfaces:**
- Consumes: `BaseLayout.astro`; `collections` export from `src/content.config.ts` (Task 3).
- Produces: `blog` collection with schema `{ title: string, date: Date, description: string, tags: string[] (default []), draft: boolean (default false) }`. Post URLs are `/blog/<id>/` where `<id>` is the filename without extension. Task 5's home page calls `getCollection('blog', ({ data }) => !data.draft)`.

- [ ] **Step 1: Add the blog collection to `src/content.config.ts`** (full new file contents)

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    repo: z.string().url().optional(),
    live: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, blog };
```

- [ ] **Step 2: Write first post `src/content/blog/hello-world.md`** (includes a code fence to prove syntax highlighting)

````md
---
title: Hello, world
date: 2026-07-14
description: First post — how this site is built.
tags: [meta]
---

This site is built with [Astro](https://astro.build) and deployed to
Cloudflare Workers. Every page is static except one endpoint that powers
the contact form.

```ts
export function greet(name: string): string {
  return `hello, ${name}`;
}
```

More to come.
````

- [ ] **Step 3: Write `src/pages/blog/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
);
---

<BaseLayout title="blog" description="Writing by Jake Van Slyke">
  <h1>blog</h1>
  <ul class="posts">
    {posts.map((post) => (
      <li>
        <time datetime={post.data.date.toISOString()}>{post.data.date.toISOString().slice(0, 10)}</time>
        <a href={`/blog/${post.id}/`}>{post.data.title}</a>
        <p>{post.data.description}</p>
      </li>
    ))}
  </ul>
</BaseLayout>

<style>
  .posts { list-style: none; padding: 0; display: grid; gap: 1.25rem; margin-block: 1rem; }
  .posts time { font-size: 0.9em; margin-right: 0.75rem; }
  .posts p { margin-block: 0.25rem; color: var(--fg2); }
</style>
```

- [ ] **Step 4: Write `src/pages/blog/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article>
    <h1>{post.data.title}</h1>
    <p class="meta">
      <time datetime={post.data.date.toISOString()}>{post.data.date.toISOString().slice(0, 10)}</time>
      {post.data.tags.map((tag) => <span class="tag">#{tag}</span>)}
    </p>
    <Content />
  </article>
</BaseLayout>

<style>
  .meta { display: flex; gap: 0.75rem; align-items: baseline; color: var(--fg3); }
  .tag { color: var(--yellow); font-size: 0.9em; }
</style>
```

- [ ] **Step 5: Write `src/pages/rss.xml.js`**

```js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description,
        link: `/blog/${post.id}/`,
      })),
  });
}
```

- [ ] **Step 6: Verify build output**

```bash
npm run build
grep -o '<span[^>]*>hello</span>\|style="[^"]*--astro-code' dist/blog/hello-world/index.html | head -2
grep -o '<title>Hello, world</title>' dist/rss.xml
```

Expected: build exits 0; first grep shows Shiki emitted spans styled with `--astro-code` variables (exact markup may vary — any hit containing `astro-code` passes); second grep prints the RSS item title. Also verify `dist/blog/index.html` exists.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/content/blog src/pages/blog src/pages/rss.xml.js
git commit -m "feat: markdown blog with carbonfox syntax highlighting and RSS

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Home page

**Files:**
- Modify: `src/pages/index.astro` (full replacement)

**Interfaces:**
- Consumes: `BaseLayout.astro`; `projects` and `blog` collections (Tasks 3–4); `GITHUB_URL`, `SITE_TITLE` from `src/consts.ts`.

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import { GITHUB_URL, SITE_TITLE } from '../consts';

const projects = (await getCollection('projects', ({ data }) => data.featured))
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, 3);
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 3);
---

<BaseLayout title={SITE_TITLE}>
  <section class="hero">
    <p class="ps1">jake@jvs.sh:~$ whoami</p>
    <h1 class="name">Jake Van Slyke</h1>
    <p class="tagline">
      software engineer — I build things and occasionally write about them.<span class="cursor"></span>
    </p>
    <p class="links">
      <a href={GITHUB_URL}><span class="icon">&#xf09b;</span> github</a>
      <a href="/contact"><span class="icon">&#xf0e0;</span> contact</a>
      <a href="/rss.xml"><span class="icon">&#xf09e;</span> rss</a>
    </p>
  </section>

  <section>
    <h2>featured projects</h2>
    <ul>
      {projects.map((project) => (
        <li>
          <a href="/projects">{project.data.title}</a> — {project.data.description}
        </li>
      ))}
    </ul>
  </section>

  <section>
    <h2>recent posts</h2>
    <ul>
      {posts.map((post) => (
        <li>
          <time datetime={post.data.date.toISOString()}>{post.data.date.toISOString().slice(0, 10)}</time>
          {' '}
          <a href={`/blog/${post.id}/`}>{post.data.title}</a>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>

<style>
  .hero { margin-block: 2rem 3rem; }
  .ps1 { color: var(--fg3); }
  .name { margin-block: 0.25rem; }
  .name::before { content: none; }
  .tagline { color: var(--fg2); }
  .links { display: flex; gap: 1.5rem; margin-top: 1rem; }
  section ul { display: grid; gap: 0.4rem; }
</style>
```

(The tagline is sample copy — Jake edits this line to taste.)

- [ ] **Step 2: Verify**

Run: `npm run build && grep -o 'Jake Van Slyke' dist/index.html | head -1 && grep -o 'Hello, world' dist/index.html`
Expected: both greps print their string — the hero renders and the recent-posts teaser picked up the Task 4 post.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: home page with hero, featured projects, recent posts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: About page

**Files:**
- Create: `src/pages/about.astro`

**Interfaces:**
- Consumes: `BaseLayout.astro`, `GITHUB_URL`.

- [ ] **Step 1: Write `src/pages/about.astro`** (structure is the deliverable; body copy is sample text Jake replaces)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { GITHUB_URL } from '../consts';
---

<BaseLayout title="about" description="About Jake Van Slyke">
  <h1>about</h1>

  <p>
    Hi — I'm Jake, a software engineer. This is my corner of the internet:
    projects I've built, things I've learned, and ways to reach me.
    <em>(Sample copy — replace with your own bio.)</em>
  </p>

  <h2>skills</h2>
  <ul class="skills">
    <li>TypeScript / JavaScript</li>
    <li>Python</li>
    <li>Cloud infrastructure</li>
    <li><em>(edit this list)</em></li>
  </ul>

  <h2>experience</h2>
  <p>
    <em>(Sample copy — add roles, dates, and highlights here, or link a resume PDF
    dropped into <code>public/</code>.)</em>
  </p>

  <h2>elsewhere</h2>
  <p>
    <a href={GITHUB_URL}><span class="icon">&#xf09b;</span> github</a> ·
    <a href="/contact"><span class="icon">&#xf0e0;</span> contact form</a>
  </p>
</BaseLayout>

<style>
  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
  }
  .skills li {
    color: var(--yellow);
    background: var(--bg2);
    padding: 0.1em 0.6em;
    border-radius: 999px;
    font-size: 0.9em;
  }
</style>
```

- [ ] **Step 2: Verify**

Run: `npm run build && grep -o '<h1[^>]*>about</h1>\|>about<' dist/about/index.html | head -1`
Expected: build exits 0 and grep finds the heading.

- [ ] **Step 3: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: about page

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Contact form — Email Sending, Turnstile, endpoint (TDD), page, deploy

**Files:**
- Modify: `wrangler.jsonc`, `src/consts.ts`
- Create: `.dev.vars`, `src/env.d.ts`, `src/lib/contact.ts`, `src/lib/contact.test.ts`, `src/pages/api/contact.ts`, `src/pages/contact.astro`, `src/pages/contact/sent.astro`

**Interfaces:**
- Consumes: `BaseLayout.astro`, `TURNSTILE_SITEKEY` from consts.
- Produces: `validateContact(fields: ContactFields): FieldErrors`, `escapeHtml(s: string): string`, `composeEmail(fields: ContactFields): { subject: string; text: string; html: string }` where `ContactFields = { name: string; email: string; message: string }` and `FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>`. Endpoint `POST /api/contact`: with `Accept: application/json` returns `{ ok: boolean, errors?: Record<string, string> }` (200/400/403/500); otherwise 303-redirects to `/contact/sent` on success or `/contact?status=invalid|blocked|error` on failure.

- [ ] **Step 1: Enable Email Sending for jvs.sh**

Run: `npx wrangler email sending enable jvs.sh`
Expected: exit 0; SPF/DKIM DNS records are added automatically (the zone is on this account).
Then run: `npx wrangler email sending dns get jvs.sh`
Expected: lists the sending DNS records. If records show as pending, DNS usually settles within 5–15 minutes — continue with the next steps and re-check before Step 12.

- [ ] **Step 2: Create the Turnstile widget and store the secret**

The sitekey is public; the secret goes straight into a Worker secret and is never printed. Uses the wrangler OAuth token (has `challenge-widgets.write`).

```bash
TOKEN=$(grep -oP 'oauth_token = "\K[^"]+' ~/.config/.wrangler/config/default.toml)
RESP=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/d4e3fe7d69a3ac8f446d4c3de2ca051b/challenges/widgets" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data '{"name":"jvs.sh contact","domains":["jvs.sh"],"mode":"managed"}')
echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); r=d.get('result') or {}; print('success:', d.get('success'), 'sitekey:', r.get('sitekey'))"
echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['secret'], end='')" | npx wrangler secret put TURNSTILE_SECRET_KEY
```

Expected: first python prints `success: True sitekey: 0x4AAA...` (note the sitekey — used in Step 4); wrangler confirms the secret was uploaded. Note: `wrangler secret put` on a Worker with no deployed secret-bearing version may ask to confirm creating a new version — accept. If the OAuth token lacks the widget-creation permission (API error 403 or 9109), fall back to creating the widget in the dashboard (Turnstile → Add widget, domain `jvs.sh`, Managed mode) and then run only the `wrangler secret put TURNSTILE_SECRET_KEY` command, pasting the secret at the interactive prompt.

- [ ] **Step 3: Update `wrangler.jsonc`** (full new file contents — adds `send_email` and `vars`)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jvs-sh",
  "main": "dist/_worker.js/index.js",
  "compatibility_date": "2026-07-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  "observability": { "enabled": true },
  "workers_dev": false,
  "routes": [{ "pattern": "jvs.sh", "custom_domain": true }],
  "vars": {
    "CONTACT_TO": "jakervanslyke@gmail.com"
  },
  "send_email": [
    { "name": "EMAIL", "allowed_sender_addresses": ["contact@jvs.sh"] }
  ]
}
```

- [ ] **Step 4: Set the production sitekey in `src/consts.ts`**

Edit only the `TURNSTILE_SITEKEY` constant, substituting the sitekey printed in Step 2:

```ts
export const TURNSTILE_SITEKEY = import.meta.env.DEV
  ? '1x00000000000000000000AA'
  : '<sitekey printed in Step 2>';
```

- [ ] **Step 5: Write `.dev.vars`** (gitignored; Cloudflare's documented always-pass test secret pairs with the DEV sitekey)

```
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
```

- [ ] **Step 6: Generate binding types and wire them into Astro**

Run: `npx wrangler types`
Expected: writes `worker-configuration.d.ts` declaring `interface Env` with `EMAIL: SendEmail`, `CONTACT_TO: string`, and `TURNSTILE_SECRET_KEY: string` (picked up from `.dev.vars`).

Then write `src/env.d.ts`:

```ts
/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
```

Then update the `check` script in `package.json` so binding types are validated from now on (the spec requires `wrangler types --check` in the build):

```json
"check": "astro check && wrangler types --check"
```

- [ ] **Step 7: Write the failing tests `src/lib/contact.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { composeEmail, escapeHtml, validateContact } from './contact';

const valid = { name: 'Ada', email: 'ada@example.com', message: 'Hello there, nice site!' };

describe('validateContact', () => {
  it('accepts valid fields', () => {
    expect(validateContact(valid)).toEqual({});
  });
  it('rejects blank name', () => {
    expect(validateContact({ ...valid, name: '   ' })).toHaveProperty('name');
  });
  it('rejects overlong name', () => {
    expect(validateContact({ ...valid, name: 'x'.repeat(201) })).toHaveProperty('name');
  });
  it('rejects malformed email', () => {
    expect(validateContact({ ...valid, email: 'not-an-email' })).toHaveProperty('email');
  });
  it('rejects too-short message', () => {
    expect(validateContact({ ...valid, message: 'hi' })).toHaveProperty('message');
  });
  it('rejects oversized message', () => {
    expect(validateContact({ ...valid, message: 'x'.repeat(5001) })).toHaveProperty('message');
  });
});

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;',
    );
  });
});

describe('composeEmail', () => {
  it('includes sender and message in subject and text body', () => {
    const { subject, text } = composeEmail(valid);
    expect(subject).toBe('[jvs.sh] Message from Ada');
    expect(text).toContain('Ada <ada@example.com>');
    expect(text).toContain(valid.message);
  });
  it('escapes user content in the html body', () => {
    const { html } = composeEmail({ ...valid, message: '<script>alert(1)</script> hey there friend' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
  it('trims whitespace from fields', () => {
    const { subject } = composeEmail({ ...valid, name: '  Ada  ' });
    expect(subject).toBe('[jvs.sh] Message from Ada');
  });
});
```

- [ ] **Step 8: Run tests to verify they fail**

Run: `npx vitest run src/lib/contact.test.ts`
Expected: FAIL — cannot resolve `./contact`.

- [ ] **Step 9: Write `src/lib/contact.ts`**

```ts
export interface ContactFields {
  name: string;
  email: string;
  message: string;
}

export type FieldErrors = Partial<Record<keyof ContactFields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(fields: ContactFields): FieldErrors {
  const errors: FieldErrors = {};
  const name = fields.name.trim();
  const email = fields.email.trim();
  const message = fields.message.trim();
  if (name.length < 1 || name.length > 200) errors.name = 'Name is required (max 200 characters).';
  if (!EMAIL_RE.test(email) || email.length > 254) errors.email = 'A valid email address is required.';
  if (message.length < 10 || message.length > 5000) errors.message = 'Message must be 10–5000 characters.';
  return errors;
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function composeEmail(fields: ContactFields): { subject: string; text: string; html: string } {
  const name = fields.name.trim();
  const email = fields.email.trim();
  const message = fields.message.trim();
  return {
    subject: `[jvs.sh] Message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html:
      `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>` +
      `<p>${escapeHtml(message).replaceAll('\n', '<br>')}</p>`,
  };
}
```

- [ ] **Step 10: Run tests to verify they pass, then commit**

Run: `npx vitest run src/lib/contact.test.ts`
Expected: all 10 tests PASS.

```bash
git add src/lib/contact.ts src/lib/contact.test.ts
git commit -m "feat: contact validation and email composition (TDD)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 11: Write the endpoint `src/pages/api/contact.ts`**

```ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { composeEmail, validateContact } from '../../lib/contact';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  const respond = (status: number, body: Record<string, unknown>, redirectTo: string) =>
    wantsJson
      ? new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
      : redirect(redirectTo, 303);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond(400, { ok: false, errors: { form: 'Malformed submission.' } }, '/contact?status=error');
  }

  const fields = {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    message: String(form.get('message') ?? ''),
  };
  const errors = validateContact(fields);
  if (Object.keys(errors).length > 0) {
    return respond(400, { ok: false, errors }, '/contact?status=invalid');
  }

  const env = locals.runtime.env;

  const token = String(form.get('cf-turnstile-response') ?? '');
  const verifyRes = await fetch(SITEVERIFY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get('cf-connecting-ip') ?? undefined,
    }),
  });
  const verdict = (await verifyRes.json()) as { success: boolean };
  if (!verdict.success) {
    return respond(
      403,
      { ok: false, errors: { form: 'Bot check failed — please retry.' } },
      '/contact?status=blocked',
    );
  }

  const { subject, text, html } = composeEmail(fields);
  try {
    await env.EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: 'contact@jvs.sh', name: 'jvs.sh contact form' },
      replyTo: fields.email.trim(),
      subject,
      text,
      html,
    });
  } catch (error) {
    const err = error as { code?: string; message?: string };
    console.error('contact send failed', err.code, err.message);
    return respond(
      500,
      { ok: false, errors: { form: 'Something went wrong sending your message. Please try again later.' } },
      '/contact?status=error',
    );
  }

  return respond(200, { ok: true }, '/contact/sent');
};
```

- [ ] **Step 12: Write `src/pages/contact.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { TURNSTILE_SITEKEY } from '../consts';
---

<BaseLayout title="contact" description="Get in touch with Jake Van Slyke">
  <h1>contact</h1>
  <p>Send me a message — it goes straight to my inbox.</p>

  <form method="post" action="/api/contact" id="contact-form">
    <label for="name">name</label>
    <input id="name" name="name" required maxlength="200" autocomplete="name" />

    <label for="email">email</label>
    <input id="email" name="email" type="email" required maxlength="254" autocomplete="email" />

    <label for="message">message</label>
    <textarea id="message" name="message" required minlength="10" maxlength="5000" rows="8"></textarea>

    <div class="cf-turnstile" data-sitekey={TURNSTILE_SITEKEY} data-theme="dark"></div>

    <button type="submit">send</button>
    <p id="form-status" role="status"></p>
  </form>
</BaseLayout>

<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<script>
  const form = document.getElementById('contact-form') as HTMLFormElement;
  const status = document.getElementById('form-status')!;

  const messages: Record<string, string> = {
    sent: 'Message sent — thanks!',
    invalid: 'Please check the fields and try again.',
    blocked: 'Bot check failed — please retry.',
    error: 'Something went wrong — please try again later.',
  };

  // No-JS fallback lands back here with ?status=... (success goes to /contact/sent)
  const initial = new URLSearchParams(location.search).get('status');
  if (initial && messages[initial]) status.textContent = messages[initial];

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'sending…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { accept: 'application/json' },
      });
      const data = (await res.json()) as { ok: boolean; errors?: Record<string, string> };
      if (data.ok) {
        form.reset();
        status.textContent = messages.sent;
      } else {
        status.textContent = Object.values(data.errors ?? {}).join(' ') || messages.error;
      }
    } catch {
      status.textContent = messages.error;
    }
    (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
  });
</script>

<style>
  form { display: grid; gap: 0.5rem; max-width: 40rem; }
  label { color: var(--fg3); margin-top: 0.5rem; }
  label::before { content: '# '; color: var(--comment); }
  input, textarea {
    background: var(--bg0);
    color: var(--fg1);
    border: 1px solid var(--bg3);
    border-radius: 4px;
    padding: 0.6rem 0.75rem;
    font: inherit;
  }
  input:focus, textarea:focus { outline: 1px solid var(--blue); border-color: var(--blue); }
  button {
    justify-self: start;
    margin-top: 0.75rem;
    cursor: pointer;
    background: var(--bg2);
    color: var(--green);
    border: 1px solid var(--bg4);
    border-radius: 4px;
    padding: 0.6rem 1.5rem;
    font: inherit;
    font-weight: 700;
  }
  button:hover { background: var(--sel0); border-color: var(--green); }
  button::after { content: ' ❯'; }
  #form-status { min-height: 1.5em; color: var(--yellow); }
</style>
```

- [ ] **Step 13: Write `src/pages/contact/sent.astro`** (no-JS success page)

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="message sent">
  <h1>message sent</h1>
  <p>Thanks — I'll get back to you soon. <a href="/">cd ~</a></p>
</BaseLayout>
```

- [ ] **Step 14: Type-check and test locally**

Run: `npm run check && npm run test && npm run build`
Expected: 0 type errors, all tests pass, build succeeds and logs `/api/contact` as an on-demand (server) route.

Then run `npx wrangler dev` (serves the built `dist/`), open http://localhost:8787/contact, and submit a real-looking message. The DEV Turnstile test keys auto-pass. Expected: local `send_email` is simulated by wrangler (watch the wrangler dev log for the send; no real email locally). Validation paths: submit a 2-character message → inline error appears without page reload. Stop wrangler dev after.

- [ ] **Step 15: Deploy and verify end-to-end**

```bash
npm run deploy
```

Expected: deploy succeeds and lists the `EMAIL` send_email binding, `CONTACT_TO` var, and `jvs.sh` custom domain.

Then, in a real browser (Turnstile must issue a token — curl can't): visit `https://jvs.sh/contact`, complete the form with a genuine message, submit. Expected: "Message sent — thanks!" appears, and the message arrives at jakervanslyke@gmail.com from `contact@jvs.sh` with reply-to set to the submitted address. If the send fails, run `npx wrangler tail jvs-sh` while re-submitting and check the logged `E_*` error code (`E_SENDER_NOT_VERIFIED` → Step 1 DNS not settled yet; wait and retry).

Also verify the full site in production: `/`, `/projects`, `/blog`, `/blog/hello-world/`, `/about`, `/rss.xml`, and a bogus path returning the styled 404.

- [ ] **Step 16: Commit**

```bash
git add wrangler.jsonc src/consts.ts src/env.d.ts src/pages/api/contact.ts src/pages/contact.astro src/pages/contact
git commit -m "feat: Turnstile-protected contact form via Cloudflare Email Sending

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Post-plan checklist (not tasks — reminders for Jake)

- Replace sample copy: about-page bio/skills/experience, home tagline, and add real project entries under `src/content/projects/`.
- Add the GitHub remote and push (`gh repo create` or existing repo).
- Optional later: 301 vanslyke.ai → jvs.sh; view counters; light theme. All out of scope for v1.
