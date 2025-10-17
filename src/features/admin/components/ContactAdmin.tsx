
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { ContactInfo } from '@/lib/contact-data';
import { defaultContactInfo } from '@/lib/contact-data';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  avatarUrl: z.string().url().optional().or(z.literal('')),
  name: z.string().min(2).optional().or(z.literal('')),
  title: z.string().min(2).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  whatsApp: z.string().optional().or(z.literal('')),
  behanceUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  fiverrUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
});

type ContactFormValues = z.infer<typeof formSchema>;

export default function ContactAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo, isLoading } = useDoc<ContactInfo>(contactDocRef);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (contactInfo) {
      form.reset(contactInfo);
    }
  }, [contactInfo, form]);

  const onSubmit = (values: ContactFormValues) => {
    if (!contactDocRef) return;
    setDocumentNonBlocking(contactDocRef, values, { merge: true });
    toast({
      title: 'Contact Info Updated',
      description: 'Your contact page has been successfully updated.',
    });
  };

  if (isLoading) {
    return <p>Loading contact settings...</p>;
  }

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle>Contact Page Settings</CardTitle>
        <CardDescription>
          Update the information displayed on your public contact page.
        </CardDescription>
      </CardHeader>
      <CardContent>
      <ScrollArea className="h-[60vh]">
        <div className="p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title / Profession</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Motion Graphics Designer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/your-photo.png" {...field} />
                    </FormControl>
                    <FormDescription>The image displayed on your contact card.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsApp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="behanceUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Behance URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.behance.net/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.linkedin.com/in/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fiverrUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiverr URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.fiverr.com/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.instagram.com/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.facebook.com/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twitterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter (X) URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.twitter.com/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
