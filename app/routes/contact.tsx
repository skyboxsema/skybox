import {Form, useActionData, useNavigation} from 'react-router';
import type {Route} from './+types/contact';

const CONTACT_EMAIL = 'contact@skyboxwithyou.com';

type ActionResult =
  | {ok: true}
  | {ok: false; error: string; fields?: Record<string, string>};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Sky Box With You | Contact'}];
};

export async function action({
  request,
  context,
}: Route.ActionArgs): Promise<ActionResult> {
  const form = await request.formData();
  const fields = {
    name: String(form.get('name') ?? '').trim(),
    email: String(form.get('email') ?? '').trim(),
    subject: String(form.get('subject') ?? '').trim(),
    message: String(form.get('message') ?? '').trim(),
  };

  // Honeypot: real visitors never fill this hidden field
  if (form.get('company')) return {ok: true};

  if (!fields.name || !fields.email || !fields.message) {
    return {ok: false, error: 'Please fill in your name, email and message.', fields};
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return {ok: false, error: 'Please enter a valid email address.', fields};
  }

  const formId = context.env.FORMSPREE_FORM_ID;
  if (!formId) {
    return {
      ok: false,
      error: `Our contact form is temporarily unavailable. Please email us at ${CONTACT_EMAIL}.`,
      fields,
    };
  }

  const response = await fetch(`https://formspree.io/f/${formId}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Accept: 'application/json'},
    body: JSON.stringify({
      ...fields,
      _replyto: fields.email,
      _subject: fields.subject || `New message from ${fields.name}`,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `Something went wrong sending your message. Please try again or email us at ${CONTACT_EMAIL}.`,
      fields,
    };
  }

  return {ok: true};
}

export default function Contact() {
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';
  const fields = result && !result.ok ? result.fields : undefined;

  return (
    <div className="contact">
      <header className="contact-intro">
        <h1>Contact Us</h1>
        <p>
          Questions about an order or a piece? Send us a message and we&apos;ll
          get back to you within 1–2 business days. You can also reach us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </header>

      {result?.ok ? (
        <p className="contact-success" role="status">
          Thank you — your message has been sent. We&apos;ll be in touch soon.
        </p>
      ) : (
        <Form method="post" className="contact-form">
          <div className="contact-row">
            <label>
              Name
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                defaultValue={fields?.name}
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={fields?.email}
              />
            </label>
          </div>
          <label>
            Subject
            <input name="subject" type="text" defaultValue={fields?.subject} />
          </label>
          <label>
            Message
            <textarea
              name="message"
              rows={6}
              required
              defaultValue={fields?.message}
            />
          </label>
          <input
            className="contact-honeypot"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          {result && !result.ok ? (
            <p className="contact-error" role="alert">
              {result.error}
            </p>
          ) : null}
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </Form>
      )}
    </div>
  );
}
