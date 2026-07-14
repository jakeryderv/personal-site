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
