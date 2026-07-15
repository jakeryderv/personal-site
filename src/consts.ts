export const SITE_TITLE = 'jvs.sh';
export const SITE_DESCRIPTION = 'Jake Van Slyke — projects and writing';
export const GITHUB_URL = 'https://github.com/jakeryderv';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/jakeryderv/';

// Turnstile sitekeys are public (not secrets). Dev uses Cloudflare's documented always-pass test key so localhost works; prod uses the real widget key.
export const TURNSTILE_SITEKEY = import.meta.env.DEV
  ? '1x00000000000000000000AA'
  : '0x4AAAAAAD1-XnGWpiytQqHA';
