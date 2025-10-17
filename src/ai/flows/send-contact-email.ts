
'use server';
/**
 * @fileOverview A Genkit flow for sending a contact form email.
 *
 * - sendContactEmail - A function that handles sending the contact email.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';
import { ContactFormInput, ContactFormInputSchema } from '@/features/contact/data/contact-form-types';


// Set the recipient email address.
const TO_EMAIL = 'eljabbaryhicham@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // Resend requires this for free tier

// Initialize Resend with the provided API key.
const resend = new Resend('re_duZiJJ5B_J3Eo6HxGoJS5eiYPravSefmr');

/**
 * A server-side function to send the contact form data via email.
 * This is a wrapper around the Genkit flow.
 * @param input The contact form data.
 * @returns A promise that resolves when the email is sent.
 */
export async function sendContactEmail(
  input: ContactFormInput
): Promise<{ success: boolean; message: string }> {
  return await sendContactEmailFlow(input);
}

/**
 * A Genkit flow that processes and sends a contact email.
 */
const sendContactEmailFlow = ai.defineFlow(
  {
    name: 'sendContactEmailFlow',
    inputSchema: ContactFormInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    console.log('Received contact form submission:', input);
    
    try {
      const sendAdminEmail = resend.emails.send({
        from: `Contact Form <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        subject: `New Message from ${input.name}`,
        reply_to: input.email,
        html: `
          <p>You received a new message from your website's contact form.</p>
          <p><strong>Name:</strong> ${input.name}</p>
          <p><strong>Email:</strong> ${input.email}</p>
          <p><strong>Message:</strong></p>
          <p>${input.message}</p>
        `,
      });

      const sendUserConfirmation = resend.emails.send({
        from: `Support <${FROM_EMAIL}>`,
        to: [input.email],
        subject: 'Your Message Has Been Received',
        html: `
          <p>Hello ${input.name},</p>
          <p>Thank you for contacting us. We have successfully received your message and will get back to you as soon as possible.</p>
          <p>Here is a copy of your message:</p>
          <blockquote style="border-left: 2px solid #ccc; padding-left: 1rem; margin-left: 0;">
            <p>${input.message}</p>
          </blockquote>
          <p>Best regards,<br/>Support</p>
        `,
      });

      const [adminEmailResponse, userEmailResponse] = await Promise.all([
        sendAdminEmail,
        sendUserConfirmation
      ]);

      if (adminEmailResponse.error) {
        console.error('Error sending admin email:', adminEmailResponse.error);
        return { success: false, message: 'Failed to send email to admin.' };
      }

      if (userEmailResponse.error) {
        console.error('Error sending confirmation email to user:', userEmailResponse.error);
        // Admin email was sent, so it's a partial success. We can still inform the user on the frontend.
        // Or decide on a different strategy. For now, we'll consider it a failure.
        return { success: false, message: 'Failed to send confirmation email.' };
      }

      console.log('Emails sent successfully');
      return { success: true, message: 'Email sent successfully.' };

    } catch (e) {
      console.error('An unexpected error occurred:', e);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  }
);
