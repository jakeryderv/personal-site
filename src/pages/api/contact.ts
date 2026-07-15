export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { handleContactRequest, TURNSTILE_ACTION } from '../../lib/contact-endpoint';

export const POST: APIRoute = async ({ request, redirect }) => {
  return handleContactRequest(request, (location) => redirect(location, 303), {
    turnstileSecret: env.TURNSTILE_SECRET_KEY,
    contactTo: env.CONTACT_TO,
    expectedHostname: import.meta.env.DEV ? undefined : 'jvs.sh',
    expectedAction: import.meta.env.DEV ? undefined : TURNSTILE_ACTION,
    sendEmail: async (message) => {
      await env.EMAIL.send(message);
    },
    log: (level, event) => console[level](JSON.stringify(event)),
  });
};
