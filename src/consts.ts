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
