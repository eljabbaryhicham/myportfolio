
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Preloader from '@/components/preloader';
import type { AppUser } from '@/firebase/auth/use-user';
import { useTranslation } from '@/lib/i18n/useTranslation';

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

type ContactInfo = z.infer<typeof formSchema>;

const defaultFormValues: ContactInfo = {
    avatarUrl: '',
    name: '',
    title: '',
    email: '',
    whatsApp: '',
    behanceUrl: '',
    linkedinUrl: '',
    fiverrUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
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

  const form = useForm<ContactInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (contactInfo) {
        const values: ContactInfo = {
            avatarUrl: contactInfo.avatarUrl || '',
            name: contactInfo.name || '',
            title: contactInfo.title || '',
            email: contactInfo.email || '',
            whatsApp: contactInfo.whatsApp || '',
            behanceUrl: contactInfo.behanceUrl || '',
            linkedinUrl: contactInfo.linkedinUrl || '',
            fiverrUrl: contactInfo.fiverrUrl || '',
            instagramUrl: contactInfo.instagramUrl || '',
            facebookUrl: contactInfo.facebookUrl || '',
            twitterUrl: contactInfo.twitterUrl || '',
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

  const onSubmit = (values: ContactInfo) => {
    if (!contactDocRef || !canEditContact) return;
    setDocumentNonBlocking(contactDocRef, values, { merge: true });
    toast({
      title: t('contactAdmin.toast.saved.title'),
      description: t('contactAdmin.toast.saved.description'),
    });
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Preloader />
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="mb-6">
          <h2 className="text-xl font-headline">{t('contactAdmin.title')}</h2>
          <p className="text-muted-foreground">
              {t('contactAdmin.description')}
          </p>
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
          <ScrollArea className="h-full">
              <div className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <fieldset disabled={!canEditContact} className="group">
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
                            <div className="flex gap-2">
                                <FormControl>
                                    <Input placeholder={t('contactAdmin.avatarUrlPlaceholder')} {...field} className="flex-1" />
                                </FormControl>
                                <Select onValueChange={(val) => field.onChange(val)} value="">
                                    <SelectTrigger className="w-auto whitespace-nowrap">
                                        <SelectValue placeholder={t('homeAdmin.chooseFromLibrary')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {imageAssets.map((asset) => (
                                            <SelectItem key={asset.id} value={asset.url}>
                                                {asset.title || asset.filename}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={!canEditContact}>{t('contactAdmin.save')}</Button>
                    </div>
                    </fieldset>
                    </form>
                </Form>
              </div>
          </ScrollArea>
      </div>
    </div>
  );
}
