
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import PageTextEditor from '@/features/admin/components/PageTextEditor';
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
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Preloader from '@/components/preloader';
import type { AppUser } from '@/firebase/auth/use-user';
import { useTranslation } from '@/lib/i18n/useTranslation';
import MediaAdmin from './MediaAdmin';
import { faImages } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const formSchema = z.object({
  avatarUrl: z.string().url().optional().or(z.literal('')),
  name: z.string().min(2).optional().or(z.literal('')),
  title: z.string().min(2).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  whatsApp: z.string().optional().or(z.literal('')),
  behanceUrl: z.string().url().optional().or(z.literal('')),
  behanceName: z.string().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  linkedinName: z.string().optional().or(z.literal('')),
  fiverrUrl: z.string().url().optional().or(z.literal('')),
  fiverrName: z.string().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  instagramName: z.string().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  facebookName: z.string().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  twitterName: z.string().optional().or(z.literal('')),

});

type ContactInfo = z.infer<typeof formSchema>;

const defaultFormValues: ContactInfo = {
    avatarUrl: '',
    name: '',
    title: '',
    email: '',
    whatsApp: '',
    behanceUrl: '',
    behanceName: '',
    linkedinUrl: '',
    linkedinName: '',
    fiverrUrl: '',
    fiverrName: '',
    instagramUrl: '',
    instagramName: '',
    facebookUrl: '',
    facebookName: '',
    twitterUrl: '',
    twitterName: '',
};

interface MediaAsset {
    id: string;
    url: string;
    filename: string;
    title?: string;
    resource_type: string;
}

export default function ContactAdmin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEditContact = isSuperAdmin || (typedUser?.permissions?.canEditContact ?? true);

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo, isLoading } = useDoc<ContactInfo>(contactDocRef);

  const mediaCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'media') : null),
    [firestore]
  );
  const { data: mediaAssets } = useCollection<MediaAsset>(mediaCollectionRef);
  const imageAssets = mediaAssets?.filter(a => a.resource_type === 'image') || [];

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'images' | 'videos' | 'files'>('images');
  const [libraryCollection, setLibraryCollection] = useState<'primary' | 'extented'>('primary');

  const form = useForm<ContactInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const { watch } = form;

  useEffect(() => {
    if (contactInfo) {
        const values: ContactInfo = {
            avatarUrl: contactInfo.avatarUrl || '',
            name: contactInfo.name || '',
            title: contactInfo.title || '',
            email: contactInfo.email || '',
            whatsApp: contactInfo.whatsApp || '',
            behanceUrl: contactInfo.behanceUrl || '',
            behanceName: contactInfo.behanceName || '',
            linkedinUrl: contactInfo.linkedinUrl || '',
            linkedinName: contactInfo.linkedinName || '',
            fiverrUrl: contactInfo.fiverrUrl || '',
            fiverrName: contactInfo.fiverrName || '',
            instagramUrl: contactInfo.instagramUrl || '',
            instagramName: contactInfo.instagramName || '',
            facebookUrl: contactInfo.facebookUrl || '',
            facebookName: contactInfo.facebookName || '',
            twitterUrl: contactInfo.twitterUrl || '',
            twitterName: contactInfo.twitterName || '',
        };
      form.reset(values);
    } else if (!isLoading) {
        form.reset(defaultFormValues);
    }
  }, [contactInfo, form, isLoading]);
  
  useEffect(() => {
    if (!canEditContact) {
      Object.keys(form.getValues()).forEach(key => {
        form.control.getFieldState(key as keyof ContactInfo).isDirty = false;
      });
    }
  }, [canEditContact, form]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!canEditContact || !isMounted || !contactDocRef) return;

    let timer: ReturnType<typeof setTimeout>;
    const debouncedSave = (fieldName: string, value: any) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            setDocumentNonBlocking(contactDocRef, { [fieldName]: value }, { merge: true });
            toast({
                title: t('homeAdmin.toast.saved.title'),
                description: t('homeAdmin.toast.saved.description'),
            });
        }, 500);
    };

    const subscription = watch((value, { name, type }) => {
      if (name) {
        debouncedSave(name, value[name as keyof ContactInfo]);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [watch, contactDocRef, canEditContact, toast, isMounted]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Preloader />
        </div>
    );
  }

  return (
    <>
    <div className="flex-1 flex flex-col h-full">
      <div className="mb-6">
          <h2 className="text-xl font-headline">{t('contactAdmin.title')}</h2>
          <p className="text-muted-foreground">
              {t('contactAdmin.description')}
          </p>
      </div>
      <PageTextEditor
        titleKey="pageContent.contactTitle"
        descriptionKey="pageContent.contactDescription"
        fields={[
          { name: 'contactHeading', labelKey: 'pageContent.contactHeadingLabel', fallbackKey: 'contact.heading' },
          { name: 'contactSendButtonLabel', labelKey: 'pageContent.sendButtonLabel', fallbackKey: 'contactForm.submit.send' },
        ]}
      />
      <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
          <ScrollArea className="h-full">
              <div className="p-6">
                <Form {...form}>
                    <div className="space-y-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('contactAdmin.name')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.namePlaceholder')} {...field} />
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
                            <FormLabel>{t('contactAdmin.titleField')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.titlePlaceholder')} {...field} />
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
                            <FormLabel>{t('contactAdmin.avatarUrl')}</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input placeholder={t('contactAdmin.avatarUrlPlaceholder')} {...field} className="flex-1" />
                                </FormControl>
                                <Button type="button" variant="outline" size="icon" onClick={() => setIsLibraryOpen(true)}>
                                    <FontAwesomeIcon icon={faImages} />
                                </Button>
                            </div>
                            <FormDescription>{t('contactAdmin.avatarUrlDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('contactAdmin.email')}</FormLabel>
                            <FormControl>
                            <Input type="email" placeholder={t('contactAdmin.emailPlaceholder')} {...field} />
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
                            <FormLabel>{t('contactAdmin.whatsApp')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.whatsAppPlaceholder')} {...field} />
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
                            <FormLabel>{t('contactAdmin.behanceUrl')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.behanceUrlPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="behanceName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('contactAdmin.behanceName') || 'Behance Display Name'}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.behanceNamePlaceholder') || '@BeLofted'} {...field} />
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
                            <FormLabel>{t('contactAdmin.linkedinUrl')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.linkedinUrlPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="linkedinName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('contactAdmin.linkedinName') || 'LinkedIn Display Name'}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.linkedinNamePlaceholder') || 'Hicham Eljabbary'} {...field} />
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
                            <FormLabel>{t('contactAdmin.fiverrUrl')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.fiverrUrlPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fiverrName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('contactAdmin.fiverrName') || 'Fiverr Display Name'}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.fiverrNamePlaceholder') || 'your_username'} {...field} />
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
                            <FormLabel>{t('contactAdmin.instagramUrl')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.instagramUrlPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="instagramName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('contactAdmin.instagramName') || 'Instagram Display Name'}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.instagramNamePlaceholder') || '@your_username'} {...field} />
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
                            <FormLabel>{t('contactAdmin.facebookUrl')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.facebookUrlPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="facebookName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('contactAdmin.facebookName') || 'Facebook Display Name'}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.facebookNamePlaceholder') || 'Your Page Name'} {...field} />
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
                            <FormLabel>{t('contactAdmin.twitterUrl')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.twitterUrlPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="twitterName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('contactAdmin.twitterName') || 'Twitter Display Name'}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('contactAdmin.twitterNamePlaceholder') || '@your_username'} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                </Form>
              </div>
          </ScrollArea>
      </div>
      </div>
      <MediaAdmin
          isDialog={true}
          isOpen={isLibraryOpen}
          onOpenChange={setIsLibraryOpen}
          onMediaSelect={(url, type) => {
              if (type === 'image') {
                  form.setValue('avatarUrl', url, { shouldValidate: true });
              }
              setIsLibraryOpen(false);
          }}
          isSelectionMode={isLibraryOpen}
          onSelectionComplete={() => setIsLibraryOpen(false)}
          activeTab={libraryTab}
          setActiveTab={setLibraryTab}
          activeLibrary={libraryCollection}
          setActiveLibrary={setLibraryCollection}
          newlyUploadedId={null}
      />
    </>
  );
}
