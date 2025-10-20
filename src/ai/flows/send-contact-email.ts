
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

// Initialize Resend with the API key from environment variables.
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * A server-side function to send the contact form data via email.
 * This is a wrapper around the Genkit flow.
 * @param input The contact form data.
 * @returns A promise that resolves when the email is sent.
 */
export async function sendContactEmail(
  input: ContactFormInput
): Promise<{ success: boolean; message: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API key is not configured.');
    return { success: false, message: 'The server is not configured to send emails.' };
  }
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
      const { data, error } = await resend.emails.send({
        from: `Contact Form <${FROM_EMAIL}>`,
        to: TO_EMAIL,
        subject: `New Message from ${input.name}`,
        reply_to: input.email,
        html: `
          <body style="background-color: #0d1a2e; color: #e5e7eb; margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #1a2b42; border-radius: 8px; border: 1px solid #2a3f5f;">
              <tr>
                <td style="padding: 32px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <img src="https://i.imgur.com/N9c8oEJ.png" alt="Logo" style="max-width: 150px; height: auto;">
                  </div>
                  <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0 0 24px; text-align: center;">Message From BELOFTED</h1>
                  <p style="margin: 0 0 16px; text-align: center;">You have received a new message from your portfolio website.</p>
                  
                  <div style="background-color: #0d1a2e; padding: 20px; border-radius: 8px;">
                    <p style="margin: 0 0 8px;"><strong>Name:</strong> ${input.name}</p>
                    <p style="margin: 0 0 16px;"><strong>Email:</strong> <a href="mailto:${input.email}" style="color: #60a5fa; text-decoration: none;">${input.email}</a></p>
                    <hr style="border: none; border-top: 1px solid #2a3f5f; margin: 16px 0;">
                    <p style="margin: 0 0 8px; font-weight: bold; color: #d1d5db;">Message:</p>
                    <p style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${input.message}</p>
                  </div>

                  <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">You can reply directly to this email to contact the user.</p>
                </td>
              </tr>
            </table>
          </body>
        `,
      });

      if (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Failed to send email.' };
      }
      
      console.log('Email sent successfully:', data);
      return { success: true, message: 'Message Sent! Thanks for reaching out. We\'ll get back to you soon.' };

    } catch (e) {
      console.error('An unexpected error occurred in sendContactEmailFlow:', e);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  }
);
