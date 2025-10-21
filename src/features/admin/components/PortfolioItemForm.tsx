
'use client';

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
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faImages, faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';


const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  type: z.enum(['image', 'video']),
  thumbnailUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  sourceUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  details: z.string().optional(),
  thumbnailHint: z.string().optional(),
  featured: z.boolean().optional(),
  order: z.number().optional(),
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
    const firestore = useFirestore();

    const [uploadingField, setUploadingField] = useState<null | 'thumbnail' | 'source'>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const thumbnailUploadRef = useRef<HTMLInputElement>(null);
    const sourceUploadRef = useRef<HTMLInputElement>(null);

    const form = useForm<PortfolioItemFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: '',
        description: '',
        type: 'image',
        thumbnailUrl: '',
        sourceUrl: '',
        thumbnailHint: '',
        featured: false,
        details: '',
        order: undefined,
      }
    });
  
    useEffect(() => {
      if (isOpen) {
        const defaultValues = item ? {
            ...item,
            featured: item.featured || false,
            thumbnailHint: item.thumbnailHint || '',
            details: item.details || '',
            sourceUrl: item.sourceUrl || '',
            order: item.order ?? 0,
        } : {
            title: '',
            description: '',
            type: 'image' as 'image' | 'video',
            thumbnailUrl: '',
            sourceUrl: '',
            thumbnailHint: '',
            featured: false,
            details: '',
            order: undefined, // Let parent component decide the order for new items
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

    const handleUpload = useCallback(async (file: File, field: 'thumbnail' | 'source') => {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'da1srnoer';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'belofted';
      
      setUploadingField(field);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = async () => {
        setUploadingField(null);
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const finalUrl = data.secure_url;
            
            if (firestore) {
                addDocumentNonBlocking(collection(firestore, 'media'), {
                    public_id: data.public_id,
                    url: finalUrl,
                    resource_type: data.resource_type,
                    created_at: data.created_at,
                    filename: file.name,
                });
            }
            
            toast({ title: 'Upload successful', description: `${file.name} has been uploaded.` });
            
            const resourceType = data.resource_type === 'video' ? 'video' : 'image';

            if(field === 'thumbnail') {
              if (resourceType !== 'image') {
                toast({ variant: 'destructive', title: 'Invalid Thumbnail', description: 'Thumbnails must be an image file.'});
              } else {
                form.setValue('thumbnailUrl', finalUrl, { shouldValidate: true });
              }
            } else if (field === 'source') {
              form.setValue('sourceUrl', finalUrl, { shouldValidate: true });
              form.setValue('type', resourceType, { shouldValidate: true });
              
              if (!item?.id) {
                const title = file.name.split('.').slice(0, -1).join('.');
                form.setValue('title', title, { shouldValidate: true });
              }
            }
        } else {
             const errorData = JSON.parse(xhr.responseText);
             toast({ variant: 'destructive', title: `Upload Failed for ${file.name}`, description: errorData.error.message || 'An unknown error occurred.' });
        }
      };
      
      xhr.onerror = () => {
          setUploadingField(null);
          toast({ variant: 'destructive', title: `Upload Failed for ${file.name}`, description: 'A network error occurred.' });
      }

      xhr.send(formData);

    }, [toast, firestore, form, item]);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnail' | 'source') => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file, field);
        }
        e.target.value = '';
    };
    
    const isUploading = !!uploadingField;

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
                        <fieldset disabled={!canEdit || isUploading} className="group space-y-8">
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
                                <FormLabel>Thumbnail URL</FormLabel>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                      <Input placeholder="https://example.com/thumbnail.jpg" {...field} />
                                  </FormControl>
                                  <input 
                                      type="file" 
                                      ref={thumbnailUploadRef} 
                                      className="hidden" 
                                      onChange={(e) => onFileSelect(e, 'thumbnail')}
                                      accept="image/*"
                                  />
                                  <Button type="button" variant="outline" size="sm" onClick={() => thumbnailUploadRef.current?.click()} disabled={uploadingField === 'thumbnail'}>
                                      <FontAwesomeIcon icon={uploadingField === 'thumbnail' ? faSpinner : faUpload} className={cn(uploadingField === 'thumbnail' && 'animate-spin')}/>
                                      <span className="ml-2 hidden sm:inline">Upload</span>
                                  </Button>
                                  <Button type="button" variant="outline" size="sm" onClick={handleChooseThumbnail}>
                                      <FontAwesomeIcon icon={faImages} />
                                      <span className="ml-2 hidden sm:inline">Library</span>
                                  </Button>
                                </div>
                                {uploadingField === 'thumbnail' && (
                                    <div className="mt-2">
                                        <Progress value={uploadProgress} />
                                        <p className="text-xs text-center mt-1 text-muted-foreground">{uploadProgress}%</p>
                                    </div>
                                )}
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
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                      <Input placeholder="https://example.com/full-image.jpg" {...field} />
                                  </FormControl>
                                  <input 
                                      type="file" 
                                      ref={sourceUploadRef} 
                                      className="hidden" 
                                      onChange={(e) => onFileSelect(e, 'source')}
                                      accept="image/*,video/*"
                                  />
                                  <Button type="button" variant="outline" size="sm" onClick={() => sourceUploadRef.current?.click()} disabled={uploadingField === 'source'}>
                                      <FontAwesomeIcon icon={uploadingField === 'source' ? faSpinner : faUpload} className={cn(uploadingField === 'source' && 'animate-spin')}/>
                                      <span className="ml-2 hidden sm:inline">Upload</span>
                                  </Button>
                                   <Button type="button" variant="outline" size="sm" onClick={handleChooseSource}>
                                    <FontAwesomeIcon icon={faImages} />
                                    <span className="ml-2 hidden sm:inline">Library</span>
                                  </Button>
                                </div>
                                {uploadingField === 'source' && (
                                    <div className="mt-2">
                                        <Progress value={uploadProgress} />
                                        <p className="text-xs text-center mt-1 text-muted-foreground">{uploadProgress}%</p>
                                    </div>
                                )}
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
