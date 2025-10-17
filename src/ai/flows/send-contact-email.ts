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


// IMPORTANT: Replace with your actual email address.
const TO_EMAIL = 'your-email@example.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // Resend requires this for free tier

// Initialize Resend. You'll need to set up your API key.
// const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Placeholder for email sending logic.
    // Since we can't handle API keys securely here, this part is commented out.
    // You will need to uncomment this and add your Resend API key.
    /*
    if (!process.env.RESEND_API_KEY) {
      console.error('Resend API key is not configured.');
      return { success: false, message: 'Email service is not configured.' };
    }
    
    try {
      const { data, error } = await resend.emails.send({
        from: `Contact Form <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        subject: `New Message from ${input.name}`,
        html: `
          <p>You received a new message from your website's contact form.</p>
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
      console.error('An unexpected error occurred:', e);
      return { success: false, message: 'An unexpected error occurred.' };
    }
    */
    
    // For now, we'll return a success message without sending an email.
    // ** YOU WILL NEED TO IMPLEMENT THE EMAIL LOGIC ABOVE **
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    return { success: true, message: 'Form submitted (email sending not implemented).' };
  }
);
