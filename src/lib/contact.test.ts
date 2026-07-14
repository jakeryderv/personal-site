import { describe, expect, it } from 'vitest';
import { composeEmail, escapeHtml, validateContact } from './contact';

const valid = { name: 'Ada', email: 'ada@example.com', message: 'Hello there, nice site!' };

describe('validateContact', () => {
  it('accepts valid fields', () => {
    expect(validateContact(valid)).toEqual({});
  });
  it('rejects blank name', () => {
    expect(validateContact({ ...valid, name: '   ' })).toHaveProperty('name');
  });
  it('rejects overlong name', () => {
    expect(validateContact({ ...valid, name: 'x'.repeat(201) })).toHaveProperty('name');
  });
  it('rejects malformed email', () => {
    expect(validateContact({ ...valid, email: 'not-an-email' })).toHaveProperty('email');
  });
  it('rejects too-short message', () => {
    expect(validateContact({ ...valid, message: 'hi' })).toHaveProperty('message');
  });
  it('rejects oversized message', () => {
    expect(validateContact({ ...valid, message: 'x'.repeat(5001) })).toHaveProperty('message');
  });
});

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;',
    );
  });
});

describe('composeEmail', () => {
  it('includes sender and message in subject and text body', () => {
    const { subject, text } = composeEmail(valid);
    expect(subject).toBe('[jvs.sh] Message from Ada');
    expect(text).toContain('Ada <ada@example.com>');
    expect(text).toContain(valid.message);
  });
  it('escapes user content in the html body', () => {
    const { html } = composeEmail({ ...valid, message: '<script>alert(1)</script> hey there friend' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
  it('trims whitespace from fields', () => {
    const { subject } = composeEmail({ ...valid, name: '  Ada  ' });
    expect(subject).toBe('[jvs.sh] Message from Ada');
  });
});
