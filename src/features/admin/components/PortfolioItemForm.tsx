
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faImages } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';


const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  type: z.enum(['image', 'video']),
  thumbnailUrl: z.string().url({ message: 'Please enter a valid URL for the grid thumbnail.' }),
  videoPosterUrl: z.string().url({ message: 'Please enter a valid URL for the video poster.' }).optional().or(z.literal('')),
  sourceUrl: z.string().url({ message: 'Please enter a valid URL for the main media.' }).optional().or(z.literal('')),
  details: z.string().optional(),
  thumbnailHint: z.string().optional(),
  featured: z.boolean().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
});

type PortfolioItemFormValues = z.infer<typeof formSchema>;

interface PortfolioItemFormProps {
  item: PortfolioItem | null;
  onSubmit: (values: PortfolioItem) => void;
  isOpen: boolean; 
  setIsOpen: (isOpen: boolean) => void;
  onChooseFromLibrary: (onSelect: (url: string, type: 'image' | 'video', filename: string) => void) => void;
  canEdit: boolean;
}

export function PortfolioItemFormSheet({isOpen, setIsOpen, item, onSubmit, onChooseFromLibrary, canEdit}: PortfolioItemFormProps) {
    const { toast } = useToast();

    const form = useForm<PortfolioItemFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: '',
        description: '',
        type: 'image',
        thumbnailUrl: '',
        videoPosterUrl: '',
        sourceUrl: '',
        thumbnailHint: '',
        featured: false,
        details: '',
        order: undefined,
        isVisible: true,
      }
    });

    const itemType = useWatch({
      control: form.control,
      name: 'type',
    });
  
    useEffect(() => {
      if (isOpen) {
        const defaultValues = item ? {
            ...item,
            featured: item.featured || false,
            thumbnailHint: item.thumbnailHint || '',
            videoPosterUrl: item.videoPosterUrl || '',
            details: item.details || '',
            sourceUrl: item.sourceUrl || '',
            order: item.order ?? 0,
            isVisible: item.isVisible ?? true,
        } : {
            title: '',
            description: '',
            type: 'image' as 'image' | 'video',
            thumbnailUrl: '',
            videoPosterUrl: '',
            sourceUrl: '',
            thumbnailHint: '',
            featured: false,
            details: '',
            order: undefined, // Let parent component decide the order for new items
            isVisible: true,
        };
        form.reset(defaultValues);
      }
    }, [isOpen, item, form]);
    
    useEffect(() => {
        if (!canEdit) {
            Object.keys(form.getValues()).forEach(key => {
                form.control.getFieldState(key as keyof PortfolioItemFormValues).isDirty = false;
            });
        }
    }, [canEdit, form, isOpen]);


    const handleSubmit = (values: PortfolioItemFormValues) => {
        if (!canEdit) return;
        onSubmit({
          id: item?.id || '', // id will be handled by parent
          ...values,
          thumbnailHint: values.thumbnailHint || '',
          videoPosterUrl: values.videoPosterUrl || '',
          isVisible: values.isVisible ?? true,
        });
    };

    const handleChooseThumbnail = () => {
        onChooseFromLibrary((url, type) => {
            if (type !== 'image') {
              toast({ variant: 'destructive', title: 'Invalid Thumbnail', description: 'Thumbnails must be an image file.'});
              return;
            }
            form.setValue('thumbnailUrl', url, { shouldValidate: true });
        });
    };

    const handleChooseVideoPoster = () => {
        onChooseFromLibrary((url, type) => {
            if (type !== 'image') {
              toast({ variant: 'destructive', title: 'Invalid Poster', description: 'Video posters must be an image file.'});
              return;
            }
            form.setValue('videoPosterUrl', url, { shouldValidate: true });
        });
    };

    const handleChooseSource = () => {
        onChooseFromLibrary((url, type, filename) => {
            form.setValue('sourceUrl', url, { shouldValidate: true });
            form.setValue('type', type, { shouldValidate: true });
             // If it's a new item, set the title from the filename
            if (!item?.id) {
                const title = filename.split('.').slice(0, -1).join('.');
                form.setValue('title', title, { shouldValidate: true });
            }
        });
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="w-[80vw] max-w-[80vw] h-[90vh] flex flex-col glass-effect p-0 rounded-lg">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="font-headline">{item ? 'Edit' : 'Add'} Portfolio Item</DialogTitle>
                    <DialogDescription>
                        {item ? 'Update the details of your portfolio item.' : 'Add a new item to your portfolio.'}
                        {!canEdit && <span className="text-destructive font-bold block mt-2"> (Read-only)</span>}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 -mr-2">
                  <div className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        <fieldset disabled={!canEdit} className="group space-y-8">
                          <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                  <Input placeholder="Project Title" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                  <Textarea placeholder="A short description of the project" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="details"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Project Details</FormLabel>
                              <FormControl>
                                  <Textarea
                                  placeholder="Add rich details about the project. You can use Markdown for formatting."
                                  className="min-h-[150px]"
                                  {...field}
                                  />
                              </FormControl>
                              <FormDescription>
                                Use Markdown for styling. Images: `![alt](url)`. Videos: `&lt;video src="url" controls /&gt;`.
                              </FormDescription>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a type" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  <SelectItem value="image">Image</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="thumbnailUrl"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grid Thumbnail URL</FormLabel>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                      <Input placeholder="https://example.com/thumbnail.jpg" {...field} />
                                  </FormControl>
                                  <Button type="button" variant="outline" size="sm" onClick={handleChooseThumbnail}>
                                      <FontAwesomeIcon icon={faImages} />
                                      <span className="ml-2 hidden sm:inline">Library</span>
                                  </Button>
                                </div>
                                <FormDescription>Image shown in the main portfolio grid.</FormDescription>
                                <FormMessage />
                              </FormItem>
                          )}
                          />
                          {itemType === 'video' && (
                             <FormField
                              control={form.control}
                              name="videoPosterUrl"
                              render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Video Poster URL</FormLabel>
                                    <div className="flex items-center gap-2">
                                      <FormControl>
                                          <Input placeholder="https://example.com/video-poster.jpg" {...field} />
                                      </FormControl>
                                      <Button type="button" variant="outline" size="sm" onClick={handleChooseVideoPoster}>
                                          <FontAwesomeIcon icon={faImages} />
                                          <span className="ml-2 hidden sm:inline">Library</span>
                                      </Button>
                                    </div>
                                    <FormDescription>Image shown before a video plays. If blank, the grid thumbnail is used.</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                              )}
                              />
                          )}
                          <FormField
                          control={form.control}
                          name="thumbnailHint"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Thumbnail Hint</FormLabel>
                              <FormControl>
                                  <Input placeholder="e.g. 'abstract art'" {...field} />
                              </FormControl>
                              <FormDescription>
                                  AI hint for image generation (1-2 words).
                              </FormDescription>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="sourceUrl"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>Source Media URL</FormLabel>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                      <Input placeholder="https://example.com/full-image.jpg" {...field} />
                                  </FormControl>
                                   <Button type="button" variant="outline" size="sm" onClick={handleChooseSource}>
                                    <FontAwesomeIcon icon={faImages} />
                                    <span className="ml-2 hidden sm:inline">Library</span>
                                  </Button>
                                </div>
                                <FormDescription>The full-size image or the main video file.</FormDescription>
                                <FormMessage />
                              </FormItem>
                          )}
                          />
                           <FormField
                            control={form.control}
                            name="order"
                            render={({ field: { onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Order</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...fieldProps}
                                            value={fieldProps.value ?? ''}
                                            onChange={event => {
                                                const value = event.target.value;
                                                onChange(value === '' ? undefined : Number(value));
                                            }}
                                            />
                                    </FormControl>
                                    <FormDescription>
                                        The display order of the project. Leave blank for new items to be added to the start.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={form.control}
                                name="isVisible"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 glass-effect">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Visible
                                            </FormLabel>
                                            <FormDescription>
                                                Make this project visible on the public work page.
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
                          <div className="flex justify-end space-x-4 pt-4">
                              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                              <Button type="submit">Save</Button>
                          </div>
                        </fieldset>
                      </form>
                      </Form>
                  </div>
                </ScrollArea>
                <DialogClose className={cn(
                  "absolute right-4 top-4 h-8 w-8",
                  "flex items-center justify-center rounded-full transition-opacity",
                  "bg-destructive text-destructive-foreground opacity-70 hover:opacity-100",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:pointer-events-none"
                )}>
                    <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
            </DialogContent>
        </Dialog>
    )
}

    