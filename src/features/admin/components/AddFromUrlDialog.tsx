
'use client';

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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  mediaUrl: z.string().url({ message: 'Please enter a valid URL.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddFromUrlDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploadComplete: (mediaId: string, resourceType: 'image' | 'video') => void;
}

export default function AddFromUrlDialog({ isOpen, onOpenChange, onUploadComplete }: AddFromUrlDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { mediaUrl: '' },
  });

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
        // Only allow closing if not submitting, or reset state
        if (isSubmitting) return;
        form.reset();
        setProgress(0);
    }
    onOpenChange(open);
  }

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await uploadMediaFromUrl(values);
      if (result.success && result.mediaId) {
        setProgress(100);
        toast({
          title: 'Upload Successful',
          description: result.message,
        });
        onUploadComplete(result.mediaId, result.resource_type || 'image');
        setTimeout(() => {
          onOpenChange(false);
          setIsSubmitting(false);
        }, 500); // Wait for progress bar to show 100%
      } else {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: result.message,
          duration: 8000,
        });
        setIsSubmitting(false);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unexpected error occurred during upload.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-effect w-[80vw] max-w-[50vw]">
        <DialogHeader>
          <DialogTitle>Add Media from URL</DialogTitle>
          <DialogDescription>
            Paste a direct link to an image or video to add it to your library.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <fieldset disabled={isSubmitting}>
              <FormField
                control={form.control}
                name="mediaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            {isSubmitting && (
                <div className="space-y-2 pt-4 text-center">
                    <p className="text-sm text-muted-foreground">Please wait, adding to library...</p>
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                </div>
            )}

            <DialogFooter className="pt-4">
               <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>Cancel</Button>
               <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Adding...' : 'Add to Library'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        {!isSubmitting && (
            <DialogClose asChild>
                <button className={cn(
                    "absolute right-4 top-4 h-8 w-8",
                    "flex items-center justify-center rounded-full transition-opacity",
                    "bg-destructive text-destructive-foreground opacity-70 hover:opacity-100",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "disabled:pointer-events-none"
                )}>
                    <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}
