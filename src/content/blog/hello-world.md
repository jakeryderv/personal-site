---
title: Hello, world
date: 2026-07-14
description: First post — how this site is built.
tags: [meta]
---

This site is built with [Astro](https://astro.build) and deployed to
Cloudflare Workers. Every page is prerendered to static HTML at build time —
there is no server-rendered route and no client-side JavaScript.

```ts
export function greet(name: string): string {
  return `hello, ${name}`;
}
```

More to come.
