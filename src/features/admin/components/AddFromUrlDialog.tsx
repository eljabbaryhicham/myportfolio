
'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { uploadMediaFromUrl } from '@/ai/flows/upload-media-from-url';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, DocumentReference } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faXmark, faMinus } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  mediaUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  libraryId: z.enum(['primary', 'extented']),
  videoFormat: z.enum(['mp4', 'm3u8', 'webm']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddFromUrlDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploadComplete: (mediaId: string, resourceType: 'image' | 'video', libraryId: 'primary' | 'extented') => void;
}

export default function AddFromUrlDialog({ isOpen, onOpenChange, onUploadComplete }: AddFromUrlDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVideoUrl, setIsVideoUrl] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { mediaUrl: '', libraryId: 'primary', videoFormat: 'mp4' },
  });

  const mediaUrl = form.watch('mediaUrl');

  useEffect(() => {
    const videoExtensions = ['.mp4', '.mov', '.webm', '.m3u8', '.mpd'];
    const isVideo = videoExtensions.some(ext => mediaUrl.toLowerCase().endsWith(ext));
    setIsVideoUrl(isVideo);
    if (!isVideo) {
      form.setValue('videoFormat', undefined);
    } else if (!form.getValues('videoFormat')) {
      form.setValue('videoFormat', 'mp4');
    }
  }, [mediaUrl, form]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isSubmitting) {
      setProgress(0); // Reset progress on new submission
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            return prev; // Hold at 95% until upload completes
          }
          return prev + 5;
        });
      }, 300);
    } else {
        setProgress(0);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isSubmitting]);
  
  const handleClose = (open: boolean) => {
    if (!open) {
        form.reset();
        setProgress(0);
    }
    onOpenChange(open);
  }

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await uploadMediaFromUrl(values);
      if (result.success && result.media && firestore) {
        if (result.media.resource_type === 'raw') {
          toast({
            variant: 'destructive',
            title: t('addFromUrl.toast.unsupported.title'),
            description: t('addFromUrl.toast.unsupported.description'),
            duration: 8000,
          });
          setIsSubmitting(false);
          return;
        }
        setProgress(100);
        const docRef = await addDocumentNonBlocking(collection(firestore, 'media'), { ...result.media }) as DocumentReference | undefined;
        if (docRef) {
          toast({
            title: t('addFromUrl.toast.success.title'),
            description: result.message,
          });
          onUploadComplete(docRef.id, result.media.resource_type as 'image' | 'video', values.libraryId);
        } else {
          toast({
            variant: 'destructive',
            title: t('addFromUrl.toast.failed.title'),
            description: 'Could not save the media to the library.',
            duration: 8000,
          });
        }
        setTimeout(() => {
          onOpenChange(false);
          setIsSubmitting(false);
        }, 500); // Wait for progress bar to show 100%
      } else {
        toast({
          variant: 'destructive',
          title: t('addFromUrl.toast.failed.title'),
          description: result.message,
          duration: 8000,
        });
        setIsSubmitting(false);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('addFromUrl.toast.error.title'),
        description: error.message || 'An unexpected error occurred during upload.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-effect w-[80vw]">
        <DialogHeader>
          <DialogTitle>{t('addFromUrl.title')}</DialogTitle>
          <DialogDescription>
            {t('addFromUrl.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <fieldset disabled={isSubmitting} className="space-y-4">
              <FormField
                control={form.control}
                name="mediaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addFromUrl.mediaUrl')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addFromUrl.mediaUrlPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="libraryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addFromUrl.library')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('addFromUrl.libraryPlaceholder')} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="primary">{t('addFromUrl.libraryPrimary')}</SelectItem>
                            <SelectItem value="extented">{t('addFromUrl.libraryExtented')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isVideoUrl && (
                <FormField
                  control={form.control}
                  name="videoFormat"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t('addFromUrl.videoFormat')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="mp4" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('addFromUrl.mp4')}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="m3u8" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('addFromUrl.m3u8')}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="webm" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('addFromUrl.webm')}
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </fieldset>

            {isSubmitting && (
                <div className="space-y-2 pt-4 text-center">
                    <p className="text-sm text-muted-foreground">{t('addFromUrl.adding')}</p>
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                </div>
            )}

            <DialogFooter className="pt-4">
               <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                 {isSubmitting ? 'Minimize' : t('addFromUrl.cancel')}
               </Button>
               <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t('addFromUrl.addingButton') : t('addFromUrl.addToLibrary')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        {isSubmitting ? (
            <button
                onClick={() => handleClose(false)}
                className={cn(
                    "absolute right-4 top-4 h-8 w-8",
                    "flex items-center justify-center rounded-full transition-opacity",
                    "bg-primary text-primary-foreground opacity-70 hover:opacity-100",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
            >
                <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
                <span className="sr-only">Minimize</span>
            </button>
        ) : (
            <DialogClose asChild>
                <button className={cn(
                    "absolute right-4 top-4 h-8 w-8",
                    "flex items-center justify-center rounded-full transition-opacity",
                    "bg-destructive text-destructive-foreground opacity-70 hover:opacity-100",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "disabled:pointer-events-none"
                )}>
                    <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                    <span className="sr-only">{t('addFromUrl.close')}</span>
                </button>
            </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}
