
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
      // Send one email to the admin.
      const { data, error } = await resend.emails.send({
        from: `Contact Form <${FROM_EMAIL}>`,
        to: TO_EMAIL,
        subject: `New Message from ${input.name}`,
        reply_to: input.email, // When you reply, it goes to the user
        html: `
          <body style="background-color: #4c1d24; color: #e5e7eb; margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #5f212c; border-radius: 8px; border: 1px solid #7c2d3a;">
              <tr>
                <td style="padding: 32px;">
                  <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0 0 24px;">New Contact Form Message</h1>
                  <p style="margin: 0 0 16px;">You have received a new message from your portfolio website.</p>
                  
                  <div style="background-color: #7c2d3a; padding: 20px; border-radius: 8px;">
                    <p style="margin: 0 0 8px;"><strong>Name:</strong> ${input.name}</p>
                    <p style="margin: 0 0 16px;"><strong>Email:</strong> <a href="mailto:${input.email}" style="color: #f87171; text-decoration: none;">${input.email}</a></p>
                    <hr style="border: none; border-top: 1px solid #993a4a; margin: 16px 0;">
                    <p style="margin: 0 0 8px; font-weight: bold; color: #d1d5db;">Message:</p>
                    <p style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${input.message}</p>
                  </div>

                  <p style="margin: 24px 0 0; font-size: 12px; color: #e5e7eb; text-align: center;">You can reply directly to this email to contact the user.</p>
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
      return { success: true, message: 'Email sent successfully.' };

    } catch (e) {
      console.error('An unexpected error occurred in sendContactEmailFlow:', e);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  }
);
