const form = document.getElementById('contact-form');
const statusElement = document.getElementById('form-status');
const submitButton = form?.querySelector('button[type="submit"]');

if (!(form instanceof HTMLFormElement)
  || !(statusElement instanceof HTMLElement)
  || !(submitButton instanceof HTMLButtonElement)) {
  throw new Error('Contact form markup is incomplete');
}

const messages = {
  sent: 'Message sent — thanks!',
  invalid: 'Please check the fields and try again.',
  blocked: 'Bot check failed — please retry.',
  error: 'Something went wrong — please try again later.',
};

const isContactResponse = (value) => {
  if (typeof value !== 'object' || value === null || typeof Reflect.get(value, 'ok') !== 'boolean') return false;
  const errors = Reflect.get(value, 'errors');
  return errors === undefined
    || (typeof errors === 'object'
      && errors !== null
      && Object.values(errors).every((message) => typeof message === 'string'));
};

// No-JS fallback lands back here with ?status=... (success goes to /contact/sent)
const initial = new URLSearchParams(location.search).get('status');
if (initial && messages[initial]) statusElement.textContent = messages[initial];

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusElement.textContent = 'sending…';
  submitButton.disabled = true;
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { accept: 'application/json' },
    });
    const data = await response.json();
    if (!isContactResponse(data)) throw new Error('Unexpected contact response');
    if (data.ok) {
      form.reset();
      statusElement.textContent = messages.sent;
    } else {
      statusElement.textContent = Object.values(data.errors ?? {}).join(' ') || messages.error;
    }
  } catch {
    statusElement.textContent = messages.error;
  } finally {
    submitButton.disabled = false;
  }
  window.turnstile?.reset?.();
});
