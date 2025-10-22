
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@/components/icon';
import { faLinkedin, faBehance, faInstagram, faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { cn } from '@/lib/utils';
import Preloader from '@/components/preloader';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ContactForm from './ContactForm';

interface ContactInfo {
  avatarUrl?: string;
  name?: string;
  title?: string;
  email?: string;
  whatsApp?: string;
  behanceUrl?: string;
  linkedinUrl?: string;
  fiverrUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
}

const FiverrIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor" {...props}>
        <path d="M18.882.022V6.01h-4.227v-.04s.013.04.04.04h-1.428V0H6.012v10.63H9.9v-4.14h3.01v4.14h3.882c.005 0 .008-.002.012-.002.045 0 .09.012.13.024.972.28 1.637 1.252 1.524 2.296-.11 1.02-.95 1.77-1.92 1.832-.13.007-.26.01-.39.01-.58 0-1.13-.24-1.53-.66l-1.04-1.06v-3.02H9.932v6.07H6.012v5.33h12.87c.042-2.906.63-8.875 3.12-11.39C24.195 2.943 21.668.07 18.882.02Zm.13 12.01c.46 0 .83.37.83.83 0 .46-.37.83-.83.83s-.83-.37-.83-.83c0-.45.37-.83.83-.83Z"/>
    </svg>
)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};


export default function ContactPage() {
  const firestore = useFirestore();

  const contactDocRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'contact', 'details') : null,
    [firestore]
  );
  const { data: contactInfo, isLoading } = useDoc<ContactInfo>(contactDocRef);

  const contactLinks = contactInfo ? [
    { icon: faEnvelope, label: 'Email', value: contactInfo.email, href: `mailto:${contactInfo.email}`, color: 'hover:text-blue-300' },
    { icon: faBehance, label: 'Behance', value: '@BeLofted', href: contactInfo.behanceUrl, color: 'hover:text-purple-300' },
    { icon: faLinkedin, label: 'LinkedIn', value: 'Hicham Eljabbary', href: contactInfo.linkedinUrl, color: 'hover:text-sky-300' },
    { icon: FiverrIcon, label: 'Fiverr', value: '@BeLofted', href: contactInfo.fiverrUrl, color: 'hover:text-green-300' },
  ] : [];

  const socialLinks = contactInfo ? [
    { id: 'instagram', href: contactInfo.instagramUrl, icon: faInstagram, hoverColor: 'hover:text-pink-500' },
    { id: 'facebook', href: contactInfo.facebookUrl, icon: faFacebook, hoverColor: 'hover:text-blue-600' },
    { id: 'twitter', href: contactInfo.twitterUrl, icon: faTwitter, hoverColor: 'hover:text-sky-500' },
  ].filter(link => link.href) : [];


  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-8">
      <div className="container mx-auto px-0">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-headline tracking-tight">Contact Us</h1>
            <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
              Let&apos;s get in touch! Fill out the form below to send me a message.
            </p>
          </div>
        <Separator className="bg-white/10 my-8" />
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Preloader />
              </div>
            ) : contactInfo ? (
              <motion.div
                className="flex flex-col md:flex-row gap-8 items-center justify-center text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="w-full md:w-1/2 flex justify-center" variants={itemVariants}>
                  <Card className="glass-effect p-6 flex flex-col h-full w-full max-w-md">
                    <CardContent className="flex flex-col items-center text-center p-0">
                      <Avatar className="border-2 border-white mb-4" style={{ width: '80px', height: '80px' }}>
                        <AvatarImage src={contactInfo.avatarUrl} alt={contactInfo.name} />
                        <AvatarFallback>{contactInfo.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-headline">{contactInfo.name}</h3>
                      <p className="text-foreground/70">{contactInfo.title}</p>
                      
                      <Separator className="my-4 bg-white/20" />
                      
                      <div className="w-full flex flex-col items-center">
                        <div className="space-y-4">
                            {contactLinks.map((link) => (
                            link.href && link.value && (
                                <Link href={link.href} key={link.label} className="flex items-center group text-white" target="_blank" rel="noopener noreferrer">
                                    <div className={cn("w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center glass-effect transition-colors duration-300 text-white", link.color)}>
                                        <Icon icon={link.icon} className="w-6 h-6" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="text-sm text-foreground/70">{link.label}</p>
                                        <p className="font-medium group-hover:text-primary transition-colors">{link.value}</p>
                                    </div>
                                </Link>
                            )
                            ))}
                        </div>
                      </div>
                      
                      {contactInfo.whatsApp && (
                        <>
                          <Separator className="my-4 bg-white/20" />
                          <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 w-[80%] animate-shake">
                              <Link href={`https://wa.me/${contactInfo.whatsApp.replace(/\\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="py-6 px-6">
                                  <FontAwesomeIcon icon={faWhatsapp} className="mr-3 h-6 w-6" />
                                  <div>
                                      <p className="text-sm font-light">WhatsApp</p>
                                      <p className="font-semibold text-base">{contactInfo.whatsApp}</p>
                                  </div>
                              </Link>
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div className="w-full md:w-1/2 flex justify-center" variants={itemVariants}>
                  <Card className="glass-effect p-6 sm:p-8 h-full flex flex-col justify-center w-full max-w-md">
                    <CardContent className="p-0 flex flex-col items-center">
                        <ContactForm />
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Contact information is not available at the moment.</p>
                </div>
            )}
            {contactInfo && (
              <motion.div 
                className="flex items-center justify-center gap-4 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5}}
              >
                {socialLinks.map((social) => (
                  social.href && (
                    <Link 
                      href={social.href} 
                      key={social.id} 
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 glass-effect",
                        social.hoverColor
                      )}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon icon={social.icon} className="w-6 h-6" />
                    </Link>
                  )
                ))}
              </motion.div>
            )}
      </div>
    </div>
  );
}
