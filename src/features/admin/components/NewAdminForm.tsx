
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
import { useAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { firebaseConfig } from '@/firebase/config';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers.'),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

type RegisterFormValues = z.infer<typeof formSchema>;

interface NewAdminFormProps {
    onSuccess: () => void;
}

export default function NewAdminForm({ onSuccess }: NewAdminFormProps) {
  const { t } = useTranslation();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const handleSignUp = async (values: RegisterFormValues) => {
    if (!auth || !firestore) return;
    setIsSubmitting(true);

    const email = `${values.username.toLowerCase()}@example.com`;
    try {
      // Check if username is already taken in Firestore
      const usersQuery = query(collection(firestore, 'users'), where('username', '==', values.username));
      const existingUsers = await getDocs(usersQuery);
      if (!existingUsers.empty) {
        toast({
          variant: 'destructive',
          title: t('newAdmin.toast.error.title'),
          description: t('newAdmin.toast.error.description'),
        });
        setIsSubmitting(false);
        return;
      }

      // Use Firebase Auth REST API to create user WITHOUT signing them in on this client.
      // createUserWithEmailAndPassword auto-signs in the new user, which replaces the super admin session.
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: values.password, returnSecureToken: true }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.message === 'EMAIL_EXISTS') {
          toast({
            variant: 'destructive',
            title: t('newAdmin.toast.error.title'),
            description: t('newAdmin.toast.error.description'),
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('newAdmin.toast.error.title'),
            description: errorData.error?.message || 'Failed to create admin user.',
          });
        }
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();
      const newUid = result.localId;

      // Write the user document to Firestore (blocking — must complete before we're done)
      await setDoc(doc(firestore, 'users', newUid), {
        uid: newUid,
        username: values.username,
        email,
        role: 'admin',
        createdAt: new Date().toISOString(),
        permissions: {
          canUploadMedia: true,
          canDeleteMedia: false,
          canEditProjects: true,
          canEditAbout: false,
          canEditContact: false,
          canEditHome: false,
        }
      });

      toast({
        title: t('newAdmin.toast.created.title'),
        description: t('newAdmin.toast.created.description').replace('{username}', values.username),
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('newAdmin.toast.error.title'),
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6 pt-4">
        <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
            <FormItem>
                <FormLabel>{t('newAdmin.username')}</FormLabel>
                <FormControl>
                <Input placeholder={t('newAdmin.usernamePlaceholder')} {...field} autoComplete="off" />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
            <FormItem>
                <FormLabel>{t('newAdmin.password')}</FormLabel>
                <FormControl>
                <Input type="password" placeholder={t('newAdmin.passwordPlaceholder')} {...field} autoComplete="new-password" />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onSuccess}>{t('newAdmin.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('newAdmin.creating') : t('newAdmin.createAdmin')}
            </Button>
        </div>
        </form>
    </Form>
  );
}
