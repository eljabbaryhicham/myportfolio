
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
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, MessageSquare, Briefcase, Linkedin, ExternalLink, Smartphone, Code, Instagram, Facebook, Twitter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof formSchema>;


const BehanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M13.25 10.151c.827 0 1.5-.673 1.5-1.5s-.673-1.5-1.5-1.5-1.5.673-1.5 1.5.673 1.5 1.5 1.5zm-1.894 4.318h3.389c-.288 1.458-1.745 2.531-3.389 2.531-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5c1.801 0 3.275 1.365 3.469 3.106h2.029c-.21-2.835-2.583-5.106-5.498-5.106-3.029 0-5.5 2.471-5.5 5.5s2.471 5.5 5.5 5.5c2.721 0 4.977-1.996 5.426-4.531h-2.028c-.379 1.488-1.758 2.531-3.398 2.531zM17.5 7h-4v1h4V7z"/>
    </svg>
)

const FiverrIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.882.022V6.01h-4.227v-.04s.013.04.04.04h-1.428V0H6.012v10.63H9.9v-4.14h3.01v4.14h3.882c.005 0 .008-.002.012-.002.045 0 .09.012.13.024.972.28 1.637 1.252 1.524 2.296-.11 1.02-.95 1.77-1.92 1.832-.13.007-.26.01-.39.01-.58 0-1.13-.24-1.53-.66l-1.04-1.06v-3.02H9.932v6.07H6.012v5.33h12.87c.042-2.906.63-8.875 3.12-11.39C24.195 2.943 21.668.07 18.882.02Zm.13 12.01c.46 0 .83.37.83.83 0 .46-.37.83-.83.83s-.83-.37-.83-.83c0-.45.37-.83.83-.83Z"/>
    </svg>
)


const contactLinks = [
    { icon: Mail, label: 'Email', value: 'hicham@gmail.com', href: 'mailto:hicham@gmail.com', color: 'bg-blue-500/20 text-blue-300' },
    { icon: BehanceIcon, label: 'Behance', value: '@BeLofted', href: '#', color: 'bg-purple-500/20 text-purple-300' },
    { icon: Linkedin, label: 'LinkedIn', value: 'Hicham Eljabbary', href: '#', color: 'bg-sky-500/20 text-sky-300' },
    { icon: FiverrIcon, label: 'Fiverr', value: '@BeLofted', href: '#', color: 'bg-green-500/20 text-green-300' },
];

const socialLinks = [
    { icon: Instagram, href: '#', color: 'bg-pink-500/80 hover:bg-pink-500' },
    { icon: Facebook, href: '#', color: 'bg-blue-600/80 hover:bg-blue-600' },
    { icon: Twitter, href: '#', color: 'bg-sky-500/80 hover:bg-sky-500' },
];

export default function ContactPage() {
  const { toast } = useToast();
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

  return (
    <ScrollArea className="h-full w-full">
      <div className="container mx-auto p-[10%]">
        <div className="text-center mb-8">
          <h1 className="text-xl md:text-2xl text-foreground/80">
            Let's get in touch! Fill out the form below to send me a message.
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Column 1: Contact Form */}
          <Card className="glass-effect p-6 sm:p-8">
            <CardContent className="p-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                            <Input placeholder="Name" {...field} className="pl-10 bg-transparent border-0 border-b rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors" />
                          </div>
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
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                            <Input type="email" placeholder="Email" {...field} className="pl-10 bg-transparent border-0 border-b rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors" />
                          </div>
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
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-4 h-5 w-5 text-foreground/50" />
                            <Textarea
                              placeholder="Message"
                              className="pl-10 bg-transparent border-0 border-b rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors min-h-[100px]"
                              {...field}
                            />
                          </div>
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
          
          {/* Column 2: Contact Info */}
          <div className="flex flex-col gap-8">
            <Card className="glass-effect p-6 flex flex-col">
              <CardContent className="flex flex-col items-center text-center p-0">
                <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                  <AvatarImage src="https://picsum.photos/seed/hicham/200/200" alt="Hicham Eljabbary" data-ai-hint="man portrait" />
                  <AvatarFallback>HE</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">Hicham Eljabbary</h3>
                <p className="text-foreground/70">Motion Graphics Designer</p>

                <div className="w-full space-y-4 mt-6 text-left">
                  {contactLinks.map((link) => (
                    <Link href={link.href} key={link.label} className="flex items-center group">
                      <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center mr-4 ${link.color}`}>
                        <link.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm text-foreground/70">{link.label}</p>
                        <p className="font-medium group-hover:text-primary transition-colors">{link.value}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-foreground/50 group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
                 <Button className="w-full h-24 bg-gradient-to-r from-green-500 to-teal-500 text-white text-lg mt-6">
                    <Smartphone className="mr-3 h-8 w-8" />
                    <div className="text-left">
                        <p className="text-base font-light">Make a deal on WhatsApp</p>
                        <p className="font-bold text-xl">+212 619 665 220</p>
                    </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-12">
          {socialLinks.map((social) => (
            <Link href={social.href} key={social.color} className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${social.color} transition-all duration-300 hover:scale-110`}>
              <social.icon className="w-6 h-6" />
            </Link>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

    