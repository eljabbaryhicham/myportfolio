
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
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { useEffect } from 'react';
import Preloader from '@/components/preloader';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HomePageSettings {
    featuredProjectId: string;
}

const formSchema = z.object({
  featuredProjectId: z.string().min(1, { message: 'Please select a project.' }),
});

type HomeAdminFormValues = z.infer<typeof formSchema>;

export default function HomeAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();

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
        featuredProjectId: '',
    },
  });

  useEffect(() => {
    if (homeSettings?.featuredProjectId) {
      form.reset({ featuredProjectId: homeSettings.featuredProjectId });
    }
  }, [homeSettings, form]);

  const onSubmit = async (values: HomeAdminFormValues) => {
    if (!settingsDocRef) return;
    try {
        await setDoc(settingsDocRef, values, { merge: true });
        toast({
            title: 'Home Page Updated',
            description: 'The featured video has been successfully updated.',
        });
    } catch (e: any) {
        console.error("Failed to save homepage settings", e);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save settings. Please check console for details."
        })
    }
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
        <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
            <ScrollArea className="h-full">
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold">Home Page Settings</h2>
                        <p className="text-muted-foreground">
                            Choose the video to feature on your homepage.
                        </p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-lg mx-auto">
                        <FormField
                            control={form.control}
                            name="featuredProjectId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Featured Video</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a video to feature" />
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
                            <Button type="submit">Save Changes</Button>
                        </div>
                        </form>
                    </Form>
                </div>
            </ScrollArea>
        </div>
    </div>
  );
}
