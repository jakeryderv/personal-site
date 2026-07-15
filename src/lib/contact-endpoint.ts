import { composeEmail, validateContact } from './contact';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_FORM_BYTES = 16 * 1024;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const SITEVERIFY_TIMEOUT_MS = 10_000;

export const TURNSTILE_ACTION = 'turnstile-spin-v2';

export interface OutgoingContactEmail {
  to: string;
  from: { email: string; name: string };
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}

interface TurnstileResult {
  success: boolean;
  hostname?: string;
  action?: string;
  errorCodes: string[];
}

export interface ContactEndpointDependencies {
  turnstileSecret: string;
  contactTo: string;
  expectedHostname?: string;
  expectedAction?: string;
  fetcher?: typeof fetch;
  sendEmail: (message: OutgoingContactEmail) => Promise<void>;
  log?: (level: 'warn' | 'error', event: Record<string, unknown>) => void;
}

type RedirectResponse = (location: string) => Response;

function parseTurnstileResult(value: unknown): TurnstileResult | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const success = Reflect.get(value, 'success');
  if (typeof success !== 'boolean') return undefined;
  const hostname = Reflect.get(value, 'hostname');
  const action = Reflect.get(value, 'action');
  const rawErrorCodes = Reflect.get(value, 'error-codes');
  return {
    success,
    hostname: typeof hostname === 'string' ? hostname : undefined,
    action: typeof action === 'string' ? action : undefined,
    errorCodes: Array.isArray(rawErrorCodes)
      ? rawErrorCodes.filter((code): code is string => typeof code === 'string')
      : [],
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleContactRequest(
  request: Request,
  redirect: RedirectResponse,
  dependencies: ContactEndpointDependencies,
): Promise<Response> {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  const respond = (status: number, body: Record<string, unknown>, redirectTo: string) => {
    const response = wantsJson
      ? Response.json(body, { status })
      : redirect(redirectTo);
    const headers = new Headers(response.headers);
    headers.set('cache-control', 'no-store');
    headers.set('x-content-type-options', 'nosniff');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_FORM_BYTES) {
    return respond(413, { ok: false, errors: { form: 'Submission is too large.' } }, '/contact/?status=invalid');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond(400, { ok: false, errors: { form: 'Malformed submission.' } }, '/contact/?status=error');
  }

  const fields = {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    message: String(form.get('message') ?? ''),
  };
  const errors = validateContact(fields);
  if (Object.keys(errors).length > 0) {
    return respond(400, { ok: false, errors }, '/contact/?status=invalid');
  }

  const token = String(form.get('cf-turnstile-response') ?? '');
  if (token.length < 1 || token.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    dependencies.log?.('warn', { event: 'turnstile_rejected', reason: 'invalid_token_length' });
    return respond(
      403,
      { ok: false, errors: { form: 'Bot check failed — please retry.' } },
      '/contact/?status=blocked',
    );
  }

  const verifyBody = new URLSearchParams({
    secret: dependencies.turnstileSecret,
    response: token,
  });
  const remoteIp = request.headers.get('cf-connecting-ip');
  if (remoteIp) verifyBody.set('remoteip', remoteIp);

  let verdict: TurnstileResult;
  try {
    const verifyResponse = await (dependencies.fetcher ?? fetch)(SITEVERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: verifyBody,
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
    if (!verifyResponse.ok) throw new Error(`Siteverify returned HTTP ${verifyResponse.status}`);

    const parsed = parseTurnstileResult(await verifyResponse.json());
    if (!parsed) throw new Error('Siteverify returned an invalid response');
    verdict = parsed;
  } catch (error) {
    dependencies.log?.('error', {
      event: 'turnstile_siteverify_failed',
      error: errorMessage(error),
    });
    return respond(
      403,
      { ok: false, errors: { form: 'Bot check failed — please retry.' } },
      '/contact/?status=blocked',
    );
  }

  const rejectionReason = !verdict.success
    ? 'unsuccessful'
    : dependencies.expectedHostname && verdict.hostname !== dependencies.expectedHostname
      ? 'hostname_mismatch'
      : dependencies.expectedAction && verdict.action !== dependencies.expectedAction
        ? 'action_mismatch'
        : undefined;

  if (rejectionReason) {
    dependencies.log?.('warn', {
      event: 'turnstile_rejected',
      reason: rejectionReason,
      hostname: verdict.hostname,
      action: verdict.action,
      errorCodes: verdict.errorCodes,
    });
    return respond(
      403,
      { ok: false, errors: { form: 'Bot check failed — please retry.' } },
      '/contact/?status=blocked',
    );
  }

  const { subject, text, html } = composeEmail(fields);
  try {
    await dependencies.sendEmail({
      to: dependencies.contactTo,
      from: { email: 'contact@jvs.sh', name: 'jvs.sh contact form' },
      replyTo: fields.email.trim(),
      subject,
      text,
      html,
    });
  } catch (error) {
    dependencies.log?.('error', {
      event: 'contact_email_failed',
      error: errorMessage(error),
    });
    return respond(
      500,
      { ok: false, errors: { form: 'Something went wrong sending your message. Please try again later.' } },
      '/contact/?status=error',
    );
  }

  return respond(200, { ok: true }, '/contact/sent/');
}
