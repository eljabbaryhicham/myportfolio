
'use-client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import type { PortfolioItem } from '@/lib/portfolio-data';
import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  type: z.enum(['image', 'video']),
  thumbnailUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  sourceUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  details: z.string().optional(),
  thumbnailHint: z.string().optional(),
  featured: z.boolean().optional(),
});

type PortfolioItemFormValues = z.infer<typeof formSchema>;

interface PortfolioItemFormProps {
  item: PortfolioItem | null;
  onSubmit: (values: PortfolioItem) => void;
  isOpen: boolean; 
  setIsOpen: (isOpen: boolean) => void;
}

export function PortfolioItemFormSheet({isOpen, setIsOpen, item, onSubmit}: PortfolioItemFormProps) {
    const form = useForm<PortfolioItemFormValues>({
      resolver: zodResolver(formSchema),
    });
  
    useEffect(() => {
      if (isOpen) {
        const defaultValues = item ? {
            ...item,
            featured: item.featured || false,
            thumbnailHint: item.thumbnailHint || '',
            details: item.details || '',
        } : {
            title: '',
            description: '',
            type: 'image' as 'image' | 'video',
            thumbnailUrl: '',
            sourceUrl: '',
            thumbnailHint: '',
            featured: false,
            details: '',
        };
        form.reset(defaultValues);
      }
    }, [isOpen, item, form]);

    const handleSubmit = (values: PortfolioItemFormValues) => {
        onSubmit({
          id: item?.id || '', // id will be handled by parent
          ...values,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="w-full max-w-[50vw] h-[90vh] flex flex-col glass-effect p-0 rounded-lg">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{item ? 'Edit' : 'Add'} Portfolio Item</DialogTitle>
                    <DialogDescription>
                        {item ? 'Update the details of your portfolio item.' : 'Add a new item to your portfolio.'}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 -mr-2">
                  <div className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              <FormLabel>Thumbnail URL</FormLabel>
                              <FormControl>
                                  <Input placeholder="https://example.com/thumbnail.jpg" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
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
                              <FormLabel>Source URL</FormLabel>
                              <FormControl>
                                  <Input placeholder="https://example.com/full-image.jpg" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <div className="flex justify-end space-x-4 pt-4">
                              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                              <Button type="submit">Save</Button>
                          </div>
                      </form>
                      </Form>
                  </div>
                </ScrollArea>
                <DialogClose className={cn(
                  "absolute right-4 top-4 h-8 w-8",
                  "flex items-center justify-center rounded-full transition-opacity",
                  "glass-effect text-destructive opacity-70 hover:opacity-100 border border-destructive/50",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:pointer-events-none"
                )}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
            </DialogContent>
        </Dialog>
    )
}
