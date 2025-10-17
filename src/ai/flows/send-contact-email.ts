
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
      // Step 1: Send the primary email to the site owner
      const adminEmailPromise = resend.emails.send({
        from: `Contact Form <${FROM_EMAIL}>`,
        to: TO_EMAIL,
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

      // Step 2: Send the confirmation email to the user
      const userConfirmationPromise = resend.emails.send({
        from: `Support <${FROM_EMAIL}>`,
        to: input.email,
        subject: 'Thank you for your message!',
        html: `
          <p>Hi ${input.name},</p>
          <p>Thank you for contacting us. We have received your message and will get back to you shortly.</p>
          <p>Best regards,<br/>The Team</p>
        `,
      });

      // Await both promises
      const [adminEmailResult, userEmailResult] = await Promise.allSettled([
        adminEmailPromise,
        userConfirmationPromise,
      ]);

      // Check the result of the primary email to the admin
      if (adminEmailResult.status === 'rejected') {
        console.error('Error sending admin email:', adminEmailResult.reason);
        // This is a critical failure
        return { success: false, message: 'Failed to send message to support.' };
      }
      
      if (userEmailResult.status === 'rejected') {
        // This is not a critical failure. The admin got the email.
        // Log it for debugging, but return success to the user interface.
        console.warn('Failed to send confirmation email to user:', userEmailResult.reason);
      }
      
      console.log('Admin email sent successfully:', adminEmailResult.value);
      if (userEmailResult.status === 'fulfilled') {
        console.log('User confirmation email sent successfully:', userEmailResult.value);
      }

      // Return success as long as the primary email was sent.
      return { success: true, message: 'Email sent successfully.' };

    } catch (e) {
      console.error('An unexpected error occurred in sendContactEmailFlow:', e);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  }
);
