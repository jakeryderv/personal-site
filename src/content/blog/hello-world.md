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
