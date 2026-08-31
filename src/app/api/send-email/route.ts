
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { firebaseConfig } from '@/firebase/config';
import { DEFAULT_EMAIL_TEMPLATE_HTML, DEFAULT_AUTOREPLY_TEMPLATE_HTML } from '@/lib/default-email-template';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email(),
  message: z.string().min(1, 'Message is required').max(5000, 'Message is too long'),
});

// Very small in-memory rate limiter: max N requests per IP per window.
// In-memory is fine for a single serverless instance; enough to blunt spam.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface EmailTemplates {
  emailTemplateHtml: string;
  autoReplyTemplateHtml: string;
}

// Fetches the admin-customizable email templates from homepage/settings in a
// single Firestore REST read per request. Both template fields are read from the
// same response (previously each field triggered its own read, doubling the cost).
// `homepage/settings` is publicly readable (the client site loads it
// anonymously), so no Admin SDK credentials are needed here
// (docs/service-account.json is not available in deployments).
async function loadEmailTemplates(): Promise<EmailTemplates> {
  const fallback = {
    emailTemplateHtml: DEFAULT_EMAIL_TEMPLATE_HTML,
    autoReplyTemplateHtml: DEFAULT_AUTOREPLY_TEMPLATE_HTML,
  };
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/homepage/settings`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Firestore REST request failed: ${res.status}`);
    const fields = (await res.json()).fields || {};
    const read = (fieldName: keyof EmailTemplates) => {
      const tpl = fields[fieldName]?.stringValue;
      return typeof tpl === 'string' && tpl.trim() ? tpl : fallback[fieldName];
    };
    return {
      emailTemplateHtml: read('emailTemplateHtml'),
      autoReplyTemplateHtml: read('autoReplyTemplateHtml'),
    };
  } catch (e) {
    console.error('Failed to load email templates from settings, using defaults.', e);
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured on the server.');
    return NextResponse.json(
      { success: false, message: 'Server is not configured for sending emails.' },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const FROM_EMAIL = 'contact@mellivision.com'; // Verified domain in Resend
  // Customer messages land in BOTH inboxes; auto-reply always comes from the business address.
  const TO_EMAILS = ['contact@mellivision.com', 'eljabbaryhicham@gmail.com'];

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const parseResult = formSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ success: false, message: 'Invalid form data.', errors: parseResult.error.flatten() }, { status: 400 });
  }

  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ success: false, message: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }

  const { name, email, message } = parseResult.data;

  try {
    // Admin-customizable template (Admin → Home → Contact Email Template).
    // Single Firestore read resolves both the notification and auto-reply templates.
    const templates = await loadEmailTemplates();
    const html = templates.emailTemplateHtml
      .replace(/\{\{name\}\}/g, escapeHtml(name))
      .replace(/\{\{email\}\}/g, escapeHtml(email))
      .replace(/\{\{message\}\}/g, escapeHtml(message));

    const { error } = await resend.emails.send({
      from: `MelliVision <${FROM_EMAIL}>`,
      to: TO_EMAILS,
      subject: `New Message from ${name}`,
      reply_to: email,
      html,
    });

    if (error) {
      console.error('Error sending email from Resend:', error);
      return NextResponse.json({ success: false, message: `Failed to send email: ${error.message}` }, { status: 500 });
    }

    // Auto-reply to the visitor — failure here must not fail the submission.
    try {
      const autoReplyHtml = templates.autoReplyTemplateHtml
        .replace(/\{\{name\}\}/g, escapeHtml(name))
        .replace(/\{\{email\}\}/g, escapeHtml(email))
        .replace(/\{\{message\}\}/g, escapeHtml(message));

      await resend.emails.send({
        from: `MelliVision <${FROM_EMAIL}>`,
        to: email,
        reply_to: FROM_EMAIL,
        subject: 'We have received your message',
        html: autoReplyHtml,
      });
    } catch (autoReplyError) {
      console.error('Failed to send auto-reply:', autoReplyError);
    }

    return NextResponse.json({ success: true, message: 'Message Sent Successfully!' });

  } catch (e: any) {
    console.error('An unexpected error occurred while sending email:', e);
    return NextResponse.json({ success: false, message: `An unexpected server error occurred: ${e.message}` }, { status: 500 });
  }
}
