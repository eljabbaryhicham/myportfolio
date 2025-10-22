
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
import { Separator } from '@/components/ui/separator';

interface HomePageSettings {
    homePageBackgroundVideoId?: string;
    websiteBackgroundVideoId?: string;
}

const formSchema = z.object({
  homePageBackgroundVideoId: z.string().min(1, { message: 'Please select a project.' }),
  websiteBackgroundVideoId: z.string().min(1, { message: 'Please select a background video.' }),
});

type HomeAdminFormValues = z.infer<typeof formSchema>;

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

  const form = useForm<HomeAdminFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        homePageBackgroundVideoId: '',
        websiteBackgroundVideoId: '',
    },
  });

  useEffect(() => {
    if (homeSettings) {
      form.reset({ 
          homePageBackgroundVideoId: homeSettings.homePageBackgroundVideoId || '',
          websiteBackgroundVideoId: homeSettings.websiteBackgroundVideoId || '',
       });
    }
  }, [homeSettings, form]);

  useEffect(() => {
    if (!canEditHome) {
      Object.keys(form.getValues()).forEach(key => {
        form.control.getFieldState(key as keyof HomeAdminFormValues).isDirty = false;
      });
    }
  }, [canEditHome, form]);

  const onSubmit = (values: HomeAdminFormValues) => {
    if (!settingsDocRef || !canEditHome) return;
    
    setDocumentNonBlocking(settingsDocRef, values, { merge: true });
    
    toast({
        title: 'Home Page Updated',
        description: 'The background videos have been successfully updated.',
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
                Choose the background videos for your homepage and the rest of the site.
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
                            name="homePageBackgroundVideoId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Homepage Background Video</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a video for the homepage background" />
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
                        <Separator />
                        <FormField
                            control={form.control}
                            name="websiteBackgroundVideoId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website Background Video (Other Pages)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a video for the site background" />
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
                            <Button type="submit" disabled={!canEditHome}>Save Changes</Button>
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
