
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
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
import { collection, doc, DocumentReference } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { useEffect } from 'react';
import Preloader from '@/components/preloader';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppUser } from '@/firebase/auth/use-user';

interface HomePageSettings {
    homePageBackgroundVideoId?: string;
    websiteBackgroundVideoId?: string;
}

const homePageSchema = z.object({
  homePageBackgroundVideoId: z.string().min(1, { message: 'Please select a project.' }),
});
const websiteSchema = z.object({
  websiteBackgroundVideoId: z.string().min(1, { message: 'Please select a background video.' }),
});

type HomePageFormValues = z.infer<typeof homePageSchema>;
type WebsiteFormValues = z.infer<typeof websiteSchema>;

interface BackgroundVideoFormProps {
    form: UseFormReturn<any>;
    onSubmit: (values: any) => void;
    fieldName: "homePageBackgroundVideoId" | "websiteBackgroundVideoId";
    label: string;
    placeholder: string;
    videoItems: PortfolioItem[];
    canEdit: boolean;
}

function BackgroundVideoForm({ form, onSubmit, fieldName, label, placeholder, videoItems, canEdit }: BackgroundVideoFormProps) {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <div className="flex gap-4">
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={placeholder} />
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
                        <Button type="submit" disabled={!canEdit}>Save</Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}

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

  const homePageForm = useForm<HomePageFormValues>({
    resolver: zodResolver(homePageSchema),
    defaultValues: { homePageBackgroundVideoId: '' },
  });

  const websiteForm = useForm<WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: { websiteBackgroundVideoId: '' },
  });

  useEffect(() => {
    if (homeSettings) {
      homePageForm.reset({ homePageBackgroundVideoId: homeSettings.homePageBackgroundVideoId || '' });
      websiteForm.reset({ websiteBackgroundVideoId: homeSettings.websiteBackgroundVideoId || '' });
    }
  }, [homeSettings, homePageForm, websiteForm]);

  const handleSave = (fieldName: string, value: string, successMessage: string) => {
    if (!settingsDocRef || !canEditHome) return;
    
    setDocumentNonBlocking(settingsDocRef, { [fieldName]: value }, { merge: true });
    
    toast({
        title: 'Setting Saved',
        description: successMessage,
    });
  };

  const onHomePageSubmit = (values: HomePageFormValues) => {
    handleSave('homePageBackgroundVideoId', values.homePageBackgroundVideoId, 'Homepage background video has been updated.');
  };

  const onWebsiteSubmit = (values: WebsiteFormValues) => {
    handleSave('websiteBackgroundVideoId', values.websiteBackgroundVideoId, 'Website background video has been updated.');
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
                    <div className="space-y-8 max-w-lg mx-auto">
                        <BackgroundVideoForm
                            form={homePageForm}
                            onSubmit={onHomePageSubmit}
                            fieldName="homePageBackgroundVideoId"
                            label="Homepage Background Video"
                            placeholder="Select a video for the homepage background"
                            videoItems={videoItems}
                            canEdit={canEditHome}
                        />
                         <BackgroundVideoForm
                            form={websiteForm}
                            onSubmit={onWebsiteSubmit}
                            fieldName="websiteBackgroundVideoId"
                            label="Website Background Video (Other Pages)"
                            placeholder="Select a video for the site background"
                            videoItems={videoItems}
                            canEdit={canEditHome}
                        />
                    </div>
                </div>
            </ScrollArea>
        </div>
    </div>
  );
}
