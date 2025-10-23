
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { useEffect } from 'react';
import Preloader from '@/components/preloader';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppUser } from '@/firebase/auth/use-user';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface HomePageSettings {
    homePageBackgroundVideoId?: string;
    websiteBackgroundVideoId?: string;
    isVideoBackgroundEnabled?: boolean;
}

const settingsSchema = z.object({
  homePageBackgroundVideoId: z.string().optional(),
  websiteBackgroundVideoId: z.string().optional(),
  isVideoBackgroundEnabled: z.boolean().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function HomeAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEditHome = isSuperAdmin || (typedUser?.permissions?.canEditHome ?? true);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);

  const projectsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: portfolioItems, isLoading: isLoadingProjects } = useCollection<PortfolioItem>(projectsCollection);

  const videoItems = portfolioItems?.filter(item => item.type === 'video') || [];

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      homePageBackgroundVideoId: '',
      websiteBackgroundVideoId: '',
      isVideoBackgroundEnabled: true,
    },
  });

  useEffect(() => {
    if (homeSettings) {
      form.reset({
        homePageBackgroundVideoId: homeSettings.homePageBackgroundVideoId || '',
        websiteBackgroundVideoId: homeSettings.websiteBackgroundVideoId || '',
        isVideoBackgroundEnabled: homeSettings.isVideoBackgroundEnabled ?? true,
      });
    }
  }, [homeSettings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    if (!settingsDocRef || !canEditHome) return;
    
    setDocumentNonBlocking(settingsDocRef, { 
      ...values,
      isVideoBackgroundEnabled: values.isVideoBackgroundEnabled ?? true
    }, { merge: true });
    
    toast({
        title: 'Settings Saved',
        description: 'Your home page settings have been updated.',
    });
  };

  const isLoading = isLoadingSettings || isLoadingProjects;

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
            <h2 className="text-xl font-headline">Home Page Settings</h2>
            <p className="text-muted-foreground">
                Manage background videos and other global settings.
            </p>
        </div>
        <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
            <ScrollArea className="h-full">
                <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-lg mx-auto">
                            <fieldset disabled={!canEditHome} className="group space-y-8">
                                <FormField
                                    control={form.control}
                                    name="isVideoBackgroundEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 glass-effect">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Enable Video Background
                                                </FormLabel>
                                                <FormDescription>
                                                    Turn the site-wide video background on or off.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Separator />
                                <FormField
                                    control={form.control}
                                    name="homePageBackgroundVideoId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Homepage Background Video</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a video for the homepage" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                            {videoItems.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.title}
                                                </SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="websiteBackgroundVideoId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website Background Video (Other Pages)</FormLabel>
                                         <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a video for other pages" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                            {videoItems.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.title}
                                                </SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={!canEditHome}>Save All Settings</Button>
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
