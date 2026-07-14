/// <reference types="astro/client" />

// Note: @astrojs/cloudflare 14 (Astro 6+) removed the generic `Runtime<Env>`
// locals shape — `Astro.locals.runtime.env` throws at runtime now. Env
// bindings are accessed via `import { env } from 'cloudflare:workers'`
// instead (see src/pages/api/contact.ts). `Runtime` here is just the
// `{ cfContext: ExecutionContext }` shape Astro still puts on locals.
type Runtime = import('@astrojs/cloudflare').Runtime;

declare namespace App {
  interface Locals extends Runtime {}
}
