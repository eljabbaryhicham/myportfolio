
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, ExternalLink, Smartphone, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ContactInfo } from '@/lib/contact-data';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof formSchema>;


const BehanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor" {...props}>
        <path d="M13.25 10.151c.827 0 1.5-.673 1.5-1.5s-.673-1.5-1.5-1.5-1.5.673-1.5 1.5.673 1.5 1.5 1.5zm-1.894 4.318h3.389c-.288 1.458-1.745 2.531-3.389 2.531-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5c1.801 0 3.275 1.365 3.469 3.106h2.029c-.21-2.835-2.583-5.106-5.498-5.106-3.029 0-5.5 2.471-5.5 5.5s2.471 5.5 5.5 5.5c2.721 0 4.977-1.996 5.426-4.531h-2.028c-.379 1.488-1.758 2.531-3.398 2.531zM17.5 7h-4v1h4V7z"/>
    </svg>
)

const FiverrIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor" {...props}>
        <path d="M18.882.022V6.01h-4.227v-.04s.013.04.04.04h-1.428V0H6.012v10.63H9.9v-4.14h3.01v4.14h3.882c.005 0 .008-.002.012-.002.045 0 .09.012.13.024.972.28 1.637 1.252 1.524 2.296-.11 1.02-.95 1.77-1.92 1.832-.13.007-.26.01-.39.01-.58 0-1.13-.24-1.53-.66l-1.04-1.06v-3.02H9.932v6.07H6.012v5.33h12.87c.042-2.906.63-8.875 3.12-11.39C24.195 2.943 21.668.07 18.882.02Zm.13 12.01c.46 0 .83.37.83.83 0 .46-.37.83-.83.83s-.83-.37-.83-.83c0-.45.37-.83.83-.83Z"/>
    </svg>
)

export default function ContactPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const contactDocRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'contact', 'details') : null,
    [firestore]
  );
  const { data: contactInfo, isLoading } = useDoc<ContactInfo>(contactDocRef);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const handleSubmit = (values: ContactFormValues) => {
    console.log(values);
    toast({
      title: 'Message Sent!',
      description: "Thanks for reaching out. We'll get back to you soon.",
    });
    form.reset();
  };

  const contactLinks = contactInfo ? [
    { icon: Mail, label: 'Email', value: contactInfo.email, href: `mailto:${contactInfo.email}`, color: 'bg-blue-500/20 text-blue-300' },
    { icon: BehanceIcon, label: 'Behance', value: '@BeLofted', href: contactInfo.behanceUrl, color: 'bg-purple-500/20 text-purple-300' },
    { icon: Linkedin, label: 'LinkedIn', value: 'Hicham Eljabbary', href: contactInfo.linkedinUrl, color: 'bg-sky-500/20 text-sky-300' },
    { icon: FiverrIcon, label: 'Fiverr', value: '@BeLofted', href: contactInfo.fiverrUrl, color: 'bg-green-500/20 text-green-300' },
  ] : [];

  const socialLinks = contactInfo ? [
    { id: 'instagram', icon: Instagram, href: contactInfo.instagramUrl, color: 'bg-pink-500/80 hover:bg-pink-500' },
    { id: 'facebook', icon: Facebook, href: contactInfo.facebookUrl, color: 'bg-blue-600/80 hover:bg-blue-600' },
    { id: 'twitter', icon: Twitter, href: contactInfo.twitterUrl, color: 'bg-sky-500/80 hover:bg-sky-500' },
  ].filter((link, index, self) => link.href && self.findIndex(l => l.id === link.id) === index) : [];


  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-[5%] pb-4">
        <div className="container mx-auto px-0">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contact Us</h1>
            <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
              Let&apos;s get in touch! Fill out the form below to send me a message.
            </p>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-[5%] pt-0">
          <div className="container mx-auto px-0">
            {isLoading && <div className="text-center">Loading contact information...</div>}
            {contactInfo && (
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start justify-center">
                <div className="w-full md:w-1/2">
                  <Card className="glass-effect p-6 flex flex-col h-full">
                    <CardContent className="flex flex-col items-center text-center p-0">
                      <Avatar className="border-2 border-primary mb-4" style={{ width: '80px', height: '80px' }}>
                        <AvatarImage src={contactInfo.avatarUrl} alt={contactInfo.name} />
                        <AvatarFallback>{contactInfo.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold">{contactInfo.name}</h3>
                      <p className="text-foreground/70">{contactInfo.title}</p>

                      <div className="w-full flex flex-col gap-y-6 mt-8">
                        {contactLinks.map((link) => (
                          link.href && (
                            <Link href={link.href} key={link.label} className="flex flex-row items-center group gap-4" target="_blank" rel="noopener noreferrer">
                              <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center ${link.color}`}>
                                <link.icon className="w-6 h-6" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm text-foreground/70">{link.label}</p>
                                <p className="font-medium group-hover:text-primary transition-colors">{link.value}</p>
                              </div>
                            </Link>
                          )
                        ))}
                      </div>
                      {contactInfo.whatsApp && (
                        <Button asChild className="w-full h-24 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg mt-8">
                            <Link href={`https://wa.me/${contactInfo.whatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                <Smartphone className="mr-3 h-8 w-8" />
                                <div>
                                    <p className="text-base font-light">Make a deal on WhatsApp</p>
                                    <p className="font-bold text-xl">{contactInfo.whatsApp}</p>
                                </div>
                            </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div className="w-full md:w-1/2">
                  <Card className="glass-effect p-6 sm:p-8 h-full">
                    <CardContent className="p-0 flex flex-col items-center">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 w-full">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Name" {...field} className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors placeholder:text-foreground/80" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="email" placeholder="Email" {...field} className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors placeholder:text-foreground/80" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder="Message"
                                    className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors min-h-[100px] placeholder:text-foreground/80"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                            Send Message
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            {contactInfo && (
              <div className="flex items-center justify-center gap-4 mt-8">
                {socialLinks.map((social) => (
                  social.href && <Link href={social.href} key={social.id} className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${social.color} transition-all duration-300 hover:scale-110`} target="_blank" rel="noopener noreferrer">
                    <social.icon className="w-6 h-6" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
