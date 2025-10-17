
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
      // Send one email to the admin and CC the user who submitted the form.
      // This serves as both the notification and the user's confirmation.
      const { data, error } = await resend.emails.send({
        from: `Contact Form <${FROM_EMAIL}>`,
        to: TO_EMAIL,
        cc: input.email, // CC the user
        subject: `New Message from ${input.name}`,
        reply_to: input.email, // When you reply, it goes to the user
        html: `
          <p>You have received a new message from your website's contact form. A copy of this has been sent to ${input.email} for their records.</p>
          <hr>
          <p><strong>Name:</strong> ${input.name}</p>
          <p><strong>Email:</strong> ${input.email}</p>
          <p><strong>Message:</strong></p>
          <p>${input.message}</p>
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
