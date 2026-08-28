
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
import { useAuth, useUser } from '@/firebase';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

const formSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(30, { message: 'Username is too long.' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscore.' }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  // The invite code is checked SERVER-side in /api/auth/register-claim.
  // We only do a non-empty + length check here so the client never holds
  // the real code in its bundle.
  inviteCode: z.string().min(1, { message: 'Invitation code is required.' }).max(200),
});

type RegisterFormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/admin');
    }
  }, [isUserLoading, user, router]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      inviteCode: '',
    },
  });

  const handleSignUp = async (values: RegisterFormValues) => {
    if (!auth) return;
    setIsSubmitting(true);

    try {
      // 1. Create the Auth user + user doc server-side (Admin SDK). The server
      //    checks the invite code against REGISTER_INVITE_CODE (server-only env).
      const claimRes = await fetch('/api/auth/register-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          code: values.inviteCode,
        }),
      });

      if (!claimRes.ok) {
        const errBody = await claimRes.json().catch(() => ({}));
        const message = errBody?.error || 'Could not create account.';
        // 401 means the code was wrong — show a field-level error on the
        // invite code input. Everything else is a generic toast.
        if (claimRes.status === 401) {
          form.setError('inviteCode', { message });
        } else {
          toast({ variant: 'destructive', title: t('register.toast.error.title'), description: message });
        }
        return;
      }

      // 2. Sign the new user in. Admin SDK does not produce a client session,
      //    so we sign in via the Firebase client SDK.
      const { email } = await claimRes.json();
      await signInWithEmailAndPassword(auth, email, values.password);

      toast({
        title: t('register.toast.success.title'),
        description: t('register.toast.success.description'),
      });
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('register.toast.error.title'),
        description: error?.message || t('register.toast.error.description'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || user) {
    return null;
  }

  return (
    <div className="flex h-full min-h-full w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full md:w-1/2"
      >
        <Card className="glass-effect">
          <CardHeader>
              <CardTitle className="text-2xl font-headline">{t('register.title')}</CardTitle>
              <CardDescription>
                  {t('register.subtitle')}
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6 pt-4">
                  <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>{t('register.username')}</FormLabel>
                          <FormControl>
                          <Input placeholder={t('register.usernamePlaceholder')} {...field} />
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
                          <FormLabel>{t('register.password')}</FormLabel>
                          <FormControl>
                          <Input type="password" placeholder={t('register.passwordPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="inviteCode"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>{t('register.secretCode')}</FormLabel>
                          <FormControl>
                          <Input type="password" placeholder={t('register.secretCodePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? t('register.signingIn') : t('register.signIn')}
                  </Button>
                  </form>
              </Form>
              <div className="mt-4 text-center text-sm">
                <Link href="/login" className="underline text-muted-foreground hover:text-foreground">
                  {t('register.signInLink')}
                </Link>
              </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

    