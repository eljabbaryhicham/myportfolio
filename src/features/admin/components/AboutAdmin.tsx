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
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Preloader from '@/components/preloader';
import { ScrollArea } from '@/components/ui/scroll-area';
import MediaAdmin from './MediaAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages } from '@fortawesome/free-solid-svg-icons';
import ClientAdmin from './ClientAdmin';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }),
});

type AboutFormValues = z.infer<typeof formSchema>;

interface AboutPageContent extends AboutFormValues {}

export default function AboutAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const isSuperAdmin = user?.email === 'eljabbaryhicham@example.com';
  const canEditAbout = isSuperAdmin || (user?.permissions?.canEditAbout ?? true);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video', filename: string) => void } | null>(null);

  const aboutContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'about', 'content') : null),
    [firestore]
  );
  const { data: aboutContent, isLoading } = useDoc<AboutPageContent>(aboutContentRef);

  const form = useForm<AboutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (aboutContent) {
      form.reset(aboutContent);
    }
  }, [aboutContent, form]);

  useEffect(() => {
    if (!canEditAbout) {
      Object.keys(form.getValues()).forEach(key => {
        form.control.getFieldState(key as keyof AboutFormValues).isDirty = false;
      });
    }
  }, [canEditAbout, form]);

  const onSubmit = (values: AboutFormValues) => {
    if (!aboutContentRef || !canEditAbout) return;
    setDocumentNonBlocking(aboutContentRef, values, { merge: true });
    toast({
      title: 'About Page Updated',
      description: 'Your "About Us" page has been successfully updated.',
    });
  };

  const handleChooseImage = () => {
    if (!canEditAbout) return;
    setLibrarySelectionConfig({
      onSelect: (url, type) => {
        if (type === 'image') {
          form.setValue('imageUrl', url, { shouldValidate: true });
        } else {
          toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select an image.' });
        }
        setIsLibraryOpen(false);
      },
    });
    setIsLibraryOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Preloader />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full gap-8 min-h-0">
        {/* About Page Content Section */}
        <div className="flex flex-col min-h-0">
          <div className="mb-6 flex-shrink-0">
            <h2 className="text-xl font-bold">About Page Content</h2>
            <p className="text-muted-foreground">Update the content displayed on your public "About Us" page.</p>
          </div>
          <div className="border rounded-lg overflow-hidden glass-effect flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <fieldset disabled={!canEditAbout} className="group">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heading</FormLabel>
                            <FormControl>
                              <Input placeholder="About Section Heading" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paragraph</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Write your paragraph here..." className="min-h-[150px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/your-image.png" {...field} />
                              </FormControl>
                              <Button type="button" variant="outline" size="icon" onClick={handleChooseImage}>
                                <FontAwesomeIcon icon={faImages} />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={!canEditAbout}>Save Changes</Button>
                      </div>
                    </fieldset>
                  </form>
                </Form>
              </div>
            </ScrollArea>
          </div>
        </div>

        <Separator className='bg-white/10 flex-shrink-0' />

        {/* Client Management Section */}
        <div className="flex flex-col min-h-0">
          <ClientAdmin />
        </div>
      </div>
      <MediaAdmin
        isDialog={true}
        isOpen={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        onMediaSelect={(url, type, filename) => {
          if (librarySelectionConfig?.onSelect) {
            librarySelectionConfig.onSelect(url, type, filename);
          }
        }}
        isSelectionMode={!!librarySelectionConfig}
        onSelectionComplete={() => {
          setIsLibraryOpen(false);
          setLibrarySelectionConfig(null);
        }}
        activeTab={'images'}
        setActiveTab={() => {}}
        newlyUploadedId={null}
      />
    </>
  );
}
