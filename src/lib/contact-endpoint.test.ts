import { describe, expect, it, vi } from 'vitest';
import {
  handleContactRequest,
  TURNSTILE_ACTION,
  type ContactEndpointDependencies,
  type OutgoingContactEmail,
} from './contact-endpoint';

const validFields = {
  name: 'Ada',
  email: 'ada@example.com',
  message: 'Hello there, nice site!',
  'cf-turnstile-response': 'valid-token',
};

function makeRequest(fields = validFields, wantsJson = true): Request {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return new Request('https://jvs.sh/api/contact', {
    method: 'POST',
    headers: wantsJson ? { accept: 'application/json' } : undefined,
    body: form,
  });
}

function makeDependencies(
  verdict: Record<string, unknown> = {
    success: true,
    hostname: 'jvs.sh',
    action: TURNSTILE_ACTION,
  },
) {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json(verdict));
  const sendEmail = vi.fn(async (_message: OutgoingContactEmail) => undefined);
  const log = vi.fn((_level: 'warn' | 'error', _event: Record<string, unknown>) => undefined);
  const dependencies: ContactEndpointDependencies = {
    turnstileSecret: 'test-secret',
    contactTo: 'owner@example.com',
    expectedHostname: 'jvs.sh',
    expectedAction: TURNSTILE_ACTION,
    fetcher,
    sendEmail,
    log,
  };
  return { dependencies, fetcher, sendEmail, log };
}

const redirect = (location: string) => new Response(null, {
  status: 303,
  headers: { location },
});

describe('handleContactRequest', () => {
  it('rejects invalid contact fields before calling Siteverify', async () => {
    const { dependencies, fetcher, sendEmail } = makeDependencies();
    const response = await handleContactRequest(
      makeRequest({ ...validFields, message: 'short' }),
      redirect,
      dependencies,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, errors: { message: expect.any(String) } });
    expect(fetcher).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects missing and oversized Turnstile tokens', async () => {
    const { dependencies, fetcher } = makeDependencies();
    const missing = await handleContactRequest(
      makeRequest({ ...validFields, 'cf-turnstile-response': '' }),
      redirect,
      dependencies,
    );
    const oversized = await handleContactRequest(
      makeRequest({ ...validFields, 'cf-turnstile-response': 'x'.repeat(2049) }),
      redirect,
      dependencies,
    );

    expect(missing.status).toBe(403);
    expect(oversized.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects unsuccessful Turnstile verdicts', async () => {
    const { dependencies, sendEmail } = makeDependencies({
      success: false,
      'error-codes': ['invalid-input-response'],
    });
    const response = await handleContactRequest(makeRequest(), redirect, dependencies);

    expect(response.status).toBe(403);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    [{ success: true, hostname: 'attacker.example', action: TURNSTILE_ACTION }, 'hostname'],
    [{ success: true, hostname: 'jvs.sh', action: 'other-form' }, 'action'],
  ])('rejects a Turnstile %s mismatch', async (verdict) => {
    const { dependencies, sendEmail } = makeDependencies(verdict);
    const response = await handleContactRequest(makeRequest(), redirect, dependencies);

    expect(response.status).toBe(403);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects non-successful Siteverify HTTP responses', async () => {
    const { dependencies, sendEmail, log } = makeDependencies();
    dependencies.fetcher = vi.fn(async () => new Response('unavailable', { status: 503 }));
    const response = await handleContactRequest(makeRequest(), redirect, dependencies);

    expect(response.status).toBe(403);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('error', expect.objectContaining({ event: 'turnstile_siteverify_failed' }));
  });

  it('sends validated submissions through the email binding adapter', async () => {
    const { dependencies, fetcher, sendEmail } = makeDependencies();
    const response = await handleContactRequest(makeRequest(), redirect, dependencies);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: expect.any(URLSearchParams),
        signal: expect.any(AbortSignal),
      }),
    );
    const verifyBody = fetcher.mock.calls[0]?.[1]?.body;
    expect(verifyBody).toBeInstanceOf(URLSearchParams);
    if (!(verifyBody instanceof URLSearchParams)) throw new Error('Expected URLSearchParams body');
    expect(verifyBody.get('response')).toBe(validFields['cf-turnstile-response']);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'owner@example.com',
      replyTo: validFields.email,
      subject: '[jvs.sh] Message from Ada',
    }));
  });

  it('returns a generic error when email delivery fails', async () => {
    const { dependencies, log } = makeDependencies();
    dependencies.sendEmail = vi.fn(async () => { throw new Error('provider details'); });
    const response = await handleContactRequest(makeRequest(), redirect, dependencies);

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.not.toContain('provider details');
    expect(log).toHaveBeenCalledWith('error', expect.objectContaining({ event: 'contact_email_failed' }));
  });

  it('preserves the no-JavaScript redirect flow', async () => {
    const { dependencies } = makeDependencies();
    const response = await handleContactRequest(makeRequest(validFields, false), redirect, dependencies);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/contact/sent/');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
