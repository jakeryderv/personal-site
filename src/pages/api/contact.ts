export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { composeEmail, validateContact } from '../../lib/contact';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const POST: APIRoute = async ({ request, redirect }) => {
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

  const token = String(form.get('cf-turnstile-response') ?? '');
  let verdict: { success: boolean };
  try {
    const verifyRes = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get('cf-connecting-ip') ?? undefined,
      }),
    });
    verdict = (await verifyRes.json()) as { success: boolean };
  } catch {
    return respond(403, { ok: false, errors: { form: 'Bot check failed — please retry.' } }, '/contact?status=blocked');
  }
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
