
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server-init';
import { DEFAULT_EMAIL_TEMPLATE_HTML } from '@/lib/default-email-template';

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadEmailTemplate(): Promise<string> {
  try {
    const serverApp = await initializeServerApp();
    const db = getAdminFirestore(serverApp);
    const snap = await db.collection('homepage').doc('settings').get();
    const tpl = snap.data()?.emailTemplateHtml;
    return typeof tpl === 'string' && tpl.trim() ? tpl : DEFAULT_EMAIL_TEMPLATE_HTML;
  } catch (e) {
    console.error('Failed to load email template from settings, using default.', e);
    return DEFAULT_EMAIL_TEMPLATE_HTML;
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
  const TO_EMAIL = 'contact@mellivision.com';
  const FROM_EMAIL = 'contact@mellivision.com'; // Verified domain in Resend

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

  const { name, email, message } = parseResult.data;

  try {
    // Admin-customizable template (Admin → Home → Contact Email Template).
    const template = await loadEmailTemplate();
    const html = template
      .replace(/\{\{name\}\}/g, escapeHtml(name))
      .replace(/\{\{email\}\}/g, escapeHtml(email))
      .replace(/\{\{message\}\}/g, escapeHtml(message));

    const { data, error } = await resend.emails.send({
      from: `BELOFTED <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      subject: `New Message from ${name}`,
      reply_to: email,
      html,
    });

    if (error) {
      console.error('Error sending email from Resend:', error);
      return NextResponse.json({ success: false, message: `Failed to send email: ${error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Message Sent Successfully!' });

  } catch (e: any) {
    console.error('An unexpected error occurred while sending email:', e);
    return NextResponse.json({ success: false, message: `An unexpected server error occurred: ${e.message}` }, { status: 500 });
  }
}
